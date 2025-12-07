# 📦 Guide : Création du Bucket Storage pour les Images

## 🎯 Méthode Recommandée : Via l'Interface Supabase

C'est la méthode la **plus simple et la plus fiable** :

### Étapes :

1. **Allez sur [app.supabase.com](https://app.supabase.com)**
2. **Sélectionnez votre projet**
3. **Allez dans Storage** (menu de gauche)
4. **Cliquez sur "New bucket"**
5. **Configurez le bucket** :
   - **Nom** : `product-images`
   - ✅ **Public bucket** : **COCHEZ cette option** (important pour que les images soient visibles)
6. **Cliquez sur "Create bucket"**

**C'est tout !** Les permissions de base seront configurées automatiquement pour un bucket public.

---

## 🔧 Méthode Alternative : Via SQL (Si nécessaire)

Si vous préférez utiliser SQL, voici un script simplifié :

### Script SQL Simplifié :

```sql
-- Créer le bucket product-images
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;
```

### Exécuter le Script :

1. Dans Supabase, allez dans **SQL Editor**
2. Collez le script ci-dessus
3. Cliquez sur **"Run"**

**Note** : Pour les permissions avancées, vous pouvez les configurer manuellement via l'interface Storage > Policies.

---

## ✅ Vérification

Après avoir créé le bucket :

1. **Storage** → Vérifiez que `product-images` apparaît
2. **Vérifiez** qu'il est marqué comme **Public**
3. **Testez l'upload** d'une image depuis l'admin

---

## 🐛 Si l'Upload Échoue Encore

### Vérifier les Permissions du Bucket :

1. Allez dans **Storage** → **product-images**
2. Cliquez sur l'onglet **"Policies"**
3. Vérifiez qu'il y a au moins :
   - Une policy pour **SELECT** (lecture publique)
   - Une policy pour **INSERT** (upload authentifié)

### Créer les Policies Manuellement si Nécessaire :

Dans **Storage** → **product-images** → **Policies** → **New Policy** :

**Policy 1 : Lecture Publique**
- Type : `SELECT`
- Target roles : `public`
- Policy definition : `bucket_id = 'product-images'`

**Policy 2 : Upload Authentifié**
- Type : `INSERT`
- Target roles : `authenticated`
- Policy definition : `bucket_id = 'product-images'`

---

L'upload devrait maintenant fonctionner ! 🚀

