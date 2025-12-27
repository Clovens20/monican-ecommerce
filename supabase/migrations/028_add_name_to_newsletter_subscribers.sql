-- ============================================================================
-- Migration: Ajout du champ name à newsletter_subscribers
-- ============================================================================
-- Cette migration ajoute un champ pour stocker le nom du client

-- Ajouter la colonne name si elle n'existe pas
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'newsletter_subscribers' 
        AND column_name = 'name'
    ) THEN
        ALTER TABLE newsletter_subscribers 
        ADD COLUMN name VARCHAR(255);
        RAISE NOTICE 'Colonne name ajoutée à newsletter_subscribers';
    END IF;
END $$;

-- Ajouter un index pour améliorer les recherches par nom
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_name 
ON newsletter_subscribers(name) 
WHERE name IS NOT NULL;

-- Commentaire
COMMENT ON COLUMN newsletter_subscribers.name IS 'Nom du client (prénom et/ou nom complet)';

