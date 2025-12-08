-- ============================================================================
-- Migration 019: Ajout des colonnes Square à user_profiles
-- ============================================================================
-- Cette migration ajoute toutes les colonnes nécessaires pour l'intégration Square OAuth
-- Elle est idempotente (peut être exécutée plusieurs fois sans erreur)

-- Ajouter square_access_token
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'user_profiles' 
        AND column_name = 'square_access_token'
    ) THEN
        ALTER TABLE user_profiles 
        ADD COLUMN square_access_token TEXT;
        RAISE NOTICE 'Colonne square_access_token ajoutée';
    END IF;
END $$;

-- Ajouter square_access_token_expires_at
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'user_profiles' 
        AND column_name = 'square_access_token_expires_at'
    ) THEN
        ALTER TABLE user_profiles 
        ADD COLUMN square_access_token_expires_at TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Colonne square_access_token_expires_at ajoutée';
    END IF;
END $$;

-- Ajouter square_merchant_id
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'user_profiles' 
        AND column_name = 'square_merchant_id'
    ) THEN
        ALTER TABLE user_profiles 
        ADD COLUMN square_merchant_id VARCHAR(255);
        RAISE NOTICE 'Colonne square_merchant_id ajoutée';
    END IF;
END $$;

-- Ajouter square_connected_at
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'user_profiles' 
        AND column_name = 'square_connected_at'
    ) THEN
        ALTER TABLE user_profiles 
        ADD COLUMN square_connected_at TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Colonne square_connected_at ajoutée';
    END IF;
END $$;

-- Créer l'index si nécessaire
CREATE INDEX IF NOT EXISTS idx_user_profiles_square_merchant_id 
ON user_profiles(square_merchant_id);

-- Ajouter les commentaires
COMMENT ON COLUMN user_profiles.square_access_token IS 'Access token OAuth Square de l''utilisateur';
COMMENT ON COLUMN user_profiles.square_access_token_expires_at IS 'Date d''expiration de l''access token';
COMMENT ON COLUMN user_profiles.square_merchant_id IS 'ID du marchand Square connecté';
COMMENT ON COLUMN user_profiles.square_connected_at IS 'Date de connexion du compte Square';
