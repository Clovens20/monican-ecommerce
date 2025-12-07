import { NextRequest, NextResponse } from 'next/server';
import { getOrdersByStatus } from '@/lib/orders-db';
import { OrderStatus } from '@/lib/types';

/**
 * Route pour récupérer les commandes pour un sous-admin
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get('status');
    
    // Récupérer les commandes en attente ou en traitement
    let orders;
    if (statusParam && statusParam !== 'all') {
      // Vérifier que le status est un OrderStatus valide
      const validStatuses: OrderStatus[] = ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'];
      if (validStatuses.includes(statusParam as OrderStatus)) {
        orders = await getOrdersByStatus(statusParam as OrderStatus);
      } else {
        // Si status invalide, récupérer pending et processing
        const pendingOrders = await getOrdersByStatus('pending');
        const processingOrders = await getOrdersByStatus('processing');
        orders = [...pendingOrders, ...processingOrders];
      }
    } else {
      // Récupérer les commandes pending et processing
      const pendingOrders = await getOrdersByStatus('pending');
      const processingOrders = await getOrdersByStatus('processing');
      orders = [...pendingOrders, ...processingOrders];
    }
    
    // Trier par date (plus récentes en premier)
    orders.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    return NextResponse.json({
      success: true,
      orders: orders.map(order => ({
        id: order.id,
        orderNumber: order.id,
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
    console.error('Error fetching subadmin orders:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des commandes' },
      { status: 500 }
    );
  }
}

