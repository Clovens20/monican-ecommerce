-- ============================================================================
-- Migration: Ajouter le champ color à la table inventory
-- ============================================================================
-- Cette migration permet de gérer le stock par couleur et taille

-- Ajouter la colonne color (optionnelle pour rétrocompatibilité)
ALTER TABLE inventory 
ADD COLUMN IF NOT EXISTS color VARCHAR(50);

-- Supprimer l'ancienne contrainte UNIQUE qui ne prenait en compte que product_id et size
ALTER TABLE inventory 
DROP CONSTRAINT IF EXISTS inventory_product_id_size_key;

-- Créer une nouvelle contrainte UNIQUE qui inclut la couleur
-- Si color est NULL, on garde l'ancien comportement (un seul variant par taille)
-- Si color est défini, on peut avoir plusieurs combinaisons couleur/taille
CREATE UNIQUE INDEX IF NOT EXISTS inventory_product_color_size_unique 
ON inventory(product_id, COALESCE(color, ''), size);

-- Créer un index pour améliorer les performances de recherche par couleur
CREATE INDEX IF NOT EXISTS idx_inventory_color ON inventory(color) WHERE color IS NOT NULL;

-- Commentaire pour documenter le changement
COMMENT ON COLUMN inventory.color IS 'Couleur du produit (optionnel pour rétrocompatibilité)';

