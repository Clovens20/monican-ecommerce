-- ============================================================================
-- Migration: Création de la table square_tokens
-- ============================================================================
-- Table pour stocker les tokens OAuth Square de chaque utilisateur

-- Créer la table square_tokens
CREATE TABLE IF NOT EXISTS square_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    token_type VARCHAR(50) DEFAULT 'Bearer',
    merchant_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Contrainte pour s'assurer qu'un utilisateur n'a qu'un seul token actif
    CONSTRAINT unique_user_token UNIQUE(user_id)
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_square_tokens_user_id ON square_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_square_tokens_merchant_id ON square_tokens(merchant_id);
CREATE INDEX IF NOT EXISTS idx_square_tokens_expires_at ON square_tokens(expires_at);

-- Trigger pour mettre à jour updated_at automatiquement
DROP TRIGGER IF EXISTS update_square_tokens_updated_at ON square_tokens;
CREATE TRIGGER update_square_tokens_updated_at BEFORE UPDATE ON square_tokens
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Commentaires pour documentation
COMMENT ON TABLE square_tokens IS 'Tokens OAuth Square pour chaque utilisateur';
COMMENT ON COLUMN square_tokens.user_id IS 'ID de l''utilisateur propriétaire du token';
COMMENT ON COLUMN square_tokens.access_token IS 'Token d''accès Square OAuth';
COMMENT ON COLUMN square_tokens.refresh_token IS 'Token de rafraîchissement Square OAuth';
COMMENT ON COLUMN square_tokens.expires_at IS 'Date d''expiration du token d''accès';
COMMENT ON COLUMN square_tokens.merchant_id IS 'ID du marchand Square';

-- Row Level Security (RLS)
ALTER TABLE square_tokens ENABLE ROW LEVEL SECURITY;

-- Policies pour square_tokens
-- Les utilisateurs peuvent voir leurs propres tokens
DROP POLICY IF EXISTS "Users can view their own tokens" ON square_tokens;
CREATE POLICY "Users can view their own tokens" ON square_tokens
    FOR SELECT USING (user_id = auth.uid());

-- Les utilisateurs peuvent insérer leurs propres tokens
DROP POLICY IF EXISTS "Users can insert their own tokens" ON square_tokens;
CREATE POLICY "Users can insert their own tokens" ON square_tokens
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Les utilisateurs peuvent mettre à jour leurs propres tokens
DROP POLICY IF EXISTS "Users can update their own tokens" ON square_tokens;
CREATE POLICY "Users can update their own tokens" ON square_tokens
    FOR UPDATE USING (user_id = auth.uid());

-- Les utilisateurs peuvent supprimer leurs propres tokens
DROP POLICY IF EXISTS "Users can delete their own tokens" ON square_tokens;
CREATE POLICY "Users can delete their own tokens" ON square_tokens
    FOR DELETE USING (user_id = auth.uid());

-- Les admins peuvent tout voir
DROP POLICY IF EXISTS "Admins can view all tokens" ON square_tokens;
CREATE POLICY "Admins can view all tokens" ON square_tokens
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid() AND role IN ('admin', 'subadmin')
        )
    );

