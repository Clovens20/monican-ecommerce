-- ============================================================================
-- TABLE: newsletter_subscribers
-- ============================================================================
-- Table pour stocker les abonnés à la newsletter
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'unsubscribed', 'bounced')),
    subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    unsubscribed_at TIMESTAMP WITH TIME ZONE,
    source VARCHAR(50) DEFAULT 'website', -- 'website', 'admin', 'import'
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_newsletter_email ON newsletter_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_newsletter_status ON newsletter_subscribers(status);
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribed_at ON newsletter_subscribers(subscribed_at DESC);

-- Trigger pour mettre à jour updated_at
DROP TRIGGER IF EXISTS update_newsletter_subscribers_updated_at ON newsletter_subscribers;
CREATE TRIGGER update_newsletter_subscribers_updated_at BEFORE UPDATE ON newsletter_subscribers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS pour newsletter_subscribers
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Policy pour admins: full access
DROP POLICY IF EXISTS "Admins can manage newsletter subscribers" ON newsletter_subscribers;
CREATE POLICY "Admins can manage newsletter subscribers" ON newsletter_subscribers
FOR ALL USING (EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.id = auth.uid() AND user_profiles.role = 'admin'));

-- Policy pour clients: can insert (subscribe) but not read
DROP POLICY IF EXISTS "Clients can subscribe to newsletter" ON newsletter_subscribers;
CREATE POLICY "Clients can subscribe to newsletter" ON newsletter_subscribers
FOR INSERT WITH CHECK (true);

