-- ============================================================================
-- ✅ CORRECTION 1: Fonction de réservation de stock avec verrouillage atomique
-- ============================================================================
-- Cette migration corrige les race conditions en ajoutant FOR UPDATE
-- Date: 2024-01-XX
-- ============================================================================

-- Supprimer explicitement toutes les versions possibles de ces fonctions
-- pour éviter l'erreur "function name is not unique"
-- CASCADE permet de supprimer même si d'autres objets dépendent de ces fonctions
DROP FUNCTION IF EXISTS check_and_reserve_stock(UUID, VARCHAR, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS check_and_reserve_stock(UUID, TEXT, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS confirm_stock_reduction(UUID, VARCHAR, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS confirm_stock_reduction(UUID, TEXT, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS release_reserved_stock(UUID, VARCHAR, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS release_reserved_stock(UUID, TEXT, INTEGER) CASCADE;

-- Fonction de vérification et réservation de stock avec verrouillage
-- Utilisation de TEXT pour compatibilité (TEXT et VARCHAR sont compatibles en PostgreSQL)
CREATE OR REPLACE FUNCTION check_and_reserve_stock(
    p_product_id UUID,
    p_size TEXT,
    p_quantity INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
    available_stock INTEGER;
BEGIN
    -- 🔒 VERROUILLAGE DE LA LIGNE (FOR UPDATE)
    -- Empêche les race conditions en verrouillant la ligne pendant la transaction
    SELECT stock_quantity - reserved_quantity INTO available_stock
    FROM inventory
    WHERE product_id = p_product_id AND size = p_size
    FOR UPDATE;  -- ⚠️ CRITIQUE: Empêche les race conditions
    
    -- Si le stock n'existe pas ou est insuffisant
    IF available_stock IS NULL OR available_stock < p_quantity THEN
        RETURN FALSE;
    END IF;
    
    -- Réserver le stock de manière atomique
    UPDATE inventory
    SET reserved_quantity = reserved_quantity + p_quantity,
        updated_at = NOW()
    WHERE product_id = p_product_id AND size = p_size;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour confirmer la réduction de stock (après paiement réussi)
CREATE OR REPLACE FUNCTION confirm_stock_reduction(
    p_product_id UUID,
    p_size TEXT,
    p_quantity INTEGER
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Réduire le stock réel et libérer la réservation
    UPDATE inventory
    SET 
        stock_quantity = stock_quantity - p_quantity,
        reserved_quantity = GREATEST(reserved_quantity - p_quantity, 0),
        updated_at = NOW()
    WHERE product_id = p_product_id 
      AND size = p_size
      AND stock_quantity >= p_quantity;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour libérer le stock réservé (en cas d'échec)
CREATE OR REPLACE FUNCTION release_reserved_stock(
    p_product_id UUID,
    p_size TEXT,
    p_quantity INTEGER
)
RETURNS VOID AS $$
BEGIN
    -- Libérer uniquement la réservation sans toucher au stock réel
    UPDATE inventory
    SET 
        reserved_quantity = GREATEST(reserved_quantity - p_quantity, 0),
        updated_at = NOW()
    WHERE product_id = p_product_id AND size = p_size;
END;
$$ LANGUAGE plpgsql;

-- Commentaires pour documentation
COMMENT ON FUNCTION check_and_reserve_stock(UUID, TEXT, INTEGER) IS 'Vérifie et réserve le stock de manière atomique avec verrouillage FOR UPDATE pour éviter les race conditions';
COMMENT ON FUNCTION confirm_stock_reduction(UUID, TEXT, INTEGER) IS 'Confirme la réduction de stock après paiement réussi';
COMMENT ON FUNCTION release_reserved_stock(UUID, TEXT, INTEGER) IS 'Libère le stock réservé en cas d''échec de paiement ou de commande';

