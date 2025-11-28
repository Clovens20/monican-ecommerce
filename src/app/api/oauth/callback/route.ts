import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * Route de callback OAuth Square
 * 
 * Cette route :
 * 1. Récupère le code d'autorisation depuis Square
 * 2. Échange le code contre un access_token
 * 3. Stocke l'access_token en base de données lié à l'utilisateur (via le paramètre state)
 */
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const error = searchParams.get('error');

        // Vérifier s'il y a une erreur
        if (error) {
            console.error('Square OAuth error:', error);
            return NextResponse.redirect(
                new URL(`/admin/settings?error=${encodeURIComponent(error)}`, request.url)
            );
        }

        // Vérifier que le code et le state sont présents
        if (!code || !state) {
            return NextResponse.redirect(
                new URL('/admin/settings?error=missing_parameters', request.url)
            );
        }

        // Extraire l'ID utilisateur du state (format: userId-timestamp)
        const userId = state.split('-')[0];
        
        if (!userId) {
            return NextResponse.redirect(
                new URL('/admin/settings?error=invalid_state', request.url)
            );
        }

        // Récupérer les credentials Square depuis les variables d'environnement
        const clientId = process.env.SQUARE_CLIENT_ID;
        const clientSecret = process.env.SQUARE_CLIENT_SECRET;
        const redirectUri = process.env.SQUARE_REDIRECT_URI || 'https://www.monican.shop/oauth/callback';

        if (!clientId || !clientSecret) {
            console.error('Square credentials not configured');
            return NextResponse.redirect(
                new URL('/admin/settings?error=server_config', request.url)
            );
        }

        // Échanger le code contre un access_token
        // Square utilise application/x-www-form-urlencoded pour OAuth
        const params = new URLSearchParams();
        params.append('client_id', clientId);
        params.append('client_secret', clientSecret);
        params.append('code', code);
        params.append('grant_type', 'authorization_code');

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
            console.error('Square token exchange error:', errorData);
            return NextResponse.redirect(
                new URL('/admin/settings?error=token_exchange_failed', request.url)
            );
        }

        const tokenData = await tokenResponse.json();
        const { access_token, expires_at, token_type, merchant_id } = tokenData;

        if (!access_token) {
            console.error('No access token in response:', tokenData);
            return NextResponse.redirect(
                new URL('/admin/settings?error=no_token', request.url)
            );
        }

        // Récupérer le merchant_id si non fourni dans la réponse
        let finalMerchantId = merchant_id;
        if (!finalMerchantId && access_token) {
            try {
                // Appel API Square pour récupérer les informations du marchand
                const merchantResponse = await fetch('https://connect.squareup.com/v2/merchants/me', {
                    headers: {
                        'Authorization': `Bearer ${access_token}`,
                        'Square-Version': '2023-10-18',
                    },
                });

                if (merchantResponse.ok) {
                    const merchantData = await merchantResponse.json();
                    // Square retourne un tableau de merchants, on prend le premier
                    if (merchantData.merchant && merchantData.merchant.length > 0) {
                        finalMerchantId = merchantData.merchant[0].id;
                    }
                }
            } catch (err) {
                console.warn('Could not fetch merchant ID, continuing without it:', err);
            }
        }

        // Convertir expires_at en Date si c'est une string ISO ou un timestamp
        let expiresAtDate: Date | null = null;
        if (expires_at) {
            if (typeof expires_at === 'string') {
                expiresAtDate = new Date(expires_at);
            } else if (typeof expires_at === 'number') {
                expiresAtDate = new Date(expires_at * 1000); // Si c'est un timestamp Unix
            }
        }

        // Stocker l'access_token en base de données
        const { error: dbError } = await supabaseAdmin
            .from('user_profiles')
            .update({
                square_access_token: access_token,
                square_access_token_expires_at: expiresAtDate?.toISOString() || null,
                square_merchant_id: finalMerchantId || null,
                square_connected_at: new Date().toISOString(),
            })
            .eq('id', userId);

        if (dbError) {
            console.error('Error saving Square token to database:', dbError);
            return NextResponse.redirect(
                new URL('/admin/settings?error=database_error', request.url)
            );
        }

        // Rediriger vers la page des paramètres avec un message de succès
        return NextResponse.redirect(
            new URL('/admin/settings?success=square_connected', request.url)
        );

    } catch (error) {
        console.error('Error in OAuth callback:', error);
        return NextResponse.redirect(
            new URL('/admin/settings?error=unexpected_error', request.url)
        );
    }
}

