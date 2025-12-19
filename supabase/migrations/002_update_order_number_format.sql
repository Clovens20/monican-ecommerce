-- Migration pour mettre à jour le format des numéros de commande vers ORD-MON-XXXXXX

-- Étape 1: Mettre à jour la fonction pour générer des numéros au format ORD-MON-XXXXXX
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
    last_number INTEGER;
    new_number TEXT;
BEGIN
    -- Récupérer le dernier numéro qui correspond au format ORD-MON-XXXXXX
    SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM 9) AS INTEGER)), 0) INTO last_number
    FROM orders
    WHERE order_number LIKE 'ORD-MON-%';
    
    -- Si aucun numéro n'existe avec ce format, vérifier les anciens formats
    IF last_number = 0 THEN
        -- Vérifier les anciens formats ORD-XXX
        SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM 5) AS INTEGER)), 0) INTO last_number
        FROM orders
        WHERE order_number LIKE 'ORD-%' AND order_number NOT LIKE 'ORD-MON-%';
    END IF;
    
    -- Générer le nouveau numéro au format ORD-MON-XXXXXX (6 chiffres)
    new_number := 'ORD-MON-' || LPAD((last_number + 1)::TEXT, 6, '0');
    RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Étape 2: Mettre à jour les commandes existantes vers le format ORD-MON-XXXXXX
-- Cette étape convertit toutes les commandes qui n'ont pas déjà le format ORD-MON-XXXXXX
DO $$
DECLARE
    order_record RECORD;
    new_order_number TEXT;
    counter INTEGER := 1;
BEGIN
    -- Compter combien de commandes existent déjà avec le format ORD-MON-XXXXXX
    SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM 9) AS INTEGER)), 0) INTO counter
    FROM orders
    WHERE order_number LIKE 'ORD-MON-%';
    
    -- Parcourir toutes les commandes qui n'ont pas le format ORD-MON-XXXXXX
    -- Triées par date de création pour préserver l'ordre chronologique
    FOR order_record IN 
        SELECT id, order_number, created_at
        FROM orders
        WHERE order_number NOT LIKE 'ORD-MON-%'
        ORDER BY created_at ASC
    LOOP
        -- Incrémenter le compteur
        counter := counter + 1;
        
        -- Générer le nouveau numéro au format ORD-MON-XXXXXX
        new_order_number := 'ORD-MON-' || LPAD(counter::TEXT, 6, '0');
        
        -- Vérifier que le numéro n'existe pas déjà (sécurité)
        WHILE EXISTS (SELECT 1 FROM orders WHERE order_number = new_order_number) LOOP
            counter := counter + 1;
            new_order_number := 'ORD-MON-' || LPAD(counter::TEXT, 6, '0');
        END LOOP;
        
        -- Mettre à jour la commande avec le nouveau numéro
        UPDATE orders
        SET order_number = new_order_number
        WHERE id = order_record.id;
        
        -- Log pour le débogage (optionnel, peut être retiré en production)
        RAISE NOTICE 'Commande % mise à jour: % -> %', order_record.id, order_record.order_number, new_order_number;
    END LOOP;
    
    RAISE NOTICE 'Migration terminée: % commandes mises à jour', counter;
END $$;

