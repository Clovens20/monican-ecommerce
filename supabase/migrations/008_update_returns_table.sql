-- ============================================================================
-- Migration: Mise à jour de la table returns pour ajouter les nouvelles fonctionnalités
-- ============================================================================

-- Ajouter les colonnes manquantes
ALTER TABLE returns 
ADD COLUMN IF NOT EXISTS product_photo_url VARCHAR(500),
ADD COLUMN IF NOT EXISTS qr_code_url VARCHAR(500),
ADD COLUMN IF NOT EXISTS return_address JSONB,
ADD COLUMN IF NOT EXISTS selected_items JSONB, -- Produits sélectionnés pour le retour
ADD COLUMN IF NOT EXISTS refund_method VARCHAR(50), -- Méthode de remboursement
ADD COLUMN IF NOT EXISTS refund_transaction_id VARCHAR(255); -- ID de transaction de remboursement

-- Index pour les nouvelles colonnes
CREATE INDEX IF NOT EXISTS idx_returns_qr_code ON returns(qr_code_url);
CREATE INDEX IF NOT EXISTS idx_returns_refund_transaction ON returns(refund_transaction_id);

