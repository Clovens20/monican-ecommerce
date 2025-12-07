-- ============================================================================
-- TABLE: legal_content
-- ============================================================================
-- Table pour stocker le contenu éditable des pages légales et du footer
CREATE TABLE IF NOT EXISTS legal_content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    page_id VARCHAR(100) NOT NULL, -- 'faq', 'terms', 'privacy', 'returns', 'footer'
    language VARCHAR(10) NOT NULL DEFAULT 'fr',
    content JSONB NOT NULL, -- Structure flexible pour chaque type de page
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_page_language UNIQUE (page_id, language)
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_legal_content_page_id ON legal_content(page_id);
CREATE INDEX IF NOT EXISTS idx_legal_content_language ON legal_content(language);

-- Trigger pour mettre à jour updated_at
DROP TRIGGER IF EXISTS update_legal_content_updated_at ON legal_content;
CREATE TRIGGER update_legal_content_updated_at BEFORE UPDATE ON legal_content
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS pour legal_content
ALTER TABLE legal_content ENABLE ROW LEVEL SECURITY;

-- Policy pour admins: full access
DROP POLICY IF EXISTS "Admins can manage legal content" ON legal_content;
CREATE POLICY "Admins can manage legal content" ON legal_content
FOR ALL USING (EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.id = auth.uid() AND user_profiles.role = 'admin'));

-- Policy pour clients: read only
DROP POLICY IF EXISTS "Clients can view legal content" ON legal_content;
CREATE POLICY "Clients can view legal content" ON legal_content
FOR SELECT USING (true);

