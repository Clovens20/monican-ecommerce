import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendEmail } from '@/lib/email';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * POST - Envoyer des emails de rappel pour les paniers abandonnés
 * Cette route peut être appelée par un cron job (ex: Vercel Cron, GitHub Actions, etc.)
 * 
 * Envoie un email aux clients qui ont abandonné leur panier il y a 3 heures
 */
export async function POST(request: NextRequest) {
    try {
        // Vérifier la clé secrète pour sécuriser l'endpoint
        const authHeader = request.headers.get('authorization');
        const expectedSecret = process.env.ABANDONED_CART_CRON_SECRET;
        
        if (expectedSecret && authHeader !== `Bearer ${expectedSecret}`) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Trouver les paniers abandonnés créés il y a 3 heures (status: pending)
        const threeHoursAgo = new Date();
        threeHoursAgo.setHours(threeHoursAgo.getHours() - 3);

        const { data: abandonedCarts, error: fetchError } = await supabase
            .from('abandoned_carts')
            .select('*')
            .eq('status', 'pending')
            .lt('created_at', threeHoursAgo.toISOString())
            .is('reminder_sent_at', null);

        if (fetchError) {
            console.error('Error fetching abandoned carts:', fetchError);
            return NextResponse.json(
                { error: 'Erreur lors de la récupération des paniers' },
                { status: 500 }
            );
        }

        if (!abandonedCarts || abandonedCarts.length === 0) {
            return NextResponse.json({
                success: true,
                message: 'Aucun panier à rappeler',
                count: 0,
            });
        }

        const results = {
            sent: 0,
            failed: 0,
            errors: [] as string[],
        };

        // Envoyer un email pour chaque panier
        for (const cart of abandonedCarts) {
            try {
                const cartData = cart.cart_data as any;
                const recoveryUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://monican.shop'}/cart/recover?token=${cart.token}`;

                // Préparer les données pour l'email
                const emailData = {
                    customerName: cart.email.split('@')[0], // Utiliser la partie avant @ comme nom
                    items: cartData.items || [],
                    total: cartData.total || 0,
                    currency: cartData.currency || 'USD',
                    recoveryUrl,
                };

                // Envoyer l'email
                const emailResult = await sendEmail({
                    to: cart.email,
                    subject: '🛒 Vous avez oublié quelque chose dans votre panier !',
                    template: 'abandoned_cart',
                    data: emailData,
                });

                if (emailResult.success) {
                    // Mettre à jour le statut du panier
                    await supabase
                        .from('abandoned_carts')
                        .update({
                            status: 'reminder_sent',
                            reminder_sent_at: new Date().toISOString(),
                        })
                        .eq('id', cart.id);

                    results.sent++;
                } else {
                    results.failed++;
                    results.errors.push(`Erreur pour ${cart.email}: ${emailResult.error}`);
                }
            } catch (error: any) {
                results.failed++;
                results.errors.push(`Erreur pour ${cart.email}: ${error.message}`);
                console.error(`Error sending reminder for cart ${cart.id}:`, error);
            }
        }

        return NextResponse.json({
            success: true,
            message: `Emails envoyés: ${results.sent}, Échecs: ${results.failed}`,
            ...results,
        });
    } catch (error: any) {
        console.error('Error in abandoned cart reminder API:', error);
        return NextResponse.json(
            { error: error.message || 'Erreur serveur' },
            { status: 500 }
        );
    }
}

