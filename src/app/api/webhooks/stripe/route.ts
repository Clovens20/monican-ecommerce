import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { updateOrderStatus, getOrderByPaymentId } from '@/lib/orders-db';
import { OrderStatus } from '@/lib/types';
import { supabaseAdmin } from '@/lib/supabase';
import { rateLimitMiddleware, RATE_LIMITS } from '@/lib/rate-limit';
import { release_reserved_stock } from '@/lib/inventory';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2025-12-15.clover',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

/**
 * POST - Reçoit les webhooks Stripe
 * 
 * Stripe envoie des événements pour:
 * - payment_intent.succeeded: Paiement réussi
 * - payment_intent.payment_failed: Paiement échoué
 * - charge.refunded: Remboursement complété
 * 
 * Documentation: https://stripe.com/docs/webhooks
 */
export async function POST(request: NextRequest) {
    try {
        // Rate limiting pour les webhooks
        const rateLimitResponse = rateLimitMiddleware(request, RATE_LIMITS.webhook);
        if (rateLimitResponse) {
            return rateLimitResponse;
        }

        if (!webhookSecret) {
            console.error('[WEBHOOK] STRIPE_WEBHOOK_SECRET not configured');
            return NextResponse.json(
                { error: 'Webhook secret not configured' },
                { status: 500 }
            );
        }

        // Lire le body brut pour la vérification de signature
        const body = await request.text();
        const signature = request.headers.get('stripe-signature');

        if (!signature) {
            console.error('[WEBHOOK] Missing stripe-signature header');
            return NextResponse.json(
                { error: 'Missing signature' },
                { status: 400 }
            );
        }

        // Vérifier la signature du webhook
        let event: Stripe.Event;
        try {
            event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
        } catch (err: any) {
            console.error('[WEBHOOK] Invalid signature:', err.message);
            return NextResponse.json(
                { error: `Webhook signature verification failed: ${err.message}` },
                { status: 400 }
            );
        }

        // Traiter l'événement
        await handleStripeWebhookEvent(event);

        // Répondre à Stripe (obligatoire)
        return NextResponse.json({ received: true });

    } catch (error: any) {
        console.error('[WEBHOOK] Error processing webhook:', error);
        // Toujours répondre 200 pour éviter que Stripe réessaie
        return NextResponse.json(
            { error: 'Internal error' },
            { status: 200 }
        );
    }
}

/**
 * Traite un événement webhook Stripe
 */
async function handleStripeWebhookEvent(event: Stripe.Event): Promise<void> {
    try {
        console.log(`[WEBHOOK] Processing event: ${event.type}`);

        switch (event.type) {
            case 'payment_intent.succeeded':
                await handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent);
                break;

            case 'payment_intent.payment_failed':
                await handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
                break;

            case 'charge.refunded':
                await handleRefundCompleted(event.data.object as Stripe.Charge);
                break;

            default:
                console.log(`[WEBHOOK] Unhandled event type: ${event.type}`);
        }
    } catch (error) {
        console.error('[WEBHOOK] Error handling event:', error);
        // Ne pas throw pour éviter de bloquer les autres événements
    }
}

/**
 * Gère l'événement payment_intent.succeeded
 */
async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    try {
        const paymentId = paymentIntent.id;

        console.log(`💳 [WEBHOOK] Paiement réussi: ${paymentId}`);

        // Trouver la commande associée
        const order = await getOrderByPaymentId(paymentId);

        if (!order) {
            console.warn(`[WEBHOOK] Order not found for payment ${paymentId}`);
            return;
        }

        // Mettre à jour le statut de la commande
        await supabaseAdmin
            .from('orders')
            .update({
                payment_status: 'completed',
                status: 'processing',
                updated_at: new Date().toISOString(),
            })
            .eq('payment_id', paymentId);

        // Ajouter à l'historique
        await updateOrderStatus(
            order.id,
            'processing',
            `Paiement réussi (webhook Stripe)`,
            'system'
        );

        console.log(`✅ [WEBHOOK] Commande ${order.id} mise à jour: processing`);
    } catch (error) {
        console.error('[WEBHOOK] Error handling payment succeeded:', error);
        throw error;
    }
}

/**
 * Gère l'événement payment_intent.payment_failed
 */
async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    try {
        const paymentId = paymentIntent.id;

        console.log(`❌ [WEBHOOK] Paiement échoué: ${paymentId}`);

        // Trouver la commande associée
        const order = await getOrderByPaymentId(paymentId);

        if (!order) {
            console.warn(`[WEBHOOK] Order not found for payment ${paymentId}`);
            return;
        }

        // Mettre à jour le statut de la commande
        await supabaseAdmin
            .from('orders')
            .update({
                payment_status: 'failed',
                status: 'cancelled',
                updated_at: new Date().toISOString(),
            })
            .eq('payment_id', paymentId);

        // Ajouter à l'historique
        await updateOrderStatus(
            order.id,
            'cancelled',
            `Paiement échoué (webhook Stripe)`,
            'system'
        );

        // Libérer le stock réservé
        await onPaymentFailed(paymentId, order.id);

        console.log(`✅ [WEBHOOK] Commande ${order.id} annulée et stock libéré`);
    } catch (error) {
        console.error('[WEBHOOK] Error handling payment failed:', error);
        throw error;
    }
}

/**
 * Libère le stock réservé en cas d'échec de paiement
 */
async function onPaymentFailed(paymentId: string, orderId: string): Promise<void> {
    console.log(`❌ [WEBHOOK] Libération du stock pour la commande ${orderId}...`);

    try {
        // Récupérer les items de la commande
        const { data: orderItems, error: itemsError } = await supabaseAdmin
            .from('order_items')
            .select('product_id, size, quantity')
            .eq('order_id', orderId);

        if (itemsError) {
            console.error('[WEBHOOK] Erreur récupération order_items:', itemsError);
            return;
        }

        if (orderItems && orderItems.length > 0) {
            // Libérer le stock pour tous les items
            const releaseResults = await Promise.all(
                orderItems.map((item: any) =>
                    release_reserved_stock(
                        item.product_id,
                        item.size,
                        item.quantity
                    )
                )
            );

            const failedReleases = releaseResults.filter(result => !result);
            if (failedReleases.length > 0) {
                console.error(`❌ [WEBHOOK] ${failedReleases.length} libérations de stock ont échoué`);
            } else {
                console.log(`✅ [WEBHOOK] Stock libéré pour ${orderItems.length} items`);
            }
        }
    } catch (error) {
        console.error('[WEBHOOK] Erreur libération stock:', error);
    }
}

/**
 * Gère l'événement charge.refunded
 */
async function handleRefundCompleted(charge: Stripe.Charge): Promise<void> {
    try {
        const paymentIntentId = charge.payment_intent as string;

        if (!paymentIntentId) {
            console.error('[WEBHOOK] Payment intent ID missing in refund');
            return;
        }

        console.log(`💰 [WEBHOOK] Remboursement complété pour ${paymentIntentId}`);

        // Trouver la commande associée
        const order = await getOrderByPaymentId(paymentIntentId);

        if (!order) {
            console.warn(`[WEBHOOK] Order not found for refund payment ${paymentIntentId}`);
            return;
        }

        // Mettre à jour la commande
        await supabaseAdmin
            .from('orders')
            .update({
                payment_status: 'refunded',
                status: 'cancelled',
                updated_at: new Date().toISOString(),
            })
            .eq('payment_id', paymentIntentId);

        // Ajouter à l'historique
        await updateOrderStatus(
            order.id,
            'cancelled',
            `Remboursement complété (webhook Stripe)`,
            'system'
        );

        console.log(`✅ [WEBHOOK] Commande ${order.id} remboursée`);
    } catch (error) {
        console.error('[WEBHOOK] Error handling refund completed:', error);
        throw error;
    }
}

/**
 * GET endpoint pour vérifier que le webhook est accessible
 */
export async function GET() {
    return NextResponse.json({
        status: 'ok',
        message: 'Stripe webhook endpoint is active',
        timestamp: new Date().toISOString(),
    });
}

