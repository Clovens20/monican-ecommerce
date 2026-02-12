import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

const VALID_STATUSES = ['pending', 'contacted', 'processing', 'completed', 'cancelled'];

/**
 * PATCH /api/admin/subadmin/wholesale/[id]
 * Met à jour le statut d'une demande wholesale (sous-admin)
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { status } = body;

        if (!status || !VALID_STATUSES.includes(status)) {
            return NextResponse.json(
                { error: 'Statut invalide. Valeurs acceptées: ' + VALID_STATUSES.join(', ') },
                { status: 400 }
            );
        }

        const { data, error } = await supabaseAdmin
            .from('wholesale_orders')
            .update({ status })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating wholesale order:', error);
            return NextResponse.json(
                { error: 'Erreur lors de la mise à jour du statut' },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true, order: data });
    } catch (error) {
        console.error('Error in subadmin wholesale PATCH:', error);
        return NextResponse.json(
            { error: 'Erreur serveur' },
            { status: 500 }
        );
    }
}
