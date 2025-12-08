import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * Route de callback OAuth Square
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // 1. Vérifier s'il y a une erreur renvoyée par Square
    if (error) {
      console.error('Square OAuth error:', error);
      return NextResponse.redirect(
        new URL(`/admin/settings?error=${encodeURIComponent(error)}`, request.url)
      );
    }

    // 2. Vérifier que le code et le state sont présents
    if (!code || !state) {
      return NextResponse.redirect(
        new URL('/admin/settings?error=missing_parameters', request.url)
      );
    }

    // Extraire l'ID utilisateur du state (format: userId-timestamp-random)
    const userId = state.split('-')[0];
    if (!userId) {
      return NextResponse.redirect(
        new URL('/admin/settings?error=invalid_state', request.url)
      );
    }

    console.log('🔄 OAuth Callback - Début du traitement pour userId:', userId);

    // 3. Récupérer les credentials Square depuis les variables d'environnement
    const clientId = process.env.SQUARE_CLIENT_ID || process.env.NEXT_PUBLIC_SQUARE_CLIENT_ID;
    const clientSecret = process.env.SQUARE_CLIENT_SECRET;
    const redirectUri =
      process.env.SQUARE_REDIRECT_URI || 
      (process.env.NODE_ENV === 'development'
        ? 'http://localhost:3000/api/oauth/callback'
        : 'https://www.monican.shop/api/oauth/callback');

    if (!clientId || !clientSecret) {
      console.error('❌ Square credentials not configured');
      console.error('SQUARE_CLIENT_ID:', clientId ? '✅ Configuré' : '❌ Manquant');
      console.error('SQUARE_CLIENT_SECRET:', clientSecret ? '✅ Configuré' : '❌ Manquant');
      return NextResponse.redirect(
        new URL('/admin/settings?error=server_config', request.url)
      );
    }

    // 4. Échanger le code contre un access_token
    console.log('🔄 Échange du code OAuth contre un access token...');
    const params = new URLSearchParams();
    params.append('client_id', clientId);
    params.append('client_secret', clientSecret);
    params.append('code', code);
    params.append('grant_type', 'authorization_code');
    params.append('redirect_uri', redirectUri);

    const tokenResponse = await fetch('https://connect.squareup.com/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Square-Version': '2023-10-18',
      },
      body: params.toString(),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('❌ Square token exchange error:', errorData);
      return NextResponse.redirect(
        new URL('/admin/settings?error=token_exchange_failed', request.url)
      );
    }

    const tokenData = await tokenResponse.json();
    const { access_token, expires_at, merchant_id } = tokenData;

    if (!access_token) {
      console.error('❌ No access token in response:', tokenData);
      return NextResponse.redirect(
        new URL('/admin/settings?error=no_token', request.url)
      );
    }

    console.log('✅ Access token reçu, merchant_id:', merchant_id || 'non fourni');

    // 5. Récupérer le merchant_id si non fourni
    let finalMerchantId = merchant_id;
    if (!finalMerchantId) {
      try {
        console.log('🔄 Récupération du merchant_id depuis l\'API Square...');
        const merchantResponse = await fetch('https://connect.squareup.com/v2/merchants/me', {
          headers: {
            Authorization: `Bearer ${access_token}`,
            'Square-Version': '2023-10-18',
          },
        });

        if (merchantResponse.ok) {
          const merchantData = await merchantResponse.json();
          if (merchantData.merchant && merchantData.merchant.length > 0) {
            finalMerchantId = merchantData.merchant[0].id;
            console.log('✅ Merchant ID récupéré:', finalMerchantId);
          }
        }
      } catch (err) {
        console.warn('⚠️ Could not fetch merchant ID, continuing without it:', err);
      }
    }

    // 6. Convertir expires_at en Date
    let expiresAtDate: string | null = null;
    if (expires_at) {
      if (typeof expires_at === 'string') {
        expiresAtDate = new Date(expires_at).toISOString();
      } else if (typeof expires_at === 'number') {
        expiresAtDate = new Date(expires_at * 1000).toISOString();
      }
    }

    // 7. Vérifier que l'utilisateur existe avant de sauvegarder
    console.log('🔍 Vérification de l\'existence de l\'utilisateur...');
    const { data: userExists, error: userCheckError } = await supabaseAdmin
      .from('user_profiles')
      .select('id')
      .eq('id', userId)
      .single();

    if (userCheckError || !userExists) {
      console.error('❌ Utilisateur non trouvé:', userId);
      console.error('Erreur:', userCheckError);
      return NextResponse.redirect(
        new URL('/admin/settings?error=database_error&details=user_not_found', request.url)
      );
    }

    console.log('✅ Utilisateur trouvé, sauvegarde du token Square...');

    // 8. Stocker l'access_token en base Supabase
    const updateData = {
      square_access_token: access_token,
      square_access_token_expires_at: expiresAtDate,
      square_merchant_id: finalMerchantId || null,
      square_connected_at: new Date().toISOString(),
    };

    console.log('📝 Données à sauvegarder:', {
      hasAccessToken: !!updateData.square_access_token,
      hasExpiresAt: !!updateData.square_access_token_expires_at,
      merchantId: updateData.square_merchant_id,
      connectedAt: updateData.square_connected_at,
      userId: userId,
    });

    // Vérifier que supabaseAdmin est bien configuré
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY === 'placeholder-service-role-key') {
      console.error('❌ SUPABASE_SERVICE_ROLE_KEY n\'est pas configuré');
      return NextResponse.redirect(
        new URL('/admin/settings?error=server_config&details=supabase_not_configured', request.url)
      );
    }

    const { data: updatedUser, error: dbError } = await supabaseAdmin
      .from('user_profiles')
      .update(updateData)
      .eq('id', userId)
      .select();

    if (dbError) {
      console.error('❌ Error saving Square token to database:');
      console.error('Code:', dbError.code);
      console.error('Message:', dbError.message);
      console.error('Details:', dbError.details);
      console.error('Hint:', dbError.hint);
      console.error('Full error:', JSON.stringify(dbError, null, 2));
      
      // Retourner une erreur plus spécifique
      let errorType = 'database_error';
      if (dbError.code === '23503') {
        errorType = 'database_error&details=foreign_key_violation';
      } else if (dbError.code === '23505') {
        errorType = 'database_error&details=unique_violation';
      } else if (dbError.code === '42501') {
        errorType = 'database_error&details=permission_denied';
      } else if (dbError.code === '42703') {
        errorType = 'database_error&details=column_not_found';
      }
      
      return NextResponse.redirect(
        new URL(`/admin/settings?error=${errorType}`, request.url)
      );
    }

    if (!updatedUser || updatedUser.length === 0) {
      console.error('❌ Aucune ligne mise à jour');
      return NextResponse.redirect(
        new URL('/admin/settings?error=database_error&details=no_rows_updated', request.url)
      );
    }

    console.log('✅ Square token sauvegardé avec succès!');
    console.log('Utilisateur mis à jour:', updatedUser[0]?.id);
    console.log('Token sauvegardé:', !!updatedUser[0]?.square_access_token);
    console.log('Merchant ID sauvegardé:', updatedUser[0]?.square_merchant_id);

    // 9. Rediriger vers la page des paramètres avec succès
    return NextResponse.redirect(
      new URL('/admin/settings?success=square_connected', request.url)
    );
  } catch (error) {
    console.error('❌ Error in OAuth callback:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    return NextResponse.redirect(
      new URL('/admin/settings?error=unexpected_error', request.url)
    );
  }
}