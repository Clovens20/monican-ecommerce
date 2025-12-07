-- ============================================================================
-- MIGRATION 016: Création du bucket Storage pour les images de produits
-- ============================================================================
-- Ce script crée le bucket 'product-images' dans Supabase Storage
--
-- RECOMMANDATION: Créez le bucket via l'interface Supabase Dashboard
--                 Allez dans Storage > New bucket > Nom: product-images > Public: Oui
--                 Les permissions seront configurées automatiquement pour un bucket public.

-- Créer le bucket product-images (public pour que les images soient accessibles)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'product-images',
    'product-images',
    true,
    5242880, -- 5MB
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/jpg']
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/jpg'];

-- Note: Les policies de permissions doivent être créées manuellement via l'interface Supabase
--       Storage > product-images > Policies > New Policy
--       Ou via les scripts SQL séparés si nécessaire.
