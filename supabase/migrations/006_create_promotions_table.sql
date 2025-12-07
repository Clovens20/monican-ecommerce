-- ============================================================================
-- TABLE: promotions
-- ============================================================================
-- Table pour gérer les promotions et réductions sur les produits
CREATE TABLE IF NOT EXISTS promotions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value DECIMAL(10, 2) NOT NULL CHECK (discount_value >= 0),
    -- Conditions d'application
    applies_to VARCHAR(20) NOT NULL CHECK (applies_to IN ('all', 'category', 'product', 'products')),
    category VARCHAR(100), -- Si applies_to = 'category'
    product_ids JSONB DEFAULT '[]'::jsonb, -- Array de product IDs si applies_to = 'products'
    -- Dates de validité
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    -- Statut
    is_active BOOLEAN DEFAULT true,
    -- Priorité (plus élevé = appliqué en premier si plusieurs promotions)
    priority INTEGER DEFAULT 0,
    -- Code promo optionnel
    promo_code VARCHAR(50) UNIQUE,
    -- Limites
    min_purchase_amount DECIMAL(10, 2) DEFAULT 0,
    max_uses INTEGER, -- Nombre maximum d'utilisations (NULL = illimité)
    current_uses INTEGER DEFAULT 0,
    -- Métadonnées
    banner_image_url VARCHAR(500),
    banner_text VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES user_profiles(id)
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_promotions_is_active ON promotions(is_active);
CREATE INDEX IF NOT EXISTS idx_promotions_dates ON promotions(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_promotions_category ON promotions(category);
CREATE INDEX IF NOT EXISTS idx_promotions_promo_code ON promotions(promo_code);
CREATE INDEX IF NOT EXISTS idx_promotions_priority ON promotions(priority DESC);

-- Trigger pour mettre à jour updated_at
DROP TRIGGER IF EXISTS update_promotions_updated_at ON promotions;
CREATE TRIGGER update_promotions_updated_at BEFORE UPDATE ON promotions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS pour promotions
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;

-- Policy pour admins: full access
DROP POLICY IF EXISTS "Admins can manage promotions" ON promotions;
CREATE POLICY "Admins can manage promotions" ON promotions
FOR ALL USING (EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.id = auth.uid() AND user_profiles.role = 'admin'));

-- Policy pour clients: read active promotions only
DROP POLICY IF EXISTS "Clients can view active promotions" ON promotions;
CREATE POLICY "Clients can view active promotions" ON promotions
FOR SELECT USING (
    is_active = true 
    AND start_date <= CURRENT_TIMESTAMP 
    AND end_date >= CURRENT_TIMESTAMP
    AND (max_uses IS NULL OR current_uses < max_uses)
);

