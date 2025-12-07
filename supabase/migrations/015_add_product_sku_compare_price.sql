-- ============================================================================
-- MIGRATION 015: Ajout des champs SKU principal et prix comparatif aux produits
-- ============================================================================

-- Ajouter la colonne 'sku' à la table 'products'
ALTER TABLE products
ADD COLUMN IF NOT EXISTS sku VARCHAR(100) UNIQUE;

-- Ajouter la colonne 'compare_price' à la table 'products'
ALTER TABLE products
ADD COLUMN IF NOT EXISTS compare_price DECIMAL(10, 2) CHECK (compare_price >= 0);

-- Ajouter la colonne 'is_draft' à la table 'products'
ALTER TABLE products
ADD COLUMN IF NOT EXISTS is_draft BOOLEAN DEFAULT FALSE;

-- Mettre à jour les produits existants pour avoir un SKU par défaut si nécessaire
-- (Optionnel, si vous voulez que les anciens produits aient un SKU)
-- UPDATE products SET sku = 'SKU-' || LPAD(id::text, 6, '0') WHERE sku IS NULL;

-- Mettre à jour les commentaires des colonnes
COMMENT ON COLUMN products.sku IS 'SKU principal du produit';
COMMENT ON COLUMN products.compare_price IS 'Prix barré pour afficher une réduction';
COMMENT ON COLUMN products.is_draft IS 'Indique si le produit est un brouillon et non visible publiquement';

