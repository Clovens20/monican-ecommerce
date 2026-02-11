import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

interface WholesaleItem {
    productId: string;
    productName: string;
    size: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
}

function validateBody(body: unknown): body is {
    companyName: string;
    contactName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    country: string;
    taxId?: string;
    notes?: string;
    items: WholesaleItem[];
    totalQuantity: number;
    subtotal: number;
    discount: number;
    discountAmount: number;
    total: number;
} {
    if (!body || typeof body !== 'object') return false;
    const b = body as Record<string, unknown>;
    if (!b.companyName || typeof b.companyName !== 'string') return false;
    if (!b.contactName || typeof b.contactName !== 'string') return false;
    if (!b.email || typeof b.email !== 'string') return false;
    if (!b.phone || typeof b.phone !== 'string') return false;
    if (!b.address || typeof b.address !== 'string') return false;
    if (!b.city || typeof b.city !== 'string') return false;
    if (!b.state || typeof b.state !== 'string') return false;
    if (!b.zip || typeof b.zip !== 'string') return false;
    if (!b.country || typeof b.country !== 'string') return false;
    if (!Array.isArray(b.items) || b.items.length === 0) return false;
    if (typeof b.totalQuantity !== 'number' || b.totalQuantity < 12) return false;
    if (typeof b.subtotal !== 'number') return false;
    if (typeof b.discount !== 'number') return false;
    if (typeof b.discountAmount !== 'number') return false;
    if (typeof b.total !== 'number') return false;
    return true;
}

/**
 * POST /api/wholesale
 * Reçoit une demande de vente en gros, la sauvegarde en base et envoie un email à l'admin
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        if (!validateBody(body)) {
            return NextResponse.json(
                { success: false, error: 'Données invalides ou incomplètes. Vérifiez le formulaire.' },
                { status: 400 }
            );
        }

        const { data: order, error: insertError } = await supabaseAdmin
            .from('wholesale_orders')
            .insert({
                company_name: body.companyName,
                contact_name: body.contactName,
                email: body.email,
                phone: body.phone,
                tax_id: body.taxId || null,
                address: body.address,
                city: body.city,
                state: body.state,
                zip: body.zip,
                country: body.country,
                items: body.items,
                total_quantity: body.totalQuantity,
                subtotal: body.subtotal,
                discount_percent: body.discount,
                discount_amount: body.discountAmount,
                total: body.total,
                notes: body.notes || null,
            })
            .select('id, created_at')
            .single();

        if (insertError) {
            console.error('Error inserting wholesale order:', insertError);
            return NextResponse.json(
                { success: false, error: 'Erreur lors de l\'enregistrement de la demande.' },
                { status: 500 }
            );
        }

        // Envoyer l'email à l'admin (ne pas bloquer si l'email échoue)
        try {
            const { sendWholesaleNotificationToAdmin } = await import('@/lib/email');
            await sendWholesaleNotificationToAdmin({
                orderId: order.id,
                companyName: body.companyName,
                contactName: body.contactName,
                email: body.email,
                phone: body.phone,
                address: `${body.address}, ${body.city}, ${body.state} ${body.zip}, ${body.country}`,
                items: body.items,
                totalQuantity: body.totalQuantity,
                subtotal: body.subtotal,
                discount: body.discount,
                discountAmount: body.discountAmount,
                total: body.total,
            });
        } catch (emailError) {
            console.error('Error sending wholesale notification email:', emailError);
            // On ne fait pas échouer la requête si l'email échoue
        }

        return NextResponse.json({
            success: true,
            orderId: order.id,
            message: 'Demande enregistrée avec succès. Nous vous contacterons sous peu.',
        });
    } catch (error) {
        console.error('Error in wholesale API:', error);
        return NextResponse.json(
            { success: false, error: 'Erreur serveur. Veuillez réessayer.' },
            { status: 500 }
        );
    }
}
