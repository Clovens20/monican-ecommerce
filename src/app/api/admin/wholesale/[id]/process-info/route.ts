import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyAuth } from '@/lib/auth';
import { getProductStock } from '@/lib/inventory';

/**
 * GET /api/admin/wholesale/[id]/process-info
 * Retourne la commande avec le stock disponible pour chaque article (pour la modale de traitement)
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const authResult = await verifyAuth(request);
        const role = authResult.user?.role;
        if (authResult.status !== 200 || (role !== 'admin' && role !== 'subadmin')) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        const { id } = await params;

        const { data: order, error: fetchError } = await supabaseAdmin
            .from('wholesale_orders')
            .select('*')
            .eq('id', id)
            .single();

        if (fetchError || !order) {
            return NextResponse.json(
                { error: 'Commande introuvable' },
                { status: 404 }
            );
        }

        const items = order.items || [];
        const stockInfo: Array<{
            productId?: string;
            productName: string;
            size: string;
            quantity: number;
            unitPrice: number;
            totalPrice: number;
            availableStock: number;
            ok: boolean;
        }> = [];

        for (const item of items) {
            let availableStock = 0;
            if (item.productId) {
                const stockData = await getProductStock(item.productId, item.size);
                availableStock = stockData.reduce((sum, s) => sum + s.available, 0);
            }
            stockInfo.push({
                ...item,
                availableStock,
                ok: availableStock >= item.quantity,
            });
        }

        return NextResponse.json({
            success: true,
            order,
            stockInfo,
            canExecute: stockInfo.every(s => s.ok),
        });
    } catch (error) {
        console.error('Error in wholesale process-info:', error);
        return NextResponse.json(
            { error: 'Erreur serveur' },
            { status: 500 }
        );
    }
}
