-- ============================================================================
-- MIGRATION 031: Ajout de la colonne purchase_price (prix d'achat) à la table products
-- ============================================================================
-- Cette colonne permet de stocker le prix d'achat du produit (coût + dépenses)
-- pour calculer le bénéfice (prix de vente - prix d'achat)

-- Ajouter la colonne 'purchase_price' à la table 'products'
ALTER TABLE products
ADD COLUMN IF NOT EXISTS purchase_price DECIMAL(10, 2) CHECK (purchase_price >= 0);

-- Ajouter un commentaire pour documenter la colonne
COMMENT ON COLUMN products.purchase_price IS 'Prix d''achat du produit (coût + dépenses incluses) pour le calcul du bénéfice';

