-- ============================================================================
-- MIGRATION 017: Création des policies pour le bucket Storage product-images
-- ============================================================================
-- Ce script crée les policies de permissions pour le bucket product-images
-- À exécuter APRÈS avoir créé le bucket (via l'interface ou migration 016)

-- Supprimer les policies existantes si elles existent (pour réexécution idempotente)
DO $$
BEGIN
    -- Supprimer les anciennes policies
    IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Allow authenticated admin uploads') THEN
        DROP POLICY "Allow authenticated admin uploads" ON storage.objects;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Allow public read access') THEN
        DROP POLICY "Allow public read access" ON storage.objects;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Allow authenticated admin updates') THEN
        DROP POLICY "Allow authenticated admin updates" ON storage.objects;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Allow authenticated admin deletes') THEN
        DROP POLICY "Allow authenticated admin deletes" ON storage.objects;
    END IF;
EXCEPTION
    WHEN OTHERS THEN 
        -- Ignorer les erreurs si les policies n'existent pas
        NULL;
END $$;

-- Permissions : Permettre l'insertion (upload) pour les utilisateurs authentifiés
CREATE POLICY "Allow authenticated admin uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'product-images');

-- Permissions : Permettre la lecture publique (pour que les images soient visibles sur le site)
CREATE POLICY "Allow public read access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'product-images');

-- Permissions : Permettre la mise à jour pour les utilisateurs authentifiés
CREATE POLICY "Allow authenticated admin updates"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'product-images')
WITH CHECK (bucket_id = 'product-images');

-- Permissions : Permettre la suppression pour les utilisateurs authentifiés
CREATE POLICY "Allow authenticated admin deletes"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'product-images');

