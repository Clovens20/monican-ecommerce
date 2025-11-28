import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { processPayment } from '@/lib/payments';
import { createOrder } from '@/lib/orders-db';
import { sendOrderConfirmation } from '@/lib/email';
import { checkProductAvailability, confirm_stock_reduction } from '@/lib/inventory';

const CheckoutSchema = z.object({
  customerName: z.string().min(1),
  customerEmail: z.string().email(),
  customerPhone: z.string().optional(),
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const validationResult = CheckoutSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // 1. Vérifier la disponibilité du stock pour tous les articles
    for (const item of data.items) {
      const isAvailable = await checkProductAvailability(
        item.productId,
        item.size,
        item.quantity
      );

      if (!isAvailable) {
        return NextResponse.json(
          { 
            error: `Le produit ${item.name} (taille ${item.size}) n'est plus disponible en quantité suffisante`,
            productId: item.productId,
            size: item.size,
          },
          { status: 400 }
        );
      }
    }

    // 2. Traiter le paiement
    const paymentResult = await processPayment({
      amount: Math.round(data.total * 100), // Convertir en centimes
      currency: data.currency,
      sourceId: data.paymentSourceId,
      customerEmail: data.customerEmail,
      customerName: data.customerName,
      shippingAddress: data.shippingAddress,
    });

    if (!paymentResult.success || !paymentResult.paymentId) {
      return NextResponse.json(
        { 
          error: paymentResult.error || 'Erreur lors du traitement du paiement',
          errorCode: paymentResult.errorCode,
        },
        { status: 402 } // Payment Required
      );
    }

    // 3. Créer la commande
    const order = await createOrder({
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
      paymentId: paymentResult.paymentId,
      paymentStatus: 'completed',
    });

    if (!order) {
      // Si la commande échoue, rembourser le paiement
      // TODO: Implémenter le remboursement automatique
      return NextResponse.json(
        { error: 'Erreur lors de la création de la commande' },
        { status: 500 }
      );
    }

    // 4. Réduire le stock
    for (const item of data.items) {
      await confirm_stock_reduction(
        item.productId,
        item.size,
        item.quantity
      );
    }

    // 5. Envoyer l'email de confirmation
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
    } catch (emailError) {
      // Ne pas faire échouer la commande si l'email échoue
      console.error('Error sending confirmation email:', emailError);
    }

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        orderNumber: order.id, // Utiliser l'ID comme numéro pour l'instant
        total: order.total,
        currency: order.currency,
      },
      paymentId: paymentResult.paymentId,
    });

  } catch (error) {
    console.error('Error in checkout:', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors du checkout' },
      { status: 500 }
    );
  }
}

