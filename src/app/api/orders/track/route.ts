import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getOrderByEmailAndNumber } from '@/lib/orders-db';

const TrackOrderSchema = z.object({
  orderNumber: z.string().min(1),
  email: z.string().email(),
});

/**
 * Route pour suivre une commande sans compte
 * Vérifie que l'email correspond à la commande
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const validationResult = TrackOrderSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const { orderNumber, email } = validationResult.data;

    // Récupérer la commande en vérifiant l'email
    const order = await getOrderByEmailAndNumber(email, orderNumber);

    if (!order) {
      return NextResponse.json(
        { error: 'Commande non trouvée. Vérifiez le numéro de commande et l\'email.' },
        { status: 404 }
      );
    }

    // Retourner les informations de la commande (sans données sensibles)
    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        orderNumber: order.id, // Utiliser l'ID comme numéro pour l'instant
        status: order.status,
        statusHistory: order.statusHistory,
        items: order.items,
        total: order.total,
        currency: order.currency,
        trackingNumber: order.trackingNumber,
        date: order.date,
        shippingAddress: order.shippingAddress,
      },
    });

  } catch (error) {
    console.error('Error tracking order:', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors de la recherche de commande' },
      { status: 500 }
    );
  }
}

