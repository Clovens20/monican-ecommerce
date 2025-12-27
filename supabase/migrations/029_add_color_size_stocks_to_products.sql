-- ============================================================================
-- MIGRATION 029: Ajout de la colonne color_size_stocks à la table products
-- ============================================================================
-- Cette colonne permet de stocker les stocks par couleur et taille
-- Format: JSONB array of {color, size, stock, sku}

-- Ajouter la colonne 'color_size_stocks' à la table 'products'
ALTER TABLE products
ADD COLUMN IF NOT EXISTS color_size_stocks JSONB DEFAULT '[]'::jsonb;

-- Ajouter un commentaire pour documenter la colonne
COMMENT ON COLUMN products.color_size_stocks IS 'Tableau JSONB contenant les stocks par couleur et taille: [{color, size, stock, sku}]';

