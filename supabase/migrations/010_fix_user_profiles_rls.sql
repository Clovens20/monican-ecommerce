-- ============================================================================
-- Migration: Correction des policies RLS pour user_profiles
-- ============================================================================
-- Cette migration ajoute des policies pour permettre aux admins d'accéder
-- à tous les profils utilisateurs via la clé service role.
--
-- IMPORTANT: La clé service role devrait bypasser RLS automatiquement,
-- mais si ce n'est pas le cas, ces policies permettront l'accès admin.

-- Ajouter une policy pour permettre aux admins de voir tous les profils
-- Cette policy utilise une sous-requête pour vérifier le rôle admin
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
CREATE POLICY "Admins can view all profiles" ON user_profiles
    FOR SELECT USING (
        -- Permettre l'accès si c'est le propre profil
        id = auth.uid()
        OR
        -- Permettre l'accès si l'utilisateur connecté est admin
        EXISTS (
            SELECT 1 FROM user_profiles up
            WHERE up.id = auth.uid() 
            AND up.role IN ('admin', 'super_admin')
            AND up.is_active = true
        )
        OR
        -- Permettre l'accès si auth.uid() est NULL (service role key)
        auth.uid() IS NULL
    );

-- Ajouter une policy pour permettre aux admins de modifier tous les profils
DROP POLICY IF EXISTS "Admins can update all profiles" ON user_profiles;
CREATE POLICY "Admins can update all profiles" ON user_profiles
    FOR UPDATE USING (
        -- Permettre la modification si c'est le propre profil
        id = auth.uid()
        OR
        -- Permettre la modification si l'utilisateur connecté est admin
        EXISTS (
            SELECT 1 FROM user_profiles up
            WHERE up.id = auth.uid() 
            AND up.role IN ('admin', 'super_admin')
            AND up.is_active = true
        )
        OR
        -- Permettre la modification si auth.uid() est NULL (service role key)
        auth.uid() IS NULL
    );

-- Ajouter une policy pour permettre aux admins de créer des profils
DROP POLICY IF EXISTS "Admins can insert profiles" ON user_profiles;
CREATE POLICY "Admins can insert profiles" ON user_profiles
    FOR INSERT WITH CHECK (
        -- Permettre l'insertion si c'est le propre profil de l'utilisateur
        id = auth.uid()
        OR
        -- Permettre l'insertion si l'utilisateur connecté est admin
        EXISTS (
            SELECT 1 FROM user_profiles up
            WHERE up.id = auth.uid() 
            AND up.role IN ('admin', 'super_admin')
            AND up.is_active = true
        )
        OR
        -- Permettre l'insertion si auth.uid() est NULL (service role key)
        auth.uid() IS NULL
    );

-- Note importante:
-- 1. La clé service role (SUPABASE_SERVICE_ROLE_KEY) devrait bypasser RLS automatiquement
-- 2. Si ce n'est pas le cas, vérifiez que vous utilisez bien la clé service_role (pas anon)
-- 3. Ces policies permettent aussi l'accès via auth.uid() pour les admins connectés
-- 4. La dernière condition (auth.uid() IS NULL) permet l'accès avec service role key
