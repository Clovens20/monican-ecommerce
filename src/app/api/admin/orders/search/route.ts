import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * GET - Recherche une commande par numéro de commande ou numéro de suivi
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const identifier = searchParams.get('identifier');

    if (!identifier) {
      return NextResponse.json(
        { error: 'Identifiant requis' },
        { status: 400 }
      );
    }

    const searchTerm = identifier.trim().toUpperCase();

    // Rechercher par order_number
    let { data: orders, error } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('order_number', searchTerm)
      .limit(1);

    // Si pas trouvé, chercher par tracking_number
    if ((!orders || orders.length === 0) && !error) {
      const { data: trackingOrders, error: trackingError } = await supabaseAdmin
        .from('orders')
        .select('*')
        .eq('tracking_number', searchTerm)
        .limit(1);
      
      if (!trackingError && trackingOrders && trackingOrders.length > 0) {
        orders = trackingOrders;
      } else {
        error = trackingError;
      }
    }

    // Si toujours pas trouvé, chercher par ID (UUID)
    if ((!orders || orders.length === 0) && !error && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(searchTerm)) {
      const { data: idOrders, error: idError } = await supabaseAdmin
        .from('orders')
        .select('*')
        .eq('id', searchTerm)
        .limit(1);
      
      if (!idError && idOrders && idOrders.length > 0) {
        orders = idOrders;
      } else {
        error = idError;
      }
    }

    if (error) {
      console.error('Error searching order:', error);
      return NextResponse.json(
        { error: 'Erreur lors de la recherche' },
        { status: 500 }
      );
    }

    if (!orders || orders.length === 0) {
      return NextResponse.json(
        { error: 'Aucune commande trouvée' },
        { status: 404 }
      );
    }

    const order = orders[0];

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        order_number: order.order_number,
        tracking_number: order.tracking_number,
        customer_name: order.customer_name,
        customer_email: order.customer_email,
        items: Array.isArray(order.items) ? order.items : [],
        total: parseFloat(order.total?.toString() || '0'),
        currency: order.currency || 'USD',
        payment_method: order.payment_method || 'credit_card',
        payment_id: order.payment_id,
        created_at: order.created_at,
      },
    });

  } catch (error) {
    console.error('Error in order search API:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

