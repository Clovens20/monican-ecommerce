-- ============================================================================
-- MIGRATION 013: Table de Rate Limiting avec Supabase
-- ============================================================================
-- Remplace Redis (Upstash) par une table Supabase pour le rate limiting
-- Permet un rate limiting distribué sans service externe

-- Créer la table rate_limit
CREATE TABLE IF NOT EXISTS rate_limit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    identifier TEXT NOT NULL, -- IP ou user ID
    type TEXT NOT NULL, -- 'checkout', 'api', 'login', etc.
    count INTEGER NOT NULL DEFAULT 1,
    window_start BIGINT NOT NULL, -- Timestamp en millisecondes
    window_end BIGINT NOT NULL, -- Timestamp en millisecondes
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(identifier, type, window_start)
);

-- Index pour les requêtes rapides
CREATE INDEX IF NOT EXISTS idx_rate_limit_lookup 
    ON rate_limit(identifier, type, window_end);

-- Index pour le nettoyage automatique (TTL)
CREATE INDEX IF NOT EXISTS idx_rate_limit_window_end 
    ON rate_limit(window_end);

-- Fonction pour nettoyer les entrées expirées (appelée automatiquement)
CREATE OR REPLACE FUNCTION cleanup_expired_rate_limits()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM rate_limit
    WHERE window_end < EXTRACT(EPOCH FROM NOW()) * 1000;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour vérifier et incrémenter le rate limit
CREATE OR REPLACE FUNCTION check_rate_limit(
    p_identifier TEXT,
    p_type TEXT,
    p_limit INTEGER,
    p_window_ms BIGINT
)
RETURNS TABLE(
    allowed BOOLEAN,
    remaining INTEGER,
    reset_at BIGINT,
    count INTEGER
) AS $$
DECLARE
    v_now BIGINT;
    v_window_start BIGINT;
    v_window_end BIGINT;
    v_count INTEGER;
    v_allowed BOOLEAN;
    v_remaining INTEGER;
BEGIN
    -- Calculer la fenêtre de temps actuelle
    v_now := EXTRACT(EPOCH FROM NOW()) * 1000;
    v_window_start := (v_now / p_window_ms)::BIGINT * p_window_ms;
    v_window_end := v_window_start + p_window_ms;
    
    -- Obtenir ou créer l'entrée pour cette fenêtre
    INSERT INTO rate_limit (identifier, type, count, window_start, window_end, updated_at)
    VALUES (p_identifier, p_type, 1, v_window_start, v_window_end, NOW())
    ON CONFLICT (identifier, type, window_start)
    DO UPDATE SET 
        count = rate_limit.count + 1,
        updated_at = NOW()
    RETURNING count INTO v_count;
    
    -- Vérifier si la limite est dépassée
    v_allowed := v_count <= p_limit;
    v_remaining := GREATEST(0, p_limit - v_count);
    
    -- Retourner le résultat
    RETURN QUERY SELECT 
        v_allowed,
        v_remaining,
        v_window_end,
        v_count;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_rate_limit_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Supprimer le trigger s'il existe déjà avant de le recréer
DROP TRIGGER IF EXISTS trigger_update_rate_limit_updated_at ON rate_limit;

CREATE TRIGGER trigger_update_rate_limit_updated_at
    BEFORE UPDATE ON rate_limit
    FOR EACH ROW
    EXECUTE FUNCTION update_rate_limit_updated_at();

-- Nettoyer les vieilles entrées au démarrage (optionnel)
-- Cette fonction peut être appelée périodiquement via un cron job
COMMENT ON TABLE rate_limit IS 'Table pour le rate limiting distribué via Supabase';
COMMENT ON FUNCTION check_rate_limit IS 'Vérifie et incrémente le compteur de rate limit de manière atomique';

