import { NextRequest, NextResponse } from 'next/server';
import { getOrderById, updateOrderStatus, cancelOrder } from '@/lib/orders-db';
import { OrderStatus } from '@/lib/types';
import { verifyAuth } from '@/lib/auth';

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

/**
 * Route pour annuler une commande (admin)
 * DELETE /api/admin/orders/[id]
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Vérifier l'authentification admin
    const authResult = await verifyAuth(request);
    if (authResult.status !== 200 || authResult.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const { reason } = body;
    
    // Vérifier que la commande existe
    const order = await getOrderById(id);
    if (!order) {
      return NextResponse.json(
        { error: 'Commande non trouvée' },
        { status: 404 }
      );
    }

    // Vérifier que la commande peut être annulée
    if (order.status === 'delivered') {
      return NextResponse.json(
        { error: 'Impossible d\'annuler une commande déjà livrée' },
        { status: 400 }
      );
    }

    if (order.status === 'cancelled') {
      return NextResponse.json(
        { error: 'Cette commande est déjà annulée' },
        { status: 400 }
      );
    }

    // Annuler la commande (libère le stock, rembourse et envoie l'email)
    const result = await cancelOrder(id, reason);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Erreur lors de l\'annulation de la commande' },
        { status: 500 }
      );
    }

    // Récupérer la commande mise à jour
    const updatedOrder = await getOrderById(id);

    // Construire le message de succès
    let message = 'Commande annulée avec succès. Le stock a été libéré.';
    if (result.refundId) {
      message += ` Remboursement effectué (ID: ${result.refundId}).`;
    }
    if (result.emailSent) {
      message += ' Email de notification envoyé au client.';
    }

    return NextResponse.json({
      success: true,
      message,
      order: updatedOrder ? {
        id: updatedOrder.id,
        status: updatedOrder.status,
      } : null,
      refundId: result.refundId,
      emailSent: result.emailSent,
    });

  } catch (error) {
    console.error('Error cancelling order:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'annulation de la commande' },
      { status: 500 }
    );
  }
}

