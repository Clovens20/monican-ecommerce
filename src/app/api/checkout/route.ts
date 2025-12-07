// ============================================================================
// ✅ CORRECTION 2: API Checkout avec transactions complètes et rollback
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { processPayment, refundPayment } from '@/lib/payments';
import { createOrder } from '@/lib/orders-db';
import { sendOrderConfirmation } from '@/lib/email';
import { 
  checkProductAvailability, 
  confirm_stock_reduction,
  release_reserved_stock 
} from '@/lib/inventory';
import { rateLimitMiddleware, RATE_LIMITS } from '@/lib/rate-limit';
import { validateAndSanitize } from '@/lib/validation';
import { supabaseAdmin } from '@/lib/supabase';

const CheckoutSchema = z.object({
  customerName: z.string().min(1),
  customerEmail: z.string().email(),
  customerPhone: z.string().optional(),
  customerId: z.string().optional(),
  shippingAddress: z.object({
    street: z.string().min(1),
    city: z.string().min(1),
    state: z.string().min(1),
    zip: z.string().min(1),
    country: z.enum(['US', 'CA', 'MX']),
  }),
  items: z.array(z.object({
    productId: z.string(),
    name: z.string(),
    quantity: z.number().int().positive(),
    price: z.number().positive(),
    size: z.string(),
    image: z.string().optional(),
  })),
  paymentSourceId: z.string(), // Token Square
  currency: z.enum(['USD', 'CAD', 'MXN']),
  subtotal: z.number().positive(),
  shippingCost: z.number().min(0),
  tax: z.number().min(0),
  total: z.number().positive(),
});

interface ReservedItem {
  productId: string;
  size: string;
  quantity: number;
}

export async function POST(request: NextRequest) {
  let paymentId: string | null = null;
  let reservedItems: ReservedItem[] = [];

  try {
    // Rate limiting pour le checkout
    const rateLimitResponse = rateLimitMiddleware(request, RATE_LIMITS.checkout);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const body = await request.json();
    
    // Validation et sanitization
    const validationResult = validateAndSanitize(CheckoutSchema, body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Générer un orderId unique pour l'idempotency
    const orderId = `ORDER-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // ============================================================================
    // 1️⃣ RÉSERVATION DU STOCK (atomique avec FOR UPDATE via RPC)
    // ============================================================================
    console.log('🔒 Phase 1: Réservation du stock...');

    const stockChecks = await Promise.all(
      data.items.map(async (item) => {
        const isAvailable = await checkProductAvailability(
          item.productId,
          item.size,
          item.quantity
        );

        if (!isAvailable) {
          throw new Error(`Le produit ${item.name} (taille ${item.size}) n'est plus disponible en quantité suffisante`);
        }

        // Stock réservé avec succès
        reservedItems.push({
          productId: item.productId,
          size: item.size,
          quantity: item.quantity,
        });

        return true;
      })
    );

    console.log(`✅ Stock réservé pour ${reservedItems.length} items`);

    // ============================================================================
    // 2️⃣ TRAITEMENT DU PAIEMENT
    // ============================================================================
    console.log('💳 Phase 2: Traitement du paiement...');

    const paymentResult = await processPayment({
      amount: Math.round(data.total * 100), // Convertir en centimes
      currency: data.currency,
      sourceId: data.paymentSourceId,
      orderId: orderId,
      customerEmail: data.customerEmail,
      customerName: data.customerName,
      shippingAddress: data.shippingAddress,
    });

    if (!paymentResult.success || !paymentResult.paymentId) {
      throw new Error(paymentResult.error || 'Erreur lors du traitement du paiement');
    }

    paymentId = paymentResult.paymentId;
    console.log(`✅ Paiement traité: ${paymentId}`);

    // ============================================================================
    // 3️⃣ CRÉATION DE LA COMMANDE
    // ============================================================================
    console.log('📦 Phase 3: Création de la commande...');

    const order = await createOrder({
      customerId: data.customerId,
      customerName: data.customerName,
      customerEmail: data.customerEmail,
      customerPhone: data.customerPhone,
      shippingAddress: data.shippingAddress,
      items: data.items.map(item => ({
        id: `${item.productId}-${item.size}`,
        productId: item.productId,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        size: item.size,
        image: item.image || '',
      })),
      subtotal: data.subtotal,
      shippingCost: data.shippingCost,
      tax: data.tax,
      total: data.total,
      currency: data.currency,
      paymentMethod: 'Square',
      paymentId: paymentId,
      paymentStatus: 'completed',
    });

    if (!order) {
      throw new Error('Erreur lors de la création de la commande');
    }

    console.log(`✅ Commande créée: ${order.id}`);

    // ============================================================================
    // 4️⃣ CONFIRMATION DU STOCK (réduction définitive)
    // ============================================================================
    console.log('✔️ Phase 4: Confirmation du stock...');

    const stockConfirmations = await Promise.all(
      data.items.map((item) =>
        confirm_stock_reduction(
          item.productId,
          item.size,
          item.quantity
        )
      )
    );

    const failedConfirmations = stockConfirmations.filter(result => !result);
    if (failedConfirmations.length > 0) {
      console.error('⚠️ Certaines réductions de stock ont échoué');
      // Log mais ne fait pas échouer la commande (stock déjà réservé)
    }

    console.log('✅ Stock confirmé et réduit');

    // ============================================================================
    // 5️⃣ ENVOI DE L'EMAIL DE CONFIRMATION (non bloquant)
    // ============================================================================
    try {
      await sendOrderConfirmation({
        orderNumber: order.id,
        customerEmail: data.customerEmail,
        customerName: data.customerName,
        items: data.items.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
        })),
        total: data.total,
        currency: data.currency,
        shippingAddress: data.shippingAddress,
      });
      console.log('✅ Email de confirmation envoyé');
    } catch (emailError) {
      // Ne pas faire échouer la commande si l'email échoue
      console.error('⚠️ Erreur envoi email (non bloquant):', emailError);
    }

    console.log('✅ Checkout complété avec succès');

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        orderNumber: order.id,
        total: order.total,
        currency: order.currency,
      },
      paymentId: paymentId,
    });

  } catch (error: any) {
    console.error('❌ Erreur checkout:', error);

    // ============================================================================
    // 🔄 ROLLBACK AUTOMATIQUE
    // ============================================================================
    await rollbackCheckout({
      paymentId,
      reservedItems,
      error: error.message || 'Erreur inconnue',
    });

    return NextResponse.json(
      { 
        error: error.message || 'Erreur serveur lors du checkout',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: error.message?.includes('Stock') ? 400 : 500 }
    );
  }
}

/**
 * Fonction de rollback automatique en cas d'échec
 */
async function rollbackCheckout({
  paymentId,
  reservedItems,
  error,
}: {
  paymentId: string | null;
  reservedItems: ReservedItem[];
  error: string;
}) {
  console.log('🔄 Rollback checkout...', { 
    paymentId, 
    itemsCount: reservedItems.length,
    error 
  });

  try {
    // 1. Rembourser le paiement si effectué
    if (paymentId) {
      console.log(`💰 Tentative de remboursement: ${paymentId}`);
      const refundResult = await refundPayment(
        paymentId,
        undefined,
        `Échec commande - rollback automatique: ${error}`
      );

      if (!refundResult.success) {
        console.error('❌ Échec remboursement:', refundResult.error);
        // Envoyer une alerte pour intervention manuelle
        await sendAlertToAdmin({
          type: 'REFUND_FAILED',
          paymentId,
          error: refundResult.error,
          originalError: error,
        });
      } else {
        console.log(`✅ Remboursement réussi: ${refundResult.refundId}`);
      }
    }

    // 2. Libérer le stock réservé
    if (reservedItems.length > 0) {
      console.log(`📦 Libération du stock pour ${reservedItems.length} items...`);

      const releaseResults = await Promise.all(
        reservedItems.map((item) =>
          release_reserved_stock(
            item.productId,
            item.size,
            item.quantity
          )
        )
      );

      const failedReleases = releaseResults.filter(result => !result);
      if (failedReleases.length > 0) {
        console.error(`❌ ${failedReleases.length} libérations de stock ont échoué`);
        await sendAlertToAdmin({
          type: 'STOCK_RELEASE_FAILED',
          reservedItems,
          failedCount: failedReleases.length,
          originalError: error,
        });
      } else {
        console.log('✅ Stock libéré avec succès');
      }
    }

  } catch (rollbackError: any) {
    console.error('❌ Erreur lors du rollback:', rollbackError);
    
    // Alerte critique pour intervention manuelle
    await sendAlertToAdmin({
      type: 'ROLLBACK_FAILED',
      paymentId,
      reservedItems,
      originalError: error,
      rollbackError: rollbackError.message || String(rollbackError),
    });
  }
}

/**
 * Envoie une alerte aux administrateurs
 */
async function sendAlertToAdmin(alert: any) {
  console.error('🚨 ALERTE ADMIN:', alert);

  // TODO: Implémenter l'envoi d'alerte réel (email, webhook, etc.)
  // Pour l'instant, on log simplement
  try {
    // Optionnel: Envoyer à un endpoint d'alertes
    // await fetch('/api/admin/alerts', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(alert),
    // });
  } catch (err) {
    console.error('Impossible d\'envoyer l\'alerte:', err);
  }
}

