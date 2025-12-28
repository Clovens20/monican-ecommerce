-- ============================================================================
-- Migration 032: Créer la table physical_sales pour enregistrer les ventes physiques
-- ============================================================================

-- Table pour enregistrer toutes les ventes physiques (magasin physique)
CREATE TABLE IF NOT EXISTS physical_sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    product_name VARCHAR(255) NOT NULL, -- Nom du produit au moment de la vente (pour l'historique)
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    size VARCHAR(50), -- Taille vendue (optionnel)
    color VARCHAR(50), -- Couleur vendue (optionnel)
    unit_price DECIMAL(10, 2) NOT NULL CHECK (unit_price >= 0), -- Prix unitaire au moment de la vente
    total_amount DECIMAL(10, 2) NOT NULL CHECK (total_amount >= 0), -- Montant total de la vente
    sold_by UUID REFERENCES user_profiles(id), -- Admin qui a enregistré la vente
    notes TEXT, -- Notes optionnelles sur la vente
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index pour améliorer les performances des requêtes
CREATE INDEX IF NOT EXISTS idx_physical_sales_product_id ON physical_sales(product_id);
CREATE INDEX IF NOT EXISTS idx_physical_sales_created_at ON physical_sales(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_physical_sales_sold_by ON physical_sales(sold_by);
-- Index sur la date (sans la fonction DATE() pour éviter l'erreur IMMUTABLE)
-- L'index sur created_at DESC est suffisant pour les requêtes par date

-- Trigger pour mettre à jour updated_at automatiquement
DROP TRIGGER IF EXISTS update_physical_sales_updated_at ON physical_sales;
CREATE TRIGGER update_physical_sales_updated_at BEFORE UPDATE ON physical_sales
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Commentaires
COMMENT ON TABLE physical_sales IS 'Enregistre toutes les ventes effectuées en magasin physique';
COMMENT ON COLUMN physical_sales.product_id IS 'Référence au produit vendu (peut être NULL si le produit est supprimé)';
COMMENT ON COLUMN physical_sales.product_name IS 'Nom du produit au moment de la vente (pour l''historique)';
COMMENT ON COLUMN physical_sales.quantity IS 'Quantité d''unités vendues';
COMMENT ON COLUMN physical_sales.size IS 'Taille du produit vendu (optionnel)';
COMMENT ON COLUMN physical_sales.color IS 'Couleur du produit vendu (optionnel)';
COMMENT ON COLUMN physical_sales.unit_price IS 'Prix unitaire au moment de la vente';
COMMENT ON COLUMN physical_sales.total_amount IS 'Montant total de la vente (quantity * unit_price)';
COMMENT ON COLUMN physical_sales.sold_by IS 'Admin qui a enregistré la vente';
COMMENT ON COLUMN physical_sales.notes IS 'Notes optionnelles sur la vente';

