import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * Route pour vérifier le statut de connexion Square d'un utilisateur
 */
export async function GET(request: NextRequest) {
    try {
        // Vérifier que supabaseAdmin est configuré
        if (!process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY === 'placeholder-service-role-key') {
            console.error('❌ SUPABASE_SERVICE_ROLE_KEY n\'est pas configuré');
            return NextResponse.json(
                { 
                    connected: false,
                    error: 'Configuration serveur manquante',
                    merchantId: null,
                    connectedAt: null
                },
                { status: 200 } // Retourner 200 pour ne pas bloquer l'interface
            );
        }

        const searchParams = request.nextUrl.searchParams;
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json(
                { 
                    connected: false,
                    error: 'User ID required',
                    merchantId: null,
                    connectedAt: null
                },
                { status: 400 }
            );
        }

        // Récupérer le profil utilisateur
        console.log('🔍 Récupération du profil utilisateur pour:', userId);
        const { data: profile, error } = await supabaseAdmin
            .from('user_profiles')
            .select('square_access_token, square_merchant_id, square_connected_at')
            .eq('id', userId)
            .maybeSingle();

        // Si la table n'existe pas ou les colonnes n'existent pas
        if (error) {
            // Erreur de colonne manquante (42P01 = table n'existe pas, 42703 = colonne n'existe pas)
            if (error.code === '42P01' || error.code === '42703') {
                console.warn('⚠️ Colonnes Square non disponibles dans user_profiles:', error.message);
                return NextResponse.json({
                    connected: false,
                    merchantId: null,
                    connectedAt: null,
                    error: 'Square columns not available'
                }, { status: 200 });
            }

            // Erreur si l'utilisateur n'existe pas (PGRST116)
            if (error.code === 'PGRST116') {
                console.warn('⚠️ Utilisateur non trouvé:', userId);
                return NextResponse.json({
                    connected: false,
                    merchantId: null,
                    connectedAt: null,
                    error: 'User not found'
                }, { status: 200 });
            }

            console.error('❌ Error fetching user profile:', error);
            return NextResponse.json(
                { 
                    connected: false,
                    error: 'Database error',
                    merchantId: null,
                    connectedAt: null
                },
                { status: 200 }
            );
        }

        // Si le profil n'existe pas
        if (!profile) {
            console.log('⚠️ Profil utilisateur non trouvé');
            return NextResponse.json({
                connected: false,
                merchantId: null,
                connectedAt: null,
            }, { status: 200 });
        }

        const connected = !!(profile?.square_access_token && profile?.square_merchant_id);
        
        console.log('✅ Profil récupéré:', {
            hasAccessToken: !!profile?.square_access_token,
            hasMerchantId: !!profile?.square_merchant_id,
            connected: connected,
            merchantId: profile?.square_merchant_id || null,
            connectedAt: profile?.square_connected_at || null
        });

        return NextResponse.json({
            connected,
            merchantId: profile?.square_merchant_id || null,
            connectedAt: profile?.square_connected_at || null,
        });

    } catch (error: any) {
        console.error('❌ Error in square-status route:', error);
        return NextResponse.json(
            { 
                connected: false,
                error: 'Internal server error',
                merchantId: null,
                connectedAt: null
            },
            { status: 200 } // Retourner 200 pour ne pas bloquer l'interface
        );
    }
}

