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

    // 5. Récupérer le merchant_id si non fourni
    let finalMerchantId = merchant_id;
    if (!finalMerchantId) {
      try {
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

    // 7. Vérifier que les colonnes existent avant de sauvegarder
    try {
      // Tester si les colonnes existent
      const { error: testError } = await supabaseAdmin
        .from('user_profiles')
        .select('square_access_token')
        .limit(1);

      if (testError && (testError.code === '42703' || testError.code === '42P01')) {
        console.error('❌ Colonnes Square non disponibles dans user_profiles');
        console.error('Détails:', testError.message);
        console.error('Code erreur:', testError.code);
        return NextResponse.redirect(
          new URL('/admin/settings?error=database_error&details=columns_missing', request.url)
        );
      }

      // Stocker l'access_token en base Supabase
      const { error: dbError } = await supabaseAdmin
        .from('user_profiles')
        .update({
          square_access_token: access_token,
          square_access_token_expires_at: expiresAtDate,
          square_merchant_id: finalMerchantId || null,
          square_connected_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (dbError) {
        console.error('❌ Error saving Square token to database:', dbError);
        return NextResponse.redirect(
          new URL('/admin/settings?error=database_error', request.url)
        );
      }
    } catch (dbErr: any) {
      console.error('❌ Database error:', dbErr);
      return NextResponse.redirect(
        new URL('/admin/settings?error=database_error', request.url)
      );
    }

    // 8. Rediriger vers la page des paramètres avec succès
    return NextResponse.redirect(
      new URL('/admin/settings?success=square_connected', request.url)
    );
  } catch (error) {
    console.error('❌ Error in OAuth callback:', error);
    return NextResponse.redirect(
      new URL('/admin/settings?error=unexpected_error', request.url)
    );
  }
}