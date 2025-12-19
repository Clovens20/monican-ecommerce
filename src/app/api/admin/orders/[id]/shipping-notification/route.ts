import { NextRequest, NextResponse } from 'next/server';
import { getOrderById } from '@/lib/orders-db';
import { sendShippingNotification } from '@/lib/email';

/**
 * Route pour envoyer une notification d'expédition au client
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { trackingNumber, carrier } = body;

        if (!trackingNumber) {
            return NextResponse.json(
                { error: 'Numéro de suivi requis' },
                { status: 400 }
            );
        }

        // Récupérer la commande
        const order = await getOrderById(id);

        if (!order) {
            return NextResponse.json(
                { error: 'Commande non trouvée' },
                { status: 404 }
            );
        }

        // Vérifier que la commande est expédiée
        if (order.status !== 'shipped') {
            return NextResponse.json(
                { error: 'La commande doit être expédiée pour envoyer la notification' },
                { status: 400 }
            );
        }

        // Envoyer l'email de notification
        const emailResult = await sendShippingNotification({
            orderNumber: order.orderNumber || order.id,
            customerEmail: order.customerEmail,
            customerName: order.customerName,
            trackingNumber: trackingNumber,
            carrier: carrier || 'USPS',
        });

        if (!emailResult.success) {
            console.error('Erreur lors de l\'envoi de l\'email:', emailResult.error);
            return NextResponse.json(
                { 
                    error: 'Erreur lors de l\'envoi de l\'email',
                    details: emailResult.error 
                },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Email de notification d\'expédition envoyé avec succès',
            messageId: emailResult.messageId,
        });

    } catch (error: any) {
        console.error('Error sending shipping notification:', error);
        return NextResponse.json(
            { error: 'Erreur lors de l\'envoi de la notification' },
            { status: 500 }
        );
    }
}

