import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { confirm_stock_reduction } from '@/lib/inventory';
import { getProductStock } from '@/lib/inventory';

interface WholesaleItem {
    productId?: string;
    productName: string;
    size: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
}

/**
 * POST /api/admin/subadmin/wholesale/[id]/execute
 * Exécute une commande wholesale (sous-admin) : vérifie le stock, réduit le stock, marque comme complétée
 */
export async function POST(
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

        if (order.status === 'completed') {
            return NextResponse.json(
                { error: 'Cette commande a déjà été traitée' },
                { status: 400 }
            );
        }

        const items: WholesaleItem[] = order.items || [];
        if (items.length === 0) {
            return NextResponse.json(
                { error: 'Aucun article dans cette commande' },
                { status: 400 }
            );
        }

        const stockChecks: Array<{ item: WholesaleItem; availableStock: number; ok: boolean }> = [];
        for (const item of items) {
            if (!item.productId) {
                stockChecks.push({ item, availableStock: 0, ok: false });
                continue;
            }
            const stockData = await getProductStock(item.productId, item.size);
            const totalAvailable = stockData.reduce((sum, s) => sum + s.available, 0);
            stockChecks.push({
                item,
                availableStock: totalAvailable,
                ok: totalAvailable >= item.quantity,
            });
        }

        const allOk = stockChecks.every(c => c.ok);
        if (!allOk) {
            const insufficient = stockChecks.filter(c => !c.ok);
            return NextResponse.json({
                success: false,
                error: 'Stock insuffisant',
                details: insufficient.map(c => ({
                    product: c.item.productName,
                    size: c.item.size,
                    requested: c.item.quantity,
                    available: c.availableStock,
                })),
            }, { status: 400 });
        }

        for (const item of items) {
            if (!item.productId) continue;
            const reduced = await confirm_stock_reduction(
                item.productId,
                item.size,
                item.quantity
            );
            if (!reduced) {
                return NextResponse.json({
                    success: false,
                    error: `Erreur lors de la réduction du stock pour ${item.productName} taille ${item.size}`,
                }, { status: 500 });
            }
        }

        const { error: updateError } = await supabaseAdmin
            .from('wholesale_orders')
            .update({ status: 'completed' })
            .eq('id', id);

        if (updateError) {
            console.error('Error updating wholesale order status:', updateError);
            return NextResponse.json(
                { error: 'Stock réduit mais erreur lors de la mise à jour du statut' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Commande exécutée avec succès. Stock mis à jour.',
        });
    } catch (error) {
        console.error('Error in subadmin wholesale execute:', error);
        return NextResponse.json(
            { error: 'Erreur serveur' },
            { status: 500 }
        );
    }
}
