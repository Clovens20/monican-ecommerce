-- ============================================================================
-- Migration 022: Ajouter les politiques RLS pour la table categories
-- ============================================================================
-- Cette migration permet aux clients de voir les catégories actives
-- et aux admins de gérer toutes les catégories

-- Activer RLS sur la table categories (si ce n'est pas déjà fait)
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Policy: Tout le monde peut lire les catégories actives
DROP POLICY IF EXISTS "Categories are viewable by everyone" ON categories;
CREATE POLICY "Categories are viewable by everyone" ON categories
    FOR SELECT
    USING (is_active = true);

-- Policy: Les admins peuvent voir toutes les catégories (actives et inactives)
DROP POLICY IF EXISTS "Admins can view all categories" ON categories;
CREATE POLICY "Admins can view all categories" ON categories
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
        )
        OR
        auth.uid() IS NULL  -- Service role key
    );

-- Policy: Les admins peuvent modifier toutes les catégories
DROP POLICY IF EXISTS "Admins can manage categories" ON categories;
CREATE POLICY "Admins can manage categories" ON categories
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
        )
        OR
        auth.uid() IS NULL  -- Service role key
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
        )
        OR
        auth.uid() IS NULL  -- Service role key
    );

-- Message de confirmation
DO $$
BEGIN
    RAISE NOTICE '✅ Politiques RLS ajoutées pour la table categories';
END $$;

