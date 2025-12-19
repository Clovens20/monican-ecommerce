import { NextRequest, NextResponse } from 'next/server';
import { getOrderById } from '@/lib/orders-db';

/**
 * Route pour récupérer les détails complets d'une commande (sous-admin)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const order = await getOrderById(id);
    
    if (!order) {
      return NextResponse.json(
        { error: 'Commande non trouvée' },
        { status: 404 }
      );
    }
    
    // Vérifier que la commande est en statut pending ou processing
    if (order.status !== 'pending' && order.status !== 'processing') {
      return NextResponse.json(
        { error: 'Cette commande n\'est plus disponible pour traitement' },
        { status: 403 }
      );
    }
    
    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        orderNumber: order.orderNumber || order.id,
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        customerPhone: order.customerPhone || '',
        date: order.date,
        status: order.status,
        total: order.total,
        currency: order.currency,
        items: order.items,
        shippingAddress: order.shippingAddress,
        trackingNumber: order.trackingNumber,
        subtotal: order.subtotal,
        shippingCost: order.shippingCost,
        tax: order.tax,
        paymentMethod: order.paymentMethod || 'Non spécifié',
        statusHistory: order.statusHistory || []
      }
    });
    
  } catch (error) {
    console.error('Error fetching subadmin order details:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération de la commande' },
      { status: 500 }
    );
  }
}

