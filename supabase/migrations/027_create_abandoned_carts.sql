-- ============================================================================
-- Migration: Table pour les paniers abandonnés
-- ============================================================================
-- Cette table permet de tracker les paniers abandonnés et d'envoyer des emails de rappel

CREATE TABLE IF NOT EXISTS abandoned_carts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL,
    cart_data JSONB NOT NULL, -- Données du panier (items, total, etc.)
    token VARCHAR(255) UNIQUE NOT NULL, -- Token unique pour récupérer le panier
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'reminder_sent', 'recovered', 'expired')),
    reminder_sent_at TIMESTAMP WITH TIME ZONE,
    recovered_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'), -- Expire après 7 jours
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index pour les requêtes rapides
CREATE INDEX IF NOT EXISTS idx_abandoned_carts_email ON abandoned_carts(email);
CREATE INDEX IF NOT EXISTS idx_abandoned_carts_token ON abandoned_carts(token);
CREATE INDEX IF NOT EXISTS idx_abandoned_carts_status ON abandoned_carts(status);
CREATE INDEX IF NOT EXISTS idx_abandoned_carts_created_at ON abandoned_carts(created_at);
CREATE INDEX IF NOT EXISTS idx_abandoned_carts_expires_at ON abandoned_carts(expires_at);

-- Index pour trouver les paniers à rappeler (créés il y a 3h, status pending)
CREATE INDEX IF NOT EXISTS idx_abandoned_carts_reminder ON abandoned_carts(created_at, status) 
    WHERE status = 'pending';

-- Trigger pour mettre à jour updated_at
DROP TRIGGER IF EXISTS update_abandoned_carts_updated_at ON abandoned_carts;
CREATE TRIGGER update_abandoned_carts_updated_at 
    BEFORE UPDATE ON abandoned_carts
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Fonction pour nettoyer les paniers expirés (peut être appelée par un cron job)
CREATE OR REPLACE FUNCTION cleanup_expired_abandoned_carts()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    UPDATE abandoned_carts
    SET status = 'expired'
    WHERE expires_at < NOW() AND status != 'expired';
    
    DELETE FROM abandoned_carts
    WHERE expires_at < NOW() - INTERVAL '30 days'; -- Supprimer après 30 jours d'expiration
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE abandoned_carts IS 'Paniers abandonnés par les clients pour suivi et rappels par email';
COMMENT ON COLUMN abandoned_carts.cart_data IS 'Données JSON du panier (items, total, currency, etc.)';
COMMENT ON COLUMN abandoned_carts.token IS 'Token unique pour récupérer le panier via URL sécurisée';

