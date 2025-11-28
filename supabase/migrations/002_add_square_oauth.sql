-- ============================================================================
-- Migration: Ajout du support OAuth Square
-- ============================================================================
-- Ajoute la colonne pour stocker l'access_token Square de chaque utilisateur

-- Ajouter la colonne square_access_token à user_profiles
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS square_access_token TEXT,
ADD COLUMN IF NOT EXISTS square_access_token_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS square_merchant_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS square_connected_at TIMESTAMP WITH TIME ZONE;

-- Index pour faciliter les recherches
CREATE INDEX IF NOT EXISTS idx_user_profiles_square_merchant_id ON user_profiles(square_merchant_id);

-- Commentaires pour documentation
COMMENT ON COLUMN user_profiles.square_access_token IS 'Access token OAuth Square de l''utilisateur';
COMMENT ON COLUMN user_profiles.square_access_token_expires_at IS 'Date d''expiration de l''access token';
COMMENT ON COLUMN user_profiles.square_merchant_id IS 'ID du marchand Square connecté';
COMMENT ON COLUMN user_profiles.square_connected_at IS 'Date de connexion du compte Square';

