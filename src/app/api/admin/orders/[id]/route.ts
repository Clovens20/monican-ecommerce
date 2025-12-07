import { NextRequest, NextResponse } from 'next/server';
import { getOrderById, updateOrderStatus } from '@/lib/orders-db';
import { OrderStatus } from '@/lib/types';

/**
 * Route pour récupérer une commande par ID (admin)
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
    
    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        orderNumber: order.id,
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        customerPhone: order.customerPhone,
        date: order.date,
        status: order.status,
        total: order.total,
        currency: order.currency,
        items: order.items,
        shippingAddress: order.shippingAddress,
        trackingNumber: order.trackingNumber,
        subtotal: order.subtotal,
        shippingCost: order.shippingCost,
        tax: order.tax
      }
    });
    
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération de la commande' },
      { status: 500 }
    );
  }
}

/**
 * Route pour mettre à jour une commande (statut, tracking, etc.)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, trackingNumber } = body;
    
    if (!status && !trackingNumber) {
      return NextResponse.json(
        { error: 'Statut ou numéro de suivi requis' },
        { status: 400 }
      );
    }
    
    const success = await updateOrderStatus(
      id,
      status as OrderStatus,
      status ? `Statut changé à ${status}` : undefined,
      'admin',
      trackingNumber
    );
    
    if (!success) {
      return NextResponse.json(
        { error: 'Erreur lors de la mise à jour de la commande' },
        { status: 500 }
      );
    }
    
    // Récupérer la commande mise à jour
    const updatedOrder = await getOrderById(id);
    
    return NextResponse.json({
      success: true,
      order: updatedOrder ? {
        id: updatedOrder.id,
        status: updatedOrder.status,
        trackingNumber: updatedOrder.trackingNumber
      } : null
    });
    
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour de la commande' },
      { status: 500 }
    );
  }
}

