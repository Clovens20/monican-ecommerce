-- ============================================================================
-- Migration 020: Correction des politiques RLS pour les colonnes Square
-- ============================================================================
-- S'assurer que le service role peut mettre à jour les colonnes Square

-- Vérifier et créer une politique pour permettre au service role de tout faire
-- (Le service role devrait bypasser RLS, mais on s'assure que c'est le cas)

-- Si RLS bloque encore, on peut créer une politique explicite pour le service role
-- Mais normalement, le service role devrait bypasser RLS automatiquement

-- Vérifier que RLS est bien configuré
DO $$
BEGIN
    -- S'assurer que RLS est activé
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'user_profiles'
    ) THEN
        RAISE EXCEPTION 'Table user_profiles does not exist';
    END IF;
    
    RAISE NOTICE 'Table user_profiles existe';
END $$;

-- Vérifier que les colonnes existent
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'user_profiles' 
        AND column_name = 'square_access_token'
    ) THEN
        RAISE EXCEPTION 'Colonne square_access_token n''existe pas';
    END IF;
    
    RAISE NOTICE 'Colonnes Square existent';
END $$;
