-- ============================================================================
-- ✅ CORRECTION 7: Procédures SQL pour transactions et gestion des statuts
-- ============================================================================
-- Cette migration ajoute des fonctions pour gérer les transactions de manière atomique
-- Date: 2024-01-XX
-- ============================================================================

-- Fonction de mise à jour du statut de paiement avec mise à jour automatique du statut de commande
CREATE OR REPLACE FUNCTION update_order_payment_status(
    p_payment_id TEXT,
    p_payment_status TEXT,
    p_updated_at TIMESTAMP WITH TIME ZONE
)
RETURNS VOID AS $$
BEGIN
    UPDATE orders
    SET 
        payment_status = p_payment_status,
        status = CASE 
            WHEN p_payment_status = 'COMPLETED' THEN 'confirmed'
            WHEN p_payment_status = 'FAILED' THEN 'cancelled'
            WHEN p_payment_status = 'CANCELED' THEN 'cancelled'
            WHEN p_payment_status = 'REFUNDED' THEN 'cancelled'
            ELSE status
        END,
        updated_at = p_updated_at
    WHERE payment_id = p_payment_id;

    -- Vérifier qu'une ligne a été mise à jour
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Commande avec payment_id % introuvable', p_payment_id;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Fonction de rollback complet d'une commande
-- Libère le stock réservé et annule la commande
CREATE OR REPLACE FUNCTION rollback_order(
    p_order_id UUID
)
RETURNS VOID AS $$
DECLARE
    v_order_items RECORD;
BEGIN
    -- Libérer le stock réservé pour tous les items de la commande
    FOR v_order_items IN 
        SELECT product_id, size, quantity 
        FROM order_items 
        WHERE order_id = p_order_id
    LOOP
        UPDATE inventory
        SET 
            reserved_quantity = GREATEST(reserved_quantity - v_order_items.quantity, 0),
            updated_at = NOW()
        WHERE product_id = v_order_items.product_id 
          AND size = v_order_items.size;
    END LOOP;

    -- Marquer la commande comme annulée
    UPDATE orders
    SET 
        status = 'cancelled',
        updated_at = NOW()
    WHERE id = p_order_id;
END;
$$ LANGUAGE plpgsql;

-- Commentaires pour documentation
COMMENT ON FUNCTION update_order_payment_status(TEXT, TEXT, TIMESTAMP WITH TIME ZONE) IS 'Met à jour le statut de paiement d''une commande et ajuste automatiquement le statut de commande';
COMMENT ON FUNCTION rollback_order(UUID) IS 'Annule une commande et libère le stock réservé pour tous ses items';

