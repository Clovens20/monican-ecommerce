-- ============================================================================
-- MIGRATION 014: Table de gestion des catégories avec statut actif/inactif
-- ============================================================================
-- Permet d'activer/désactiver les catégories pour contrôler leur visibilité

-- Créer la table categories
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(100) NOT NULL UNIQUE, -- 'tennis', 'chemises', 'jeans', etc.
    name_key VARCHAR(100) NOT NULL, -- Clé de traduction: 'tennis', 'shirts', etc.
    icon VARCHAR(10), -- Emoji ou icône
    color VARCHAR(7), -- Code couleur hex (#3B82F6)
    display_order INTEGER DEFAULT 0, -- Ordre d'affichage
    is_active BOOLEAN DEFAULT true, -- ✅ Statut actif/inactif
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_is_active ON categories(is_active);
CREATE INDEX IF NOT EXISTS idx_categories_display_order ON categories(display_order);

-- Trigger pour mettre à jour updated_at automatiquement
DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
CREATE TRIGGER update_categories_updated_at
    BEFORE UPDATE ON categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insérer les catégories par défaut (toutes actives au départ)
INSERT INTO categories (slug, name_key, icon, color, display_order, is_active) VALUES
    ('tennis', 'tennis', '👟', '#3B82F6', 1, true),
    ('chemises', 'shirts', '👔', '#10B981', 2, true),
    ('jeans', 'jeans', '👖', '#8B5CF6', 3, true),
    ('maillots', 'jerseys', '👕', '#F59E0B', 4, true),
    ('accessoires', 'accessories', '👜', '#EC4899', 5, true),
    ('chaussures', 'shoes', '👠', '#6366F1', 6, true)
ON CONFLICT (slug) DO UPDATE SET
    name_key = EXCLUDED.name_key,
    icon = EXCLUDED.icon,
    color = EXCLUDED.color,
    display_order = EXCLUDED.display_order;

-- Commentaires
COMMENT ON TABLE categories IS 'Table pour gérer les catégories de produits avec activation/désactivation';
COMMENT ON COLUMN categories.is_active IS 'Contrôle si la catégorie est visible sur le site';

