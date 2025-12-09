import { NextRequest, NextResponse } from 'next/server';
import { getOrderById } from '@/lib/orders-db';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        if (!id) {
            return NextResponse.json(
                { success: false, error: 'ID de commande manquant' },
                { status: 400 }
            );
        }

        // Récupérer la commande depuis la base de données
        const order = await getOrderById(id);

        if (!order) {
            return NextResponse.json(
                { success: false, error: 'Commande non trouvée' },
                { status: 404 }
            );
        }

        // Récupérer le order_number depuis la base de données directement
        const { data: orderData } = await supabaseAdmin
            .from('orders')
            .select('order_number')
            .eq('id', id)
            .single();

        // Formater les données pour la réponse
        const formattedOrder = {
            id: order.id,
            orderNumber: orderData?.order_number || order.id, // Utiliser order_number si disponible, sinon l'ID
            customerName: order.customerName,
            customerEmail: order.customerEmail,
            date: order.date,
            status: order.status,
            total: order.total,
            currency: order.currency,
            items: order.items.map((item: any) => ({
                id: item.id || `${item.productId || 'item'}-${item.size || 'default'}`,
                name: item.name,
                size: item.size,
                quantity: item.quantity,
                price: item.price,
                image: item.image,
            })),
            shippingAddress: order.shippingAddress,
            subtotal: order.subtotal,
            shippingCost: order.shippingCost,
            tax: order.tax,
        };

        return NextResponse.json({
            success: true,
            order: formattedOrder,
        });
    } catch (error: any) {
        console.error('Error fetching order:', error);
        return NextResponse.json(
            { success: false, error: 'Erreur serveur' },
            { status: 500 }
        );
    }
}

