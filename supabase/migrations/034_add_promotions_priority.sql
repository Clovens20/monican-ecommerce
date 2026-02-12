-- ============================================================================
-- Ajouter la colonne priority à la table promotions si elle n'existe pas
-- (corrige l'erreur: column promotions.priority does not exist)
-- ============================================================================

ALTER TABLE promotions ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 0;

-- Index pour le tri par priorité
CREATE INDEX IF NOT EXISTS idx_promotions_priority ON promotions(priority DESC);
