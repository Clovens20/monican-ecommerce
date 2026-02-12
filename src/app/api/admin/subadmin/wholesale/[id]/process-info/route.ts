import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getProductStock } from '@/lib/inventory';

/**
 * GET /api/admin/subadmin/wholesale/[id]/process-info
 * Retourne la commande avec le stock disponible pour chaque article (sous-admin)
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
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
        console.error('Error in subadmin wholesale process-info:', error);
        return NextResponse.json(
            { error: 'Erreur serveur' },
            { status: 500 }
        );
    }
}
