import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * Route pour vérifier le statut de connexion Square d'un utilisateur
 */
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json(
                { error: 'User ID required' },
                { status: 400 }
            );
        }

        // Récupérer le profil utilisateur
        const { data: profile, error } = await supabaseAdmin
            .from('user_profiles')
            .select('square_access_token, square_merchant_id, square_connected_at')
            .eq('id', userId)
            .single();

        if (error) {
            console.error('Error fetching user profile:', error);
            return NextResponse.json(
                { error: 'Database error' },
                { status: 500 }
            );
        }

        const connected = !!(profile?.square_access_token && profile?.square_merchant_id);

        return NextResponse.json({
            connected,
            merchantId: profile?.square_merchant_id || null,
            connectedAt: profile?.square_connected_at || null,
        });

    } catch (error) {
        console.error('Error in square-status route:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

