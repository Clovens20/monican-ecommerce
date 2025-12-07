import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { updateOrderStatus, getOrderByPaymentId } from '@/lib/orders-db';
import { OrderStatus } from '@/lib/types';
import { supabaseAdmin } from '@/lib/supabase';
import { rateLimitMiddleware, RATE_LIMITS } from '@/lib/rate-limit';
import { release_reserved_stock } from '@/lib/inventory';

/**
 * Route pour recevoir les webhooks Square
 * 
 * Square envoie des événements pour:
 * - payment.updated: Paiement créé, complété, échoué, annulé
 * - refund.updated: Remboursement créé ou complété
 * 
 * Documentation: https://developer.squareup.com/docs/webhooks/using-webhooks
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting pour les webhooks (Square peut envoyer beaucoup)
    const rateLimitResponse = rateLimitMiddleware(request, RATE_LIMITS.webhook);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // 1. Vérifier la signature du webhook
    const signature = request.headers.get('x-square-signature');
    const webhookSignatureKey = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY;

    if (!signature || !webhookSignatureKey) {
      console.error('[WEBHOOK] Missing signature or webhook key');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Lire le body brut pour la vérification
    const body = await request.text();
    
    // Vérifier la signature HMAC
    const isValid = verifySquareWebhookSignature(
      body,
      signature,
      webhookSignatureKey
    );

    if (!isValid) {
      console.error('[WEBHOOK] Invalid signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // Parser le JSON
    const webhookData = JSON.parse(body);

    // 2. Traiter les événements
    // Square envoie les événements dans data.object.event_data ou directement dans data
    const events = webhookData.data?.object?.event_data || 
                   webhookData.data?.events || 
                   (webhookData.type ? [webhookData] : []);

    if (events.length === 0) {
      console.log('[WEBHOOK] No events found in webhook payload');
      return NextResponse.json({ received: true });
    }
    
    for (const event of events) {
      await handleSquareWebhookEvent(event);
    }

    // 3. Répondre à Square (obligatoire)
    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('[WEBHOOK] Error processing webhook:', error);
    // Toujours répondre 200 pour éviter que Square réessaie
    return NextResponse.json(
      { error: 'Internal error' },
      { status: 200 }
    );
  }
}

/**
 * Vérifie la signature HMAC du webhook Square
 */
function verifySquareWebhookSignature(
  body: string,
  signature: string,
  secret: string
): boolean {
  try {
    // Square envoie la signature au format: sha256=HASH
    const signatureParts = signature.split('=');
    if (signatureParts.length !== 2 || signatureParts[0] !== 'sha256') {
      return false;
    }

    const receivedHash = signatureParts[1];
    
    // Calculer le hash attendu
    const expectedHash = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex');

    // Comparaison sécurisée (timing-safe)
    return crypto.timingSafeEqual(
      Buffer.from(receivedHash),
      Buffer.from(expectedHash)
    );
  } catch (error) {
    console.error('[WEBHOOK] Error verifying signature:', error);
    return false;
  }
}

/**
 * Traite un événement webhook Square
 */
async function handleSquareWebhookEvent(event: any): Promise<void> {
  try {
    const eventType = event.type;
    const eventData = event.data;

    console.log(`[WEBHOOK] Processing event: ${eventType}`);

    switch (eventType) {
      case 'payment.updated':
        await handlePaymentUpdated(eventData);
        break;
      
      case 'refund.updated':
        await handleRefundUpdated(eventData);
        break;
      
      default:
        console.log(`[WEBHOOK] Unhandled event type: ${eventType}`);
    }
  } catch (error) {
    console.error('[WEBHOOK] Error handling event:', error);
    // Ne pas throw pour éviter de bloquer les autres événements
  }
}

/**
 * Gère l'événement payment.updated
 * ✅ CORRECTION 6: Utilise la fonction SQL update_order_payment_status et libère le stock en cas d'échec
 */
async function handlePaymentUpdated(paymentData: any): Promise<void> {
  try {
    const paymentId = paymentData.id;
    const paymentStatus = paymentData.status;

    if (!paymentId) {
      console.error('[WEBHOOK] Payment ID missing');
      return;
    }

    console.log(`💳 [WEBHOOK] Update paiement ${paymentId}: ${paymentStatus}`);

    // Trouver la commande associée
    const order = await getOrderByPaymentId(paymentId);

    if (!order) {
      console.warn(`[WEBHOOK] Order not found for payment ${paymentId}`);
      return;
    }

    // Utiliser la fonction SQL pour mise à jour atomique
    try {
      const { error } = await supabaseAdmin.rpc('update_order_payment_status', {
        p_payment_id: paymentId,
        p_payment_status: paymentStatus,
        p_updated_at: new Date().toISOString(),
      });

      if (error) {
        throw error;
      }

      // Ajouter à l'historique
      // Le statut de la commande est déjà mis à jour par la fonction SQL update_order_payment_status
      // On n'a pas besoin de le mettre à jour à nouveau ici, mais on peut ajouter un historique si nécessaire
      const newOrderStatus: OrderStatus = paymentStatus === 'COMPLETED' ? 'processing' : 
                            (paymentStatus === 'FAILED' || paymentStatus === 'CANCELED' ? 'cancelled' : 'pending');

      await updateOrderStatus(
        order.id,
        newOrderStatus,
        `Paiement ${paymentStatus} (webhook Square)`,
        'system'
      );

      console.log(`✅ [WEBHOOK] Paiement mis à jour pour la commande ${order.id}`);

      // Libérer le stock si le paiement a échoué
      if (paymentStatus === 'FAILED' || paymentStatus === 'CANCELED') {
        await onPaymentFailed(paymentId, order.id);
      }

    } catch (error: any) {
      console.error('[WEBHOOK] Error updating payment status:', error);
      throw error;
    }

  } catch (error) {
    console.error('[WEBHOOK] Error handling payment.updated:', error);
    throw error;
  }
}

/**
 * Libère le stock réservé en cas d'échec de paiement
 */
async function onPaymentFailed(paymentId: string, orderId: string): Promise<void> {
  console.log(`❌ [WEBHOOK] Paiement échoué, libération du stock pour la commande ${orderId}...`);

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
 * Gère l'événement refund.updated
 */
async function handleRefundUpdated(refundData: any): Promise<void> {
  try {
    const paymentId = refundData.payment_id;
    const refundStatus = refundData.status;

    if (!paymentId) {
      console.error('[WEBHOOK] Payment ID missing in refund');
      return;
    }

    // Trouver la commande associée
    const order = await getOrderByPaymentId(paymentId);

    if (!order) {
      console.warn(`[WEBHOOK] Order not found for refund payment ${paymentId}`);
      return;
    }

    if (refundStatus === 'COMPLETED') {
      // Mettre à jour la commande
      await supabaseAdmin
        .from('orders')
        .update({
          payment_status: 'refunded',
          status: 'cancelled',
          updated_at: new Date().toISOString(),
        })
        .eq('payment_id', paymentId);

      // Ajouter à l'historique
      await updateOrderStatus(
        order.id,
        'cancelled',
        `Remboursement complété (webhook Square)`,
        'system'
      );

      console.log(`[WEBHOOK] Refunded order ${order.id}`);
    }

  } catch (error) {
    console.error('[WEBHOOK] Error handling refund.updated:', error);
    throw error;
  }
}

/**
 * GET endpoint pour vérifier que le webhook est accessible
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Square webhook endpoint is active',
    timestamp: new Date().toISOString(),
  });
}

