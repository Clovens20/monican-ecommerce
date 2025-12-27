// ============================================================================
// ORDERS DATABASE FUNCTIONS - Supabase Integration
// ============================================================================

import { supabase, supabaseAdmin } from './supabase';
import { Order, OrderStatus, OrderItem, ShippingAddress } from './types';
import { sendOrderCancellationEmail } from './email';
import { refundPayment } from './payments';

// ============================================================================
// TYPE CONVERSION HELPERS
// ============================================================================

interface SupabaseOrder {
    id: string;
    order_number: string;
    customer_id: string | null;
    customer_name: string;
    customer_email: string;
    customer_phone: string | null;
    shipping_address: any; // JSONB
    items: any; // JSONB
    status: string;
    status_history: any; // JSONB
    subtotal: number;
    shipping_cost: number;
    tax: number;
    total: number;
    currency: string;
    payment_method: string | null;
    payment_id: string | null;
    payment_status: string;
    tracking_number: string | null;
    internal_notes: string | null;
    created_at: string;
    updated_at: string;
}

function convertSupabaseToOrder(supabaseOrder: SupabaseOrder): Order {
    return {
        id: supabaseOrder.id,
        orderNumber: supabaseOrder.order_number,
        customerName: supabaseOrder.customer_name,
        customerEmail: supabaseOrder.customer_email,
        customerPhone: supabaseOrder.customer_phone || '',
        shippingAddress: supabaseOrder.shipping_address as ShippingAddress,
        items: Array.isArray(supabaseOrder.items) ? supabaseOrder.items : [],
        status: supabaseOrder.status as OrderStatus,
        statusHistory: Array.isArray(supabaseOrder.status_history) 
            ? supabaseOrder.status_history 
            : [],
        subtotal: parseFloat(supabaseOrder.subtotal.toString()),
        shippingCost: parseFloat(supabaseOrder.shipping_cost.toString()),
        tax: parseFloat(supabaseOrder.tax.toString()),
        total: parseFloat(supabaseOrder.total.toString()),
        currency: supabaseOrder.currency as 'USD' | 'CAD' | 'MXN',
        date: supabaseOrder.created_at,
        trackingNumber: supabaseOrder.tracking_number || undefined,
        paymentMethod: supabaseOrder.payment_method || 'Non spécifié',
        paymentId: supabaseOrder.payment_id || undefined,
        internalNotes: supabaseOrder.internal_notes || undefined,
    };
}

// ============================================================================
// PUBLIC FUNCTIONS
// ============================================================================

/**
 * Récupère une commande par son ID
 * Peut être utilisé pour le suivi de commande sans compte (par email)
 */
export async function getOrderById(id: string): Promise<Order | null> {
    try {
        const { data, error } = await supabase
            .from('orders')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            console.error('Error fetching order:', error);
            return null;
        }

        return convertSupabaseToOrder(data);
    } catch (error) {
        console.error('Error in getOrderById:', error);
        return null;
    }
}

/**
 * Récupère une commande par son numéro
 * Peut être utilisé pour le suivi de commande sans compte
 */
export async function getOrderByNumber(orderNumber: string): Promise<Order | null> {
    try {
        const { data, error } = await supabase
            .from('orders')
            .select('*')
            .eq('order_number', orderNumber)
            .single();

        if (error) {
            console.error('Error fetching order by number:', error);
            return null;
        }

        return convertSupabaseToOrder(data);
    } catch (error) {
        console.error('Error in getOrderByNumber:', error);
        return null;
    }
}

/**
 * Récupère une commande par email (pour le suivi sans compte)
 */
export async function getOrderByEmailAndNumber(
    email: string,
    orderNumber: string
): Promise<Order | null> {
    try {
        const { data, error } = await supabase
            .from('orders')
            .select('*')
            .eq('order_number', orderNumber)
            .eq('customer_email', email)
            .single();

        if (error) {
            console.error('Error fetching order by email and number:', error);
            return null;
        }

        return convertSupabaseToOrder(data);
    } catch (error) {
        console.error('Error in getOrderByEmailAndNumber:', error);
        return null;
    }
}

/**
 * Récupère une commande par email et soit numéro de commande soit numéro de suivi
 */
export async function getOrderByEmailAndIdentifier(
    email: string,
    identifier: string
): Promise<Order | null> {
    try {
        // Rechercher d'abord par order_number
        const { data: orderByNumber, error: errorByNumber } = await supabase
            .from('orders')
            .select('*')
            .eq('order_number', identifier)
            .eq('customer_email', email)
            .single();

        if (!errorByNumber && orderByNumber) {
            return convertSupabaseToOrder(orderByNumber);
        }

        // Si pas trouvé, rechercher par tracking_number
        const { data: orderByTracking, error: errorByTracking } = await supabase
            .from('orders')
            .select('*')
            .eq('tracking_number', identifier)
            .eq('customer_email', email)
            .single();

        if (!errorByTracking && orderByTracking) {
            return convertSupabaseToOrder(orderByTracking);
        }

        return null;
    } catch (error) {
        console.error('Error in getOrderByEmailAndIdentifier:', error);
        return null;
    }
}

/**
 * Récupère les commandes d'un client (si connecté)
 */
export async function getCustomerOrders(customerId: string): Promise<Order[]> {
    try {
        const { data, error } = await supabase
            .from('orders')
            .select('*')
            .eq('customer_id', customerId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching customer orders:', error);
            return [];
        }

        return data.map(convertSupabaseToOrder);
    } catch (error) {
        console.error('Error in getCustomerOrders:', error);
        return [];
    }
}

// ============================================================================
// ADMIN FUNCTIONS (Server-side only)
// ============================================================================

/**
 * Récupère toutes les commandes (Admin)
 * ⚠️ ATTENTION: Cette fonction charge TOUTES les commandes en mémoire
 * Pour de meilleures performances, utilisez getAllOrdersPaginated() avec pagination
 */
export async function getAllOrders(): Promise<Order[]> {
    try {
        // Utiliser une requête paginée avec une limite élevée (1000)
        // Pour éviter de charger des millions de commandes en mémoire
        let allOrders: Order[] = [];
        let page = 0;
        const pageSize = 1000;
        let hasMore = true;

        while (hasMore) {
            const { data, error } = await supabaseAdmin
                .from('orders')
                .select('id, order_number, customer_id, customer_name, customer_email, customer_phone, shipping_address, items, status, status_history, subtotal, shipping_cost, tax, total, currency, payment_method, payment_id, payment_status, tracking_number, internal_notes, created_at, updated_at')
                .order('created_at', { ascending: false })
                .range(page * pageSize, (page + 1) * pageSize - 1);

            if (error) {
                console.error('Error fetching all orders:', error);
                break;
            }

            if (!data || data.length === 0) {
                hasMore = false;
                break;
            }

            allOrders = allOrders.concat(data.map((order: any) => convertSupabaseToOrder(order)));
            
            // Si on a récupéré moins que pageSize, on a atteint la fin
            if (data.length < pageSize) {
                hasMore = false;
            } else {
                page++;
            }
        }

        return allOrders;
    } catch (error) {
        console.error('Error in getAllOrders:', error);
        return [];
    }
}

/**
 * Récupère les commandes avec pagination (Admin - RECOMMANDÉ)
 * @param page - Numéro de page (0-indexed)
 * @param pageSize - Nombre d'éléments par page (défaut: 50)
 * @returns Object avec orders, totalCount, hasMore
 */
export async function getAllOrdersPaginated(
    page: number = 0,
    pageSize: number = 50
): Promise<{ orders: Order[]; totalCount: number; hasMore: boolean }> {
    try {
        // Compter le total d'abord (optimisé)
        const { count, error: countError } = await supabaseAdmin
            .from('orders')
            .select('*', { count: 'exact', head: true });

        if (countError) {
            console.error('Error counting orders:', countError);
            return { orders: [], totalCount: 0, hasMore: false };
        }

        const totalCount = count || 0;
        const offset = page * pageSize;

        // Récupérer les commandes paginées (colonnes spécifiques pour optimiser)
        const { data, error } = await supabaseAdmin
            .from('orders')
            .select('id, order_number, customer_id, customer_name, customer_email, customer_phone, shipping_address, items, status, status_history, subtotal, shipping_cost, tax, total, currency, payment_method, payment_id, payment_status, tracking_number, internal_notes, created_at, updated_at')
            .order('created_at', { ascending: false })
            .range(offset, offset + pageSize - 1);

        if (error) {
            console.error('Error fetching paginated orders:', error);
            return { orders: [], totalCount: 0, hasMore: false };
        }

        const orders = (data || []).map(convertSupabaseToOrder);
        const hasMore = offset + orders.length < totalCount;

        return {
            orders,
            totalCount,
            hasMore,
        };
    } catch (error) {
        console.error('Error in getAllOrdersPaginated:', error);
        return { orders: [], totalCount: 0, hasMore: false };
    }
}

/**
 * Récupère les commandes par statut (Admin)
 */
export async function getOrdersByStatus(status: OrderStatus): Promise<Order[]> {
    try {
        const { data, error } = await supabaseAdmin
            .from('orders')
            .select('*')
            .eq('status', status)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching orders by status:', error);
            return [];
        }

        return data.map(convertSupabaseToOrder);
    } catch (error) {
        console.error('Error in getOrdersByStatus:', error);
        return [];
    }
}

/**
 * Crée une nouvelle commande
 * Supporte les commandes sans compte (guest checkout) - customerId est optionnel
 */
export async function createOrder(orderData: {
    customerId?: string; // Optionnel - pour les commandes sans compte
    customerName: string;
    customerEmail: string;
    customerPhone?: string;
    shippingAddress: ShippingAddress;
    items: OrderItem[];
    subtotal: number;
    shippingCost: number;
    tax: number;
    total: number;
    currency: 'USD' | 'CAD' | 'MXN';
    paymentMethod: string;
    paymentId?: string;
    paymentStatus?: string;
}): Promise<Order | null> {
    try {
        // Générer le numéro de commande
        const { data: orderNumberData, error: orderNumberError } = await supabaseAdmin
            .rpc('generate_order_number');

        if (orderNumberError) {
            console.error('Error generating order number:', orderNumberError);
            return null;
        }

        const orderNumber = orderNumberData || `ORD-MON-${String(Date.now()).slice(-6)}`;

        // Créer la commande (customer_id peut être NULL pour les commandes sans compte)
        const { data, error } = await supabaseAdmin
            .from('orders')
            .insert({
                order_number: orderNumber,
                customer_id: orderData.customerId || null, // NULL pour les commandes sans compte
                customer_name: orderData.customerName,
                customer_email: orderData.customerEmail,
                customer_phone: orderData.customerPhone || null,
                shipping_address: orderData.shippingAddress,
                items: orderData.items,
                status: 'pending',
                status_history: [{
                    status: 'pending',
                    timestamp: new Date().toISOString(),
                    note: 'Commande reçue',
                }],
                subtotal: orderData.subtotal,
                shipping_cost: orderData.shippingCost,
                tax: orderData.tax,
                total: orderData.total,
                currency: orderData.currency,
                payment_method: orderData.paymentMethod,
                payment_id: orderData.paymentId || null,
                payment_status: orderData.paymentStatus || 'pending',
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating order:', error);
            return null;
        }

        // Créer les order_items
        if (orderData.items.length > 0) {
            const orderItems = orderData.items.map(item => ({
                order_id: data.id,
                product_id: item.productId,
                product_name: item.name,
                quantity: item.quantity,
                price: item.price,
                size: item.size,
                sku: item.id, // Utiliser l'ID de l'item comme SKU temporaire
                image_url: item.image,
            }));

            const { error: itemsError } = await supabaseAdmin
                .from('order_items')
                .insert(orderItems);

            if (itemsError) {
                console.error('Error creating order items:', itemsError);
            }
        }

        return convertSupabaseToOrder(data);
    } catch (error) {
        console.error('Error in createOrder:', error);
        return null;
    }
}

/**
 * Récupère une commande par payment_id
 */
export async function getOrderByPaymentId(paymentId: string): Promise<Order | null> {
    try {
        const { data, error } = await supabaseAdmin
            .from('orders')
            .select('*')
            .eq('payment_id', paymentId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                // Aucune commande trouvée
                return null;
            }
            console.error('Error fetching order by payment ID:', error);
            return null;
        }

        return convertSupabaseToOrder(data);
    } catch (error) {
        console.error('Error in getOrderByPaymentId:', error);
        return null;
    }
}

/**
 * Met à jour le statut d'une commande
 */
export async function updateOrderStatus(
    orderId: string,
    status: OrderStatus,
    note?: string,
    updatedBy?: string,
    trackingNumber?: string
): Promise<boolean> {
    try {
        // Récupérer la commande actuelle
        const { data: currentOrder, error: fetchError } = await supabaseAdmin
            .from('orders')
            .select('status_history')
            .eq('id', orderId)
            .single();

        if (fetchError) {
            console.error('Error fetching order:', fetchError);
            return false;
        }

        // Ajouter le nouveau statut à l'historique
        const statusHistory = Array.isArray(currentOrder.status_history) 
            ? currentOrder.status_history 
            : [];
        
        statusHistory.push({
            status,
            timestamp: new Date().toISOString(),
            note: note || `Statut changé à ${status}`,
            updatedBy: updatedBy || 'system',
        });

        // Mettre à jour la commande
        const updateData: any = {
            status,
            status_history: statusHistory,
        };

        if (trackingNumber) {
            updateData.tracking_number = trackingNumber;
        }

        const { error } = await supabaseAdmin
            .from('orders')
            .update(updateData)
            .eq('id', orderId);

        if (error) {
            console.error('Error updating order status:', error);
            return false;
        }

        return true;
    } catch (error) {
        console.error('Error in updateOrderStatus:', error);
        return false;
    }
}

/**
 * Met à jour une commande (Admin)
 */
export async function updateOrder(
    orderId: string,
    updates: Partial<{
        status: OrderStatus;
        trackingNumber: string;
        internalNotes: string;
        paymentStatus: string;
    }>
): Promise<Order | null> {
    try {
        const updateData: any = {};

        if (updates.status !== undefined) updateData.status = updates.status;
        if (updates.trackingNumber !== undefined) updateData.tracking_number = updates.trackingNumber;
        if (updates.internalNotes !== undefined) updateData.internal_notes = updates.internalNotes;
        if (updates.paymentStatus !== undefined) updateData.payment_status = updates.paymentStatus;

        const { data, error } = await supabaseAdmin
            .from('orders')
            .update(updateData)
            .eq('id', orderId)
            .select()
            .single();

        if (error) {
            console.error('Error updating order:', error);
            return null;
        }

        return convertSupabaseToOrder(data);
    } catch (error) {
        console.error('Error in updateOrder:', error);
        return null;
    }
}

/**
 * Annule une commande et libère le stock réservé (Admin uniquement)
 * Utilise la fonction SQL rollback_order pour garantir l'atomicité
 * Envoie un email au client et effectue le remboursement automatique si un paiement existe
 */
export async function cancelOrder(orderId: string, reason?: string): Promise<{ success: boolean; refundId?: string; emailSent?: boolean; error?: string }> {
    try {
        // Vérifier que la commande existe et peut être annulée
        const order = await getOrderById(orderId);
        if (!order) {
            console.error('Order not found:', orderId);
            return { success: false, error: 'Commande non trouvée' };
        }

        // Vérifier que la commande n'est pas déjà livrée ou annulée
        if (order.status === 'delivered') {
            console.error('Cannot cancel delivered order:', orderId);
            return { success: false, error: 'Impossible d\'annuler une commande déjà livrée' };
        }

        if (order.status === 'cancelled') {
            console.error('Order already cancelled:', orderId);
            return { success: false, error: 'Commande déjà annulée' };
        }

        // Récupérer le payment_id depuis la base de données (pas dans le type Order actuel)
        const { data: orderData, error: fetchError } = await supabaseAdmin
            .from('orders')
            .select('payment_id, payment_status')
            .eq('id', orderId)
            .single();

        if (fetchError) {
            console.error('Error fetching order payment info:', fetchError);
        }

        const paymentId = orderData?.payment_id;
        const paymentStatus = orderData?.payment_status;

        // Effectuer le remboursement si un paiement existe et n'a pas déjà été remboursé
        let refundId: string | undefined;
        let refundStatus: 'completed' | 'pending' | undefined = undefined;
        
        if (paymentId && paymentStatus !== 'refunded') {
            try {
                console.log('💰 [CANCEL ORDER] Remboursement du paiement:', paymentId);
                
                // Convertir le montant total en centimes pour Stripe
                const amountInCents = Math.round(order.total * 100);
                
                const refundResult = await refundPayment({
                    paymentId: paymentId,
                    amount: amountInCents,
                    reason: 'requested_by_customer',
                });

                if (refundResult.success) {
                    refundId = refundResult.refundId;
                    refundStatus = 'completed';
                    console.log('✅ [CANCEL ORDER] Remboursement effectué:', refundId);
                    
                    // Mettre à jour le statut de paiement
                    await supabaseAdmin
                        .from('orders')
                        .update({ payment_status: 'refunded' })
                        .eq('id', orderId);
                } else {
                    console.error('❌ [CANCEL ORDER] Erreur remboursement:', refundResult.error);
                    refundStatus = 'pending';
                    // Continuer quand même avec l'annulation même si le remboursement échoue
                }
            } catch (refundError: any) {
                console.error('❌ [CANCEL ORDER] Exception lors du remboursement:', refundError);
                refundStatus = 'pending';
                // Continuer avec l'annulation même si le remboursement échoue
            }
        } else if (!paymentId) {
            console.log('ℹ️ [CANCEL ORDER] Aucun paiement associé à cette commande');
        } else {
            console.log('ℹ️ [CANCEL ORDER] Paiement déjà remboursé');
        }

        // Appeler la fonction SQL rollback_order qui libère le stock et annule la commande
        const { error } = await supabaseAdmin.rpc('rollback_order', {
            p_order_id: orderId
        });

        if (error) {
            console.error('Error calling rollback_order:', error);
            return { success: false, error: 'Erreur lors de l\'annulation de la commande' };
        }

        // Mettre à jour l'historique avec la raison de l'annulation
        const updatedOrder = await getOrderById(orderId);
        if (updatedOrder) {
            const statusHistory = Array.isArray(updatedOrder.statusHistory) 
                ? updatedOrder.statusHistory 
                : [];
            
            const cancellationNote = reason 
                ? `Commande annulée par l'administrateur. Raison: ${reason}${refundId ? ` Remboursement: ${refundId}` : ''}`
                : `Commande annulée par l'administrateur${refundId ? `. Remboursement: ${refundId}` : ''}`;
            
            statusHistory.push({
                status: 'cancelled',
                timestamp: new Date().toISOString(),
                note: cancellationNote,
                updatedBy: 'admin',
            });

            await supabaseAdmin
                .from('orders')
                .update({ status_history: statusHistory })
                .eq('id', orderId);
        }

        // Envoyer l'email de notification au client
        let emailSent = false;
        try {
            console.log('📧 [CANCEL ORDER] Envoi de l\'email d\'annulation à:', order.customerEmail);
            
            const emailResult = await sendOrderCancellationEmail({
                orderNumber: order.orderNumber || order.id,
                customerEmail: order.customerEmail,
                customerName: order.customerName,
                items: order.items.map(item => ({
                    name: item.name,
                    quantity: item.quantity,
                    price: item.price,
                    size: item.size,
                })),
                total: order.total,
                currency: order.currency,
                reason: reason,
                refundAmount: order.total,
                refundStatus: refundStatus,
            });

            if (emailResult.success) {
                emailSent = true;
                console.log('✅ [CANCEL ORDER] Email d\'annulation envoyé avec succès');
            } else {
                console.error('❌ [CANCEL ORDER] Erreur envoi email:', emailResult.error);
            }
        } catch (emailError: any) {
            console.error('❌ [CANCEL ORDER] Exception lors de l\'envoi de l\'email:', emailError);
            // Ne pas faire échouer l'annulation si l'email échoue
        }

        return {
            success: true,
            refundId,
            emailSent,
        };
    } catch (error: any) {
        console.error('Error in cancelOrder:', error);
        return { success: false, error: error.message || 'Erreur lors de l\'annulation de la commande' };
    }
}