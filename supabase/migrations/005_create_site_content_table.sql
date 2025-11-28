-- ============================================================================
-- Migration: Création de la table site_content pour gérer le contenu éditable des pages
-- ============================================================================

CREATE TABLE IF NOT EXISTS site_content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    page_id VARCHAR(100) NOT NULL, -- Identifiant unique de la page (home, about, contact, etc.)
    language VARCHAR(10) DEFAULT 'fr', -- Code de langue (fr, en, es)
    content JSONB NOT NULL DEFAULT '{}'::jsonb, -- Contenu éditable de la page au format JSON
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Contrainte unique sur la combinaison page_id + language
CREATE UNIQUE INDEX IF NOT EXISTS idx_site_content_page_language_unique ON site_content(page_id, language);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_site_content_page_id ON site_content(page_id);
CREATE INDEX IF NOT EXISTS idx_site_content_language ON site_content(language);
CREATE INDEX IF NOT EXISTS idx_site_content_page_language ON site_content(page_id, language);

-- Trigger pour mettre à jour updated_at automatiquement
DROP TRIGGER IF EXISTS update_site_content_updated_at ON site_content;
CREATE TRIGGER update_site_content_updated_at BEFORE UPDATE ON site_content
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Row Level Security (RLS) pour site_content
-- ============================================================================

ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;

-- Les admins peuvent tout voir et modifier
DROP POLICY IF EXISTS "Admins can manage all site content" ON site_content;
CREATE POLICY "Admins can manage all site content" ON site_content
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    ) WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Les sous-admins peuvent voir et modifier
DROP POLICY IF EXISTS "Subadmins can manage site content" ON site_content;
CREATE POLICY "Subadmins can manage site content" ON site_content
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid() AND role IN ('admin', 'subadmin')
        )
    ) WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid() AND role IN ('admin', 'subadmin')
        )
    );

-- Tout le monde peut lire le contenu (pour l'affichage public)
DROP POLICY IF EXISTS "Anyone can read site content" ON site_content;
CREATE POLICY "Anyone can read site content" ON site_content
    FOR SELECT USING (true);

-- Commentaires pour documentation
COMMENT ON TABLE site_content IS 'Contenu éditable des pages du site web';
COMMENT ON COLUMN site_content.page_id IS 'Identifiant unique de la page (ex: home, about, contact)';
COMMENT ON COLUMN site_content.language IS 'Code de langue (fr, en, es)';
COMMENT ON COLUMN site_content.content IS 'Contenu éditable au format JSON';

