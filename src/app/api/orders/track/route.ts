import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getOrderByEmailAndIdentifier } from '@/lib/orders-db';
import { supabase } from '@/lib/supabase';

const TrackOrderSchema = z.object({
  identifier: z.string().min(1), // Peut être orderNumber ou trackingNumber
  email: z.string().email(),
});

/**
 * Route pour suivre une commande sans compte
 * Vérifie que l'email correspond à la commande
 * Accepte soit le numéro de commande soit le numéro de suivi
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

    const { identifier, email } = validationResult.data;

    // Récupérer la commande en vérifiant l'email et soit order_number soit tracking_number
    const order = await getOrderByEmailAndIdentifier(email, identifier);

    if (!order) {
      return NextResponse.json(
        { error: 'Commande non trouvée. Vérifiez le numéro de commande/numéro de suivi et l\'email.' },
        { status: 404 }
      );
    }

    // Récupérer le order_number depuis la base de données
    const { data: orderData } = await supabase
      .from('orders')
      .select('order_number')
      .eq('id', order.id)
      .single();

    // Retourner les informations de la commande (sans données sensibles)
    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        orderNumber: orderData?.order_number || order.id,
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

