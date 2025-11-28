import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { sendEmail } from '@/lib/email';

/**
 * API Route pour finaliser un retour avec le numéro de suivi
 * 
 * Cette route :
 * 1. Reçoit le returnLabel et le trackingNumber
 * 2. Met à jour le retour en base de données
 * 3. Change le statut à 'in_transit'
 * 4. Envoie une notification à l'admin
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { returnLabel, trackingNumber } = body;

        if (!returnLabel || !trackingNumber) {
            return NextResponse.json(
                { error: 'Le numéro d\'étiquette et le numéro de suivi sont requis' },
                { status: 400 }
            );
        }

        // Rechercher le retour par return_label
        const { data: returns, error: returnError } = await supabaseAdmin
            .from('returns')
            .select('*, orders!inner(order_number, customer_name, items)')
            .eq('return_label', returnLabel)
            .limit(1);

        if (returnError) {
            console.error('Error fetching return:', returnError);
            return NextResponse.json(
                { error: 'Erreur lors de la recherche du retour' },
                { status: 500 }
            );
        }

        if (!returns || returns.length === 0) {
            return NextResponse.json(
                { error: 'Aucun retour trouvé avec ce numéro d\'étiquette' },
                { status: 404 }
            );
        }

        const returnRecord = returns[0];

        // Mettre à jour le retour avec le numéro de suivi
        const { data: updatedReturn, error: updateError } = await supabaseAdmin
            .from('returns')
            .update({
                tracking_number: trackingNumber.trim(),
                status: 'in_transit',
                shipped_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            })
            .eq('id', returnRecord.id)
            .select('*, orders!inner(order_number, customer_name, items)')
            .single();

        if (updateError) {
            console.error('Error updating return:', updateError);
            return NextResponse.json(
                { error: 'Erreur lors de la mise à jour du retour' },
                { status: 500 }
            );
        }

        // Envoyer une notification à l'admin
        try {
            const adminEmail = process.env.EMAIL_SUPPORT || process.env.EMAIL_FROM || 'admin@monican.com';
            // La structure peut varier selon la jointure Supabase
            const orderData = Array.isArray(updatedReturn.orders) ? updatedReturn.orders[0] : updatedReturn.orders;
            const orderNumber = (orderData as any)?.order_number || 'N/A';
            const customerName = updatedReturn.customer_name || (orderData as any)?.customer_name || 'Client';
            const items = (orderData as any)?.items || updatedReturn.items || [];

            await sendEmail({
                to: adminEmail,
                subject: `🔄 Retour en transit - Commande ${orderNumber}`,
                html: `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="utf-8">
                        <style>
                            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                            .header { background: #f59e0b; color: #fff; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
                            .content { padding: 20px; background: #f9fafb; border: 1px solid #e5e7eb; }
                            .info-box { background: #fff; padding: 15px; margin: 15px 0; border-radius: 5px; border-left: 4px solid #f59e0b; }
                            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
                            .tracking { background: #fef3c7; padding: 10px; border-radius: 5px; font-family: monospace; font-weight: bold; }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <div class="header">
                                <h1>🔄 Retour en Transit</h1>
                            </div>
                            <div class="content">
                                <h2>Un produit est en route pour un retour</h2>
                                <p>Un client a finalisé son retour et a ajouté le numéro de suivi.</p>
                                
                                <div class="info-box">
                                    <h3>Informations du Retour</h3>
                                    <p><strong>Numéro de Commande:</strong> ${orderNumber}</p>
                                    <p><strong>Client:</strong> ${customerName}</p>
                                    <p><strong>Email:</strong> ${updatedReturn.customer_email}</p>
                                    <p><strong>Étiquette de Retour:</strong> ${returnLabel}</p>
                                    <p><strong>Numéro de Suivi:</strong></p>
                                    <div class="tracking">${trackingNumber}</div>
                                    <p><strong>Date d'Envoi:</strong> ${new Date(updatedReturn.shipped_at).toLocaleDateString('fr-FR', { 
                                        year: 'numeric', 
                                        month: 'long', 
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}</p>
                                </div>

                                <div class="info-box">
                                    <h3>Articles Retournés</h3>
                                    <ul>
                                        ${Array.isArray(items) ? items.map((item: any) => 
                                            `<li>${item.name || item.productId} x ${item.quantity || 1}</li>`
                                        ).join('') : '<li>Informations non disponibles</li>'}
                                    </ul>
                                </div>

                                <p style="margin-top: 20px;">
                                    <strong>Action requise:</strong> Surveillez l'arrivée du colis et procédez à l'inspection une fois reçu.
                                </p>
                            </div>
                            <div class="footer">
                                <p>Monican E-commerce - Système de gestion des retours</p>
                            </div>
                        </div>
                    </body>
                    </html>
                `,
            });
        } catch (emailError) {
            console.error('Error sending admin notification email:', emailError);
            // Ne pas faire échouer la requête si l'email échoue
        }

        return NextResponse.json({
            success: true,
            message: 'Retour finalisé avec succès. L\'administrateur a été notifié.',
            return: {
                id: updatedReturn.id,
                returnLabel: updatedReturn.return_label,
                trackingNumber: updatedReturn.tracking_number,
                status: updatedReturn.status,
            },
        });

    } catch (error: any) {
        console.error('Error in returns complete API:', error);
        return NextResponse.json(
            { error: error.message || 'Une erreur est survenue lors de la finalisation du retour' },
            { status: 500 }
        );
    }
}

