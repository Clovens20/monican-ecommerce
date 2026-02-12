import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { sendWholesaleReplyToRequester } from '@/lib/email';

/**
 * POST /api/admin/subadmin/wholesale/[id]/reply
 * Envoie la réponse du sous-admin au demandant par email (depuis l'interface)
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { message, subject } = body;

        if (!message || typeof message !== 'string' || message.trim().length === 0) {
            return NextResponse.json(
                { error: 'Le message est requis' },
                { status: 400 }
            );
        }

        const { data: order, error: fetchError } = await supabaseAdmin
            .from('wholesale_orders')
            .select('email, contact_name, company_name')
            .eq('id', id)
            .single();

        if (fetchError || !order) {
            return NextResponse.json(
                { error: 'Commande introuvable' },
                { status: 404 }
            );
        }

        const result = await sendWholesaleReplyToRequester({
            toEmail: order.email,
            contactName: order.contact_name,
            companyName: order.company_name,
            subject: subject?.trim() || undefined,
            message: message.trim(),
        });

        if (!result.success) {
            return NextResponse.json(
                { error: result.error || 'Erreur lors de l\'envoi de l\'email' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Email envoyé avec succès au demandant.',
        });
    } catch (error) {
        console.error('Error in subadmin wholesale reply:', error);
        return NextResponse.json(
            { error: 'Erreur serveur' },
            { status: 500 }
        );
    }
}
