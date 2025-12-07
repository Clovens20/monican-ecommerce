# ✅ Correction de l'Erreur SQL - Migration Storage

## ❌ Erreur Rencontrée

```
ERROR: 42601: syntax error at or near "NOT" 
LINE 19: CREATE POLICY IF NOT EXISTS "Allow authenticated admin uploads"
```

## 🔍 Cause du Problème

PostgreSQL **ne supporte pas** la syntaxe `CREATE POLICY IF NOT EXISTS`. Cette clause n'existe pas pour les policies.

## ✅ Solution Appliquée

J'ai corrigé le script SQL en utilisant `DROP POLICY IF EXISTS` avant chaque `CREATE POLICY`. Cette approche est la méthode standard pour rendre les migrations idempotentes.

**Fichier corrigé** : `supabase/migrations/016_create_storage_bucket.sql`

**Méthode utilisée** :
```sql
-- Supprimer la policy si elle existe
DROP POLICY IF EXISTS "policy_name" ON storage.objects;

-- Créer la policy
CREATE POLICY "policy_name"
ON storage.objects FOR ...
```

---

## 🚀 Instructions pour Appliquer la Migration

### Option 1 : Via l'Interface Supabase (Recommandé - Plus Simple)

1. Allez sur [app.supabase.com](https://app.supabase.com)
2. Sélectionnez votre projet
3. Allez dans **Storage** (menu de gauche)
4. Cliquez sur **"New bucket"**
5. Configurez :
   - **Nom** : `product-images`
   - ✅ **Public bucket** : Cocher cette option
6. Cliquez sur **"Create bucket"**

### Option 2 : Via SQL Editor

1. Dans Supabase, allez dans **SQL Editor**
2. Ouvrez le fichier `supabase/migrations/016_create_storage_bucket.sql`
3. Copiez le contenu corrigé
4. Collez dans l'éditeur SQL
5. Cliquez sur **"Run"**

**Note** : Si vous obtenez une erreur sur `DROP POLICY IF EXISTS`, cela signifie que les policies n'existent pas encore. C'est normal, continuez l'exécution du script.

---

## 📋 Contenu du Script Corrigé

Le script fait maintenant :

1. ✅ Crée le bucket `product-images` (si n'existe pas)
2. ✅ Supprime les anciennes policies (si elles existent)
3. ✅ Crée les nouvelles policies avec les bonnes permissions

**Permissions configurées** :
- ✅ **INSERT** : Utilisateurs authentifiés peuvent uploader
- ✅ **SELECT** : Lecture publique (images visibles sur le site)
- ✅ **UPDATE** : Utilisateurs authentifiés peuvent modifier
- ✅ **DELETE** : Utilisateurs authentifiés peuvent supprimer

---

## ✅ Vérification

Après avoir exécuté la migration ou créé le bucket via l'interface :

1. Allez dans **Storage** → **product-images**
2. Vérifiez que le bucket est marqué comme **Public**
3. Testez l'upload d'une image depuis l'admin

L'upload d'images devrait maintenant fonctionner ! 🎉

