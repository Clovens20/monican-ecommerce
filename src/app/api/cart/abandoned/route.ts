import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { randomBytes } from 'crypto';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * POST - Sauvegarder un panier abandonné
 */
export async function POST(request: NextRequest) {
    try {
        const { email, cartData } = await request.json();

        if (!email || !email.includes('@')) {
            return NextResponse.json(
                { error: 'Email invalide' },
                { status: 400 }
            );
        }

        if (!cartData || !cartData.items || cartData.items.length === 0) {
            return NextResponse.json(
                { error: 'Panier vide' },
                { status: 400 }
            );
        }

        // Générer un token unique pour récupérer le panier
        const token = randomBytes(32).toString('hex');

        // Calculer la date d'expiration (7 jours)
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        // Vérifier si un panier abandonné existe déjà pour cet email (non récupéré)
        const { data: existingCart } = await supabase
            .from('abandoned_carts')
            .select('id')
            .eq('email', email)
            .in('status', ['pending', 'reminder_sent'])
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (existingCart) {
            // Mettre à jour le panier existant
            const { error: updateError } = await supabase
                .from('abandoned_carts')
                .update({
                    cart_data: cartData,
                    token,
                    expires_at: expiresAt.toISOString(),
                    updated_at: new Date().toISOString(),
                })
                .eq('id', existingCart.id);

            if (updateError) {
                console.error('Error updating abandoned cart:', updateError);
                return NextResponse.json(
                    { error: 'Erreur lors de la mise à jour du panier' },
                    { status: 500 }
                );
            }

            return NextResponse.json({
                success: true,
                token,
                message: 'Panier mis à jour',
            });
        }

        // Créer un nouveau panier abandonné
        const { data, error } = await supabase
            .from('abandoned_carts')
            .insert({
                email,
                cart_data: cartData,
                token,
                status: 'pending',
                expires_at: expiresAt.toISOString(),
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating abandoned cart:', error);
            return NextResponse.json(
                { error: 'Erreur lors de la sauvegarde du panier' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            token,
            message: 'Panier sauvegardé',
        });
    } catch (error: any) {
        console.error('Error in abandoned cart API:', error);
        return NextResponse.json(
            { error: error.message || 'Erreur serveur' },
            { status: 500 }
        );
    }
}

