// ============================================================================
// INVENTORY MANAGEMENT - Stock Management
// ============================================================================

import { supabaseAdmin } from './supabase';

/**
 * Vérifie la disponibilité d'un produit
 */
export async function checkProductAvailability(
    productId: string,
    size: string,
    quantity: number
): Promise<boolean> {
    try {
        const { data, error } = await supabaseAdmin
            .rpc('check_and_reserve_stock', {
                p_product_id: productId,
                p_size: size,
                p_quantity: quantity,
            });

        if (error) {
            console.error('Error checking stock:', error);
            return false;
        }

        return data === true;
    } catch (error) {
        console.error('Error in checkProductAvailability:', error);
        return false;
    }
}

/**
 * Confirme la réduction de stock (après paiement)
 */
export async function confirm_stock_reduction(
    productId: string,
    size: string,
    quantity: number
): Promise<boolean> {
    try {
        const { error } = await supabaseAdmin
            .rpc('confirm_stock_reduction', {
                p_product_id: productId,
                p_size: size,
                p_quantity: quantity,
            });

        if (error) {
            console.error('Error confirming stock reduction:', error);
            return false;
        }

        return true;
    } catch (error) {
        console.error('Error in confirm_stock_reduction:', error);
        return false;
    }
}

/**
 * Libère le stock réservé (en cas d'échec de paiement ou de commande)
 */
export async function release_reserved_stock(
    productId: string,
    size: string,
    quantity: number
): Promise<boolean> {
    try {
        const { error } = await supabaseAdmin
            .rpc('release_reserved_stock', {
                p_product_id: productId,
                p_size: size,
                p_quantity: quantity,
            });

        if (error) {
            console.error('Error releasing reserved stock:', error);
            return false;
        }

        return true;
    } catch (error) {
        console.error('Error in release_reserved_stock:', error);
        return false;
    }
}

/**
 * Récupère le stock disponible d'un produit
 */
export async function getProductStock(
    productId: string,
    size?: string
): Promise<Array<{ size: string; stock: number; reserved: number; available: number }>> {
    try {
        let query = supabaseAdmin
            .from('inventory')
            .select('size, stock_quantity, reserved_quantity')
            .eq('product_id', productId);

        if (size) {
            query = query.eq('size', size);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching stock:', error);
            return [];
        }

        return (data || []).map(item => ({
            size: item.size,
            stock: item.stock_quantity || 0,
            reserved: item.reserved_quantity || 0,
            available: (item.stock_quantity || 0) - (item.reserved_quantity || 0),
        }));
    } catch (error) {
        console.error('Error in getProductStock:', error);
        return [];
    }
}

/**
 * Met à jour le stock d'un produit (Admin)
 */
export async function updateProductStock(
    productId: string,
    size: string,
    quantity: number
): Promise<boolean> {
    try {
        const { error } = await supabaseAdmin
            .from('inventory')
            .upsert({
                product_id: productId,
                size,
                stock_quantity: quantity,
            }, {
                onConflict: 'product_id,size',
            });

        if (error) {
            console.error('Error updating stock:', error);
            return false;
        }

        return true;
    } catch (error) {
        console.error('Error in updateProductStock:', error);
        return false;
    }
}

/**
 * Récupère les produits en stock faible
 */
export async function getLowStockProducts(threshold?: number): Promise<Array<{
    productId: string;
    productName: string;
    size: string;
    stock: number;
    threshold: number;
}>> {
    try {
        const { data, error } = await supabaseAdmin
            .from('inventory')
            .select(`
                product_id,
                size,
                stock_quantity,
                low_stock_threshold,
                products!inner(name)
            `)
            .lte('stock_quantity', threshold || 10);

        if (error) {
            console.error('Error fetching low stock products:', error);
            return [];
        }

        return (data || []).map(item => ({
            productId: item.product_id,
            productName: (item.products as any)?.name || 'Unknown',
            size: item.size,
            stock: item.stock_quantity || 0,
            threshold: item.low_stock_threshold || 10,
        }));
    } catch (error) {
        console.error('Error in getLowStockProducts:', error);
        return [];
    }
}

