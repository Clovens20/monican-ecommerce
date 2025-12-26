import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * GET - Récupérer un panier abandonné par token
 */
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const token = searchParams.get('token');

        if (!token) {
            return NextResponse.json(
                { error: 'Token manquant' },
                { status: 400 }
            );
        }

        // Récupérer le panier
        const { data: cart, error } = await supabase
            .from('abandoned_carts')
            .select('*')
            .eq('token', token)
            .single();

        if (error || !cart) {
            return NextResponse.json(
                { error: 'Panier introuvable ou expiré' },
                { status: 404 }
            );
        }

        // Vérifier si le panier est expiré
        const expiresAt = new Date(cart.expires_at);
        if (expiresAt < new Date()) {
            return NextResponse.json(
                { error: 'Ce panier a expiré' },
                { status: 410 }
            );
        }

        return NextResponse.json({
            success: true,
            cartData: cart.cart_data,
        });
    } catch (error: any) {
        console.error('Error recovering cart:', error);
        return NextResponse.json(
            { error: error.message || 'Erreur serveur' },
            { status: 500 }
        );
    }
}

/**
 * POST - Marquer un panier comme récupéré
 */
export async function POST(request: NextRequest) {
    try {
        const { token } = await request.json();

        if (!token) {
            return NextResponse.json(
                { error: 'Token manquant' },
                { status: 400 }
            );
        }

        // Mettre à jour le statut du panier
        const { error } = await supabase
            .from('abandoned_carts')
            .update({
                status: 'recovered',
                recovered_at: new Date().toISOString(),
            })
            .eq('token', token);

        if (error) {
            console.error('Error updating cart status:', error);
            return NextResponse.json(
                { error: 'Erreur lors de la mise à jour' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Panier marqué comme récupéré',
        });
    } catch (error: any) {
        console.error('Error in recover cart API:', error);
        return NextResponse.json(
            { error: error.message || 'Erreur serveur' },
            { status: 500 }
        );
    }
}

