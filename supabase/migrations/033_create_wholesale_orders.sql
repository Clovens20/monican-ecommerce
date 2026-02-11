-- ============================================================================
-- Table: wholesale_orders - Demandes de vente en gros
-- ============================================================================

CREATE TABLE IF NOT EXISTS wholesale_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Informations société
    company_name VARCHAR(255) NOT NULL,
    contact_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    tax_id VARCHAR(100),
    
    -- Adresse
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    zip VARCHAR(20) NOT NULL,
    country VARCHAR(10) NOT NULL DEFAULT 'US',
    
    -- Commande
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    total_quantity INTEGER NOT NULL,
    subtotal DECIMAL(12, 2) NOT NULL,
    discount_percent INTEGER NOT NULL DEFAULT 0,
    discount_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
    total DECIMAL(12, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'USD',
    
    -- Notes et statut
    notes TEXT,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'processing', 'completed', 'cancelled')),
    
    -- Métadonnées
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_wholesale_orders_status ON wholesale_orders(status);
CREATE INDEX IF NOT EXISTS idx_wholesale_orders_created_at ON wholesale_orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wholesale_orders_email ON wholesale_orders(email);

-- RLS: Lecture publique désactivée, les wholesale orders sont gérées par l'admin
ALTER TABLE wholesale_orders ENABLE ROW LEVEL SECURITY;

-- Politique: L'admin peut tout voir (via service role)
-- Les insertions publiques sont permises pour le formulaire (sans auth)
CREATE POLICY "Allow public insert for wholesale form"
    ON wholesale_orders FOR INSERT
    TO anon
    WITH CHECK (true);

CREATE POLICY "Allow authenticated admin read"
    ON wholesale_orders FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.id = auth.uid()
            AND user_profiles.role = 'admin'
        )
    );

CREATE POLICY "Allow service role full access"
    ON wholesale_orders FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);
