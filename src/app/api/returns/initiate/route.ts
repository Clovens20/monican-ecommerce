import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * API Route pour initier un retour de produit
 * 
 * Cette route :
 * 1. Vérifie que le numéro de commande existe
 * 2. Vérifie que la commande est éligible au retour (dans les 30 jours)
 * 3. Génère une étiquette de retour unique
 * 4. Enregistre la demande de retour en base de données
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { orderNumber } = body;

        if (!orderNumber || typeof orderNumber !== 'string') {
            return NextResponse.json(
                { error: 'Le numéro de commande est requis' },
                { status: 400 }
            );
        }

        // Rechercher la commande par numéro de commande, numéro de suivi, ou ID
        // On cherche dans plusieurs champs possibles
        const searchTerm = orderNumber.trim().toUpperCase();
        
        // Essayer d'abord par order_number exact
        let { data: orders, error: orderError } = await supabaseAdmin
            .from('orders')
            .select('id, order_number, tracking_number, created_at, status, customer_email')
            .eq('order_number', searchTerm)
            .limit(1);

        // Si pas trouvé, chercher par tracking_number
        if ((!orders || orders.length === 0) && !orderError) {
            const { data: trackingOrders, error: trackingError } = await supabaseAdmin
                .from('orders')
                .select('id, order_number, tracking_number, created_at, status, customer_email')
                .eq('tracking_number', searchTerm)
                .limit(1);
            
            if (!trackingError && trackingOrders && trackingOrders.length > 0) {
                orders = trackingOrders;
            } else {
                orderError = trackingError;
            }
        }

        // Si toujours pas trouvé, chercher par ID (si le format correspond à un UUID)
        if ((!orders || orders.length === 0) && !orderError && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderNumber)) {
            const { data: idOrders, error: idError } = await supabaseAdmin
                .from('orders')
                .select('id, order_number, tracking_number, created_at, status, customer_email')
                .eq('id', orderNumber)
                .limit(1);
            
            if (!idError && idOrders && idOrders.length > 0) {
                orders = idOrders;
            } else {
                orderError = idError;
            }
        }

        if (orderError) {
            console.error('Error fetching order:', orderError);
            return NextResponse.json(
                { error: 'Erreur lors de la recherche de la commande' },
                { status: 500 }
            );
        }

        if (!orders || orders.length === 0) {
            return NextResponse.json(
                { error: 'Aucune commande trouvée avec ce numéro. Veuillez vérifier votre numéro de commande.' },
                { status: 404 }
            );
        }

        const order = orders[0];

        // Vérifier que la commande est éligible au retour (dans les 30 jours)
        const orderDate = new Date(order.created_at);
        const now = new Date();
        const daysSinceOrder = Math.floor((now.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24));

        if (daysSinceOrder > 30) {
            return NextResponse.json(
                { error: 'Cette commande ne peut plus être retournée. Le délai de 30 jours a été dépassé.' },
                { status: 400 }
            );
        }

        // Vérifier si un retour existe déjà pour cette commande
        const { data: existingReturns, error: returnCheckError } = await supabaseAdmin
            .from('returns')
            .select('id, status')
            .eq('order_id', order.id)
            .limit(1);

        if (returnCheckError && returnCheckError.code !== 'PGRST116') { // PGRST116 = no rows returned
            console.error('Error checking existing returns:', returnCheckError);
        }

        // Générer un numéro d'étiquette de retour unique
        const returnLabel = `RET-${order.order_number || order.id.substring(0, 8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;

        // Récupérer les items de la commande
        const { data: orderDetails, error: orderDetailsError } = await supabaseAdmin
            .from('orders')
            .select('items, total, currency, customer_name')
            .eq('id', order.id)
            .single();

        // Enregistrer la demande de retour en base de données
        const { data: newReturn, error: insertError } = await supabaseAdmin
            .from('returns')
            .insert({
                order_id: order.id,
                return_label: returnLabel,
                customer_email: order.customer_email,
                customer_name: orderDetails?.customer_name || null,
                items: orderDetails?.items || null,
                currency: orderDetails?.currency || 'USD',
                status: 'pending',
            })
            .select()
            .single();

        if (insertError) {
            console.error('Error creating return record:', insertError);
            // Continuer quand même si l'insertion échoue (pour ne pas bloquer le client)
            // mais logger l'erreur
        }

        return NextResponse.json({
            success: true,
            returnLabel,
            orderNumber: order.order_number || order.tracking_number || order.id,
            message: 'Étiquette de retour générée avec succès. Veuillez imprimer cette étiquette et l\'utiliser pour votre retour.',
            instructions: [
                'Imprimez cette étiquette de retour',
                'Emballez votre article dans son emballage d\'origine (non déchiré)',
                'Collez l\'étiquette sur le colis',
                'Déposez le colis à un point de dépôt ou organisez une collecte',
                'Vous serez responsable des frais de retour',
                'Le remboursement sera effectué après réception et vérification du produit'
            ]
        });

    } catch (error: any) {
        console.error('Error in returns initiate API:', error);
        return NextResponse.json(
            { error: error.message || 'Une erreur est survenue lors de la génération de l\'étiquette de retour' },
            { status: 500 }
        );
    }
}

