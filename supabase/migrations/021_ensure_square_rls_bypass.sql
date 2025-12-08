-- ============================================================================
-- Migration 021: S'assurer que le service role peut mettre à jour les colonnes Square
-- ============================================================================
-- Cette migration garantit que les politiques RLS permettent les mises à jour
-- via le service role key (qui devrait bypasser RLS, mais on s'assure que c'est le cas)

-- Vérifier que RLS est activé
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'user_profiles'
    ) THEN
        RAISE EXCEPTION 'Table user_profiles does not exist';
    END IF;
    
    RAISE NOTICE '✅ Table user_profiles existe';
END $$;

-- Supprimer les anciennes politiques qui pourraient bloquer
DROP POLICY IF EXISTS "Admins can update all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Service role can update Square columns" ON user_profiles;
DROP POLICY IF EXISTS "Allow service role to update Square" ON user_profiles;

-- Créer une politique explicite pour permettre les mises à jour des colonnes Square
-- via le service role (auth.uid() IS NULL quand on utilise service role key)
CREATE POLICY "Service role can update Square columns" ON user_profiles
    FOR UPDATE
    USING (
        -- Permettre si c'est le propre profil
        id = auth.uid()
        OR
        -- Permettre si l'utilisateur est admin
        EXISTS (
            SELECT 1 FROM user_profiles up
            WHERE up.id = auth.uid() 
            AND up.role IN ('admin', 'super_admin')
            AND up.is_active = true
        )
        OR
        -- Permettre si auth.uid() est NULL (service role key)
        auth.uid() IS NULL
    )
    WITH CHECK (
        -- Même conditions pour WITH CHECK
        id = auth.uid()
        OR
        EXISTS (
            SELECT 1 FROM user_profiles up
            WHERE up.id = auth.uid() 
            AND up.role IN ('admin', 'super_admin')
            AND up.is_active = true
        )
        OR
        auth.uid() IS NULL
    );

-- Message de confirmation dans un bloc DO
DO $$
BEGIN
    RAISE NOTICE '✅ Politiques RLS mises à jour pour les colonnes Square';
END $$;
