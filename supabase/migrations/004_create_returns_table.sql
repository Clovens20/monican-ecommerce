-- ============================================================================
-- Migration: Création de la table returns pour gérer les retours de produits
-- ============================================================================

CREATE TABLE IF NOT EXISTS returns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    return_label VARCHAR(255) NOT NULL, -- Numéro d'étiquette de retour généré
    tracking_number VARCHAR(255), -- Numéro de suivi donné au bureau d'envoi
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_transit', 'received', 'inspected', 'approved', 'refunded', 'rejected')),
    customer_email VARCHAR(255) NOT NULL,
    customer_name VARCHAR(255),
    reason TEXT, -- Raison du retour (optionnel)
    items JSONB, -- Articles retournés (copie des items de la commande)
    return_cost DECIMAL(10, 2) DEFAULT 0, -- Frais de retour payés par le client
    refund_amount DECIMAL(10, 2), -- Montant à rembourser (calculé après inspection)
    currency VARCHAR(3) NOT NULL CHECK (currency IN ('USD', 'CAD', 'MXN')),
    notes TEXT, -- Notes internes (par l'admin)
    admin_notes TEXT, -- Notes de l'admin après inspection
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    shipped_at TIMESTAMP WITH TIME ZONE, -- Date d'envoi (quand le tracking_number est ajouté)
    received_at TIMESTAMP WITH TIME ZONE, -- Date de réception
    inspected_at TIMESTAMP WITH TIME ZONE, -- Date d'inspection
    refunded_at TIMESTAMP WITH TIME ZONE -- Date de remboursement
);

-- Index pour faciliter les recherches
CREATE INDEX IF NOT EXISTS idx_returns_order_id ON returns(order_id);
CREATE INDEX IF NOT EXISTS idx_returns_status ON returns(status);
CREATE INDEX IF NOT EXISTS idx_returns_tracking_number ON returns(tracking_number);
CREATE INDEX IF NOT EXISTS idx_returns_customer_email ON returns(customer_email);
CREATE INDEX IF NOT EXISTS idx_returns_created_at ON returns(created_at DESC);

-- Trigger pour mettre à jour updated_at automatiquement
DROP TRIGGER IF EXISTS update_returns_updated_at ON returns;
CREATE TRIGGER update_returns_updated_at BEFORE UPDATE ON returns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Row Level Security (RLS) pour returns
-- ============================================================================

ALTER TABLE returns ENABLE ROW LEVEL SECURITY;

-- Les admins peuvent tout voir
DROP POLICY IF EXISTS "Admins can view all returns" ON returns;
CREATE POLICY "Admins can view all returns" ON returns
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Les admins peuvent tout modifier
DROP POLICY IF EXISTS "Admins can manage all returns" ON returns;
CREATE POLICY "Admins can manage all returns" ON returns
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Les clients peuvent voir leurs propres retours (par email)
DROP POLICY IF EXISTS "Customers can view their own returns" ON returns;
CREATE POLICY "Customers can view their own returns" ON returns
    FOR SELECT USING (
        customer_email = auth.email()
        OR
        EXISTS (
            SELECT 1 FROM orders
            WHERE orders.id = returns.order_id 
            AND orders.customer_id = auth.uid()
        )
    );

-- Les clients peuvent créer et mettre à jour leurs propres retours (ajouter tracking_number)
DROP POLICY IF EXISTS "Customers can create and update their returns" ON returns;
CREATE POLICY "Customers can create and update their returns" ON returns
    FOR ALL USING (
        customer_email = auth.email()
        OR
        EXISTS (
            SELECT 1 FROM orders
            WHERE orders.id = returns.order_id 
            AND orders.customer_id = auth.uid()
        )
    );

-- Commentaires pour documentation
COMMENT ON TABLE returns IS 'Table pour gérer les retours de produits';
COMMENT ON COLUMN returns.return_label IS 'Numéro d''étiquette de retour généré automatiquement';
COMMENT ON COLUMN returns.tracking_number IS 'Numéro de suivi donné au bureau d''envoi par le client';
COMMENT ON COLUMN returns.status IS 'Statut du retour: pending, in_transit, received, inspected, approved, refunded, rejected';
COMMENT ON COLUMN returns.shipped_at IS 'Date d''envoi (quand le tracking_number est ajouté)';

