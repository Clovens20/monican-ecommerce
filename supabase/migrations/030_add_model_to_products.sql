-- ============================================================================
-- MIGRATION 030: Ajout de la colonne model à la table products
-- ============================================================================
-- Cette colonne permet de stocker le modèle du produit

-- Ajouter la colonne 'model' à la table 'products'
ALTER TABLE products
ADD COLUMN IF NOT EXISTS model VARCHAR(255);

-- Ajouter un commentaire pour documenter la colonne
COMMENT ON COLUMN products.model IS 'Modèle du produit';

