-- Ajouter les colonnes Square à user_profiles si elles n'existent pas
DO $$ 
BEGIN
    -- Ajouter square_access_token
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_profiles' 
        AND column_name = 'square_access_token'
    ) THEN
        ALTER TABLE user_profiles 
        ADD COLUMN square_access_token TEXT;
    END IF;

    -- Ajouter square_merchant_id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_profiles' 
        AND column_name = 'square_merchant_id'
    ) THEN
        ALTER TABLE user_profiles 
        ADD COLUMN square_merchant_id VARCHAR(255);
    END IF;

    -- Ajouter square_connected_at
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_profiles' 
        AND column_name = 'square_connected_at'
    ) THEN
        ALTER TABLE user_profiles 
        ADD COLUMN square_connected_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;
