import { NextRequest, NextResponse } from 'next/server';
import { getAllOrders, getOrdersByStatus } from '@/lib/orders-db';
import { OrderStatus } from '@/lib/types';

/**
 * Route pour récupérer toutes les commandes (admin)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get('status');
    
    let orders;
    if (statusParam && statusParam !== 'all') {
      // Vérifier que le status est un OrderStatus valide
      const validStatuses: OrderStatus[] = ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'];
      if (validStatuses.includes(statusParam as OrderStatus)) {
        orders = await getOrdersByStatus(statusParam as OrderStatus);
      } else {
        orders = await getAllOrders();
      }
    } else {
      orders = await getAllOrders();
    }
    
    return NextResponse.json({
      success: true,
      orders: orders.map(order => ({
        id: order.id,
        orderNumber: order.id, // Utiliser l'ID comme numéro pour l'instant
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        date: order.date,
        status: order.status,
        total: order.total,
        currency: order.currency,
        items: order.items,
        shippingAddress: order.shippingAddress,
        trackingNumber: order.trackingNumber
      }))
    });
    
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des commandes' },
      { status: 500 }
    );
  }
}

