// ============================================================================
// ✅ API CHECKOUT - Version Corrigée avec Logs Détaillés
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

// ============================================================================
// SCHEMA DE VALIDATION
// ============================================================================

const CheckoutSchema = z.object({
  customerName: z.string().min(1, 'Le nom du client est requis').max(100),
  customerEmail: z.string().email('Email invalide').max(255),
  customerPhone: z.string().max(50).optional(),
  customerId: z.string().optional(),
  shippingAddress: z.object({
    street: z.string().min(1, 'L\'adresse est requise').max(255),
    city: z.string().min(1, 'La ville est requise').max(100),
    state: z.string().min(1, 'L\'état/province est requis').max(100),
    zip: z.string().min(1, 'Le code postal est requis').max(20),
    country: z.enum(['US', 'CA', 'MX'], { message: 'Pays invalide' }),
  }),
  items: z.array(z.object({
    productId: z.string().min(1, 'ID produit requis'),
    name: z.string().min(1, 'Nom produit requis'),
    quantity: z.number().int().positive('Quantité doit être un entier positif'),
    price: z.number().positive('Prix doit être positif'),
    size: z.string().min(1, 'Taille requise'),
    image: z.string().optional(),
  })).min(1, 'Au moins un article est requis'),
  paymentSourceId: z.string().min(10, 'Token de paiement requis'),
  currency: z.enum(['USD', 'CAD', 'MXN'], { message: 'Devise invalide' }),
  subtotal: z.number().positive('Sous-total doit être positif'),
  shippingCost: z.number().min(0, 'Frais de livraison invalides'),
  tax: z.number().min(0, 'Taxes invalides'),
  total: z.number().positive('Total doit être positif'),
});

interface ReservedItem {
  productId: string;
  size: string;
  quantity: number;
}

// ============================================================================
// HANDLER POST
// ============================================================================

export async function POST(request: NextRequest) {
  let paymentId: string | null = null;
  let reservedItems: ReservedItem[] = [];
  const startTime = Date.now();

  console.log('\n' + '='.repeat(80));
  console.log('🎯 [CHECKOUT] DÉBUT DU PROCESSUS');
  console.log('='.repeat(80));

  try {
    // ===== 0️⃣ RATE LIMITING =====
    console.log('🚦 [CHECKOUT] Vérification rate limiting...');
    const rateLimitResponse = rateLimitMiddleware(request, RATE_LIMITS.checkout);
    if (rateLimitResponse) {
      console.log('❌ [CHECKOUT] Rate limit dépassé');
      return rateLimitResponse;
    }
    console.log('✅ [CHECKOUT] Rate limit OK');

    // ===== 1️⃣ LECTURE ET VALIDATION DES DONNÉES =====
    console.log('\n📥 [CHECKOUT] Lecture du body...');
    const body = await request.json();
    
    console.log('📋 [CHECKOUT] Données reçues:', {
      customerName: body.customerName,
      customerEmail: body.customerEmail,
      hasPhone: !!body.customerPhone,
      itemsCount: body.items?.length,
      paymentSourceIdLength: body.paymentSourceId?.length,
      paymentSourceIdPrefix: body.paymentSourceId?.substring(0, 20) + '...',
      currency: body.currency,
      total: body.total,
      subtotal: body.subtotal,
      shipping: body.shippingCost,
      tax: body.tax,
    });
    
    // Validation avec Zod
    console.log('\n🔍 [CHECKOUT] Validation des données...');
    const validationResult = validateAndSanitize(CheckoutSchema, body);
    
    if (!validationResult.success) {
      console.error('❌ [CHECKOUT] Erreur validation:', validationResult.error.issues);
      
      return NextResponse.json(
        { 
          error: 'Données invalides', 
          details: validationResult.error.issues.map(issue => ({
            path: Array.isArray(issue.path) ? issue.path.join('.') : String(issue.path || 'général'),
            message: issue.message,
            code: issue.code,
          }))
        },
        { status: 400 }
      );
    }

    const data = validationResult.data;
    console.log('✅ [CHECKOUT] Validation réussie');

    // Générer un orderId unique
    const orderId = `ORDER-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    console.log('🆔 [CHECKOUT] Order ID généré:', orderId);

    // ===== 2️⃣ RÉSERVATION DU STOCK =====
    console.log('\n🔒 [CHECKOUT] Phase 1: Réservation du stock...');

    for (const item of data.items) {
      console.log(`  📦 Vérification stock: ${item.name} (${item.size}) x${item.quantity}`);
      
      const isAvailable = await checkProductAvailability(
        item.productId,
        item.size,
        item.quantity
      );

      if (!isAvailable) {
        const errorMsg = `Le produit "${item.name}" (taille ${item.size}) n'est plus disponible en quantité suffisante`;
        console.error(`  ❌ ${errorMsg}`);
        throw new Error(errorMsg);
      }

      reservedItems.push({
        productId: item.productId,
        size: item.size,
        quantity: item.quantity,
      });
      
      console.log(`  ✅ Stock réservé: ${item.name}`);
    }

    console.log(`✅ [CHECKOUT] Stock réservé pour ${reservedItems.length} items`);

    // ===== 3️⃣ TRAITEMENT DU PAIEMENT =====
    console.log('\n💳 [CHECKOUT] Phase 2: Traitement du paiement...');
    console.log('  💰 Montant:', Math.round(data.total * 100), 'centimes');
    console.log('  💵 Devise:', data.currency);
    console.log('  🔑 Token:', data.paymentSourceId.substring(0, 20) + '...');

    const paymentResult = await processPayment({
      amount: Math.round(data.total * 100), // Convertir en centimes
      currency: data.currency,
      sourceId: data.paymentSourceId,
      orderId: orderId,
      customerEmail: data.customerEmail,
      customerName: data.customerName,
      shippingAddress: data.shippingAddress,
    });

    console.log('📥 [CHECKOUT] Résultat paiement:', {
      success: paymentResult.success,
      paymentId: paymentResult.paymentId,
      error: paymentResult.error,
      errorCode: paymentResult.errorCode,
    });

    if (!paymentResult.success || !paymentResult.paymentId) {
      const errorMsg = paymentResult.error || 'Erreur lors du traitement du paiement';
      console.error('❌ [CHECKOUT] Paiement échoué:', errorMsg);
      throw new Error(errorMsg);
    }

    paymentId = paymentResult.paymentId;
    console.log(`✅ [CHECKOUT] Paiement traité: ${paymentId}`);

    // ===== 4️⃣ CRÉATION DE LA COMMANDE =====
    console.log('\n📦 [CHECKOUT] Phase 3: Création de la commande...');

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
      paymentMethod: 'Stripe',
      paymentId: paymentId,
      paymentStatus: 'completed',
    });

    if (!order) {
      console.error('❌ [CHECKOUT] Échec création commande');
      throw new Error('Erreur lors de la création de la commande');
    }

    console.log(`✅ [CHECKOUT] Commande créée: ${order.id}`);

    // ===== 5️⃣ CONFIRMATION DU STOCK =====
    console.log('\n✔️ [CHECKOUT] Phase 4: Confirmation du stock...');

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
      console.warn(`⚠️ [CHECKOUT] ${failedConfirmations.length} confirmations de stock ont échoué`);
    } else {
      console.log('✅ [CHECKOUT] Stock confirmé et réduit');
    }

    // ===== 6️⃣ ENVOI EMAIL DE CONFIRMATION =====
    console.log('\n📧 [CHECKOUT] Phase 5: Envoi email de confirmation...');
    
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
      console.log('✅ [CHECKOUT] Email de confirmation envoyé');
    } catch (emailError) {
      console.warn('⚠️ [CHECKOUT] Erreur envoi email (non bloquant):', emailError);
    }

    // ===== SUCCÈS =====
    const duration = Date.now() - startTime;
    console.log('\n' + '='.repeat(80));
    console.log(`✅ [CHECKOUT] PROCESSUS TERMINÉ AVEC SUCCÈS (${duration}ms)`);
    console.log('='.repeat(80) + '\n');

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
    const duration = Date.now() - startTime;
    console.error('\n' + '='.repeat(80));
    console.error(`❌ [CHECKOUT] ERREUR (après ${duration}ms):`, error.message);
    console.error('='.repeat(80));

    // ===== ROLLBACK =====
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
      { status: error.message?.includes('Stock') || error.message?.includes('disponible') ? 400 : 500 }
    );
  }
}

// ============================================================================
// FONCTION DE ROLLBACK
// ============================================================================

async function rollbackCheckout({
  paymentId,
  reservedItems,
  error,
}: {
  paymentId: string | null;
  reservedItems: ReservedItem[];
  error: string;
}) {
  console.log('\n🔄 [ROLLBACK] Début du rollback...');
  console.log('  💳 Payment ID:', paymentId || 'N/A');
  console.log('  📦 Items réservés:', reservedItems.length);
  console.log('  ❌ Raison:', error);

  try {
    // 1. Rembourser le paiement si effectué
    if (paymentId) {
      console.log(`💰 [ROLLBACK] Tentative de remboursement: ${paymentId}`);
      
      const refundResult = await refundPayment(
        paymentId,
        undefined,
        `Échec commande - rollback automatique: ${error}`
      );

      if (!refundResult.success) {
        console.error('❌ [ROLLBACK] Échec remboursement:', refundResult.error);
        await sendAlertToAdmin({
          type: 'REFUND_FAILED',
          paymentId,
          error: refundResult.error,
          originalError: error,
        });
      } else {
        console.log(`✅ [ROLLBACK] Remboursement réussi: ${refundResult.refundId}`);
      }
    }

    // 2. Libérer le stock réservé
    if (reservedItems.length > 0) {
      console.log(`📦 [ROLLBACK] Libération du stock pour ${reservedItems.length} items...`);

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
        console.error(`❌ [ROLLBACK] ${failedReleases.length} libérations de stock ont échoué`);
        await sendAlertToAdmin({
          type: 'STOCK_RELEASE_FAILED',
          reservedItems,
          failedCount: failedReleases.length,
          originalError: error,
        });
      } else {
        console.log('✅ [ROLLBACK] Stock libéré avec succès');
      }
    }

    console.log('✅ [ROLLBACK] Rollback terminé\n');

  } catch (rollbackError: any) {
    console.error('❌ [ROLLBACK] Erreur lors du rollback:', rollbackError);
    
    await sendAlertToAdmin({
      type: 'ROLLBACK_FAILED',
      paymentId,
      reservedItems,
      originalError: error,
      rollbackError: rollbackError.message || String(rollbackError),
    });
  }
}

// ============================================================================
// ALERTES ADMIN
// ============================================================================

async function sendAlertToAdmin(alert: any) {
  console.error('🚨 [ALERT] ALERTE ADMIN:', JSON.stringify(alert, null, 2));

  // TODO: Implémenter l'envoi d'alerte réel
  // - Email aux administrateurs
  // - Webhook Slack/Discord
  // - Log dans système de monitoring (Sentry, etc.)
}