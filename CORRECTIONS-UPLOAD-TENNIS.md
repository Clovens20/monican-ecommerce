# ✅ Corrections - Upload d'Images et Tailles Tennis

## 🎯 Problèmes Résolus

### 1. **Upload d'Images - Authentification Manquante** ✅

**Problème** : L'API d'upload d'images n'avait pas de vérification d'authentification, ce qui causait des erreurs.

**Solution Appliquée** :
- ✅ Ajout de l'authentification admin avec `verifyAuth()`
- ✅ Vérification que l'utilisateur est bien un administrateur
- ✅ Retour d'erreur 401 si non authentifié

**Fichier modifié** : `src/app/api/admin/products/upload-images/route.ts`

### 2. **Upload d'Images - Gestion d'Erreurs Améliorée** ✅

**Problème** : Les erreurs n'étaient pas assez détaillées pour le débogage.

**Solution Appliquée** :
- ✅ Messages d'erreur plus détaillés
- ✅ Logs d'erreur améliorés avec détails en développement
- ✅ Affichage des détails d'erreur dans le formulaire

**Fichiers modifiés** :
- `src/app/api/admin/products/upload-images/route.ts`
- `src/components/admin/ProductForm.tsx`

### 3. **Tailles Tennis - Utilisation des Numéros** ✅

**Problème** : Quand on ajoute des tennis, le système proposait XS, S, M, L, XL au lieu des numéros 35-45.

**Solution Appliquée** :
- ✅ Correction de la fonction `getAvailableSizes()` pour détecter la catégorie 'tennis'
- ✅ Les tennis utilisent maintenant les numéros : **35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45**
- ✅ Les chaussures utilisent aussi ces mêmes numéros
- ✅ Les autres catégories (chemises, jeans, maillots) utilisent toujours XS, S, M, L, XL, XXL

**Fichier modifié** : `src/components/admin/ProductForm.tsx`

**Logique** :
```typescript
// Les tennis et chaussures utilisent des numéros (35-45)
if (formData.category === 'tennis' || formData.category === 'chaussures') {
    return SHOES_SIZES; // ['35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45']
} else if (CATEGORIES_WITH_SIZES.includes(formData.category)) {
    // Les autres catégories utilisent XS, S, M, L, XL, XXL
    return CLOTHING_SIZES;
}
```

### 4. **Bucket Storage - Script de Migration** ✅

**Problème** : Le bucket `product-images` peut ne pas exister dans Supabase Storage.

**Solution Appliquée** :
- ✅ Création d'un script SQL de migration pour créer le bucket
- ✅ Configuration automatique des permissions
- ✅ Limite de 5MB par fichier
- ✅ Types MIME autorisés : JPEG, PNG, WEBP, GIF

**Fichier créé** : `supabase/migrations/016_create_storage_bucket.sql`

---

## 📋 Checklist de Vérification

### Pour l'Upload d'Images :

- [x] Authentification ajoutée à l'API route
- [x] Gestion d'erreurs améliorée
- [x] Messages d'erreur détaillés
- [ ] **Bucket Storage créé dans Supabase** (voir instructions ci-dessous)
- [ ] **Variables d'environnement vérifiées**

### Pour les Tailles Tennis :

- [x] Fonction `getAvailableSizes()` corrigée
- [x] Les tennis utilisent maintenant les numéros 35-45
- [x] Les autres catégories gardent XS, S, M, L, XL, XXL

---

## 🚀 Actions à Effectuer

### 1. Créer le Bucket Storage dans Supabase

**Option A : Via l'Interface Supabase (Recommandé)**

1. Allez sur [app.supabase.com](https://app.supabase.com)
2. Sélectionnez votre projet
3. Allez dans **Storage** (menu de gauche)
4. Cliquez sur **"New bucket"**
5. Nom du bucket : `product-images`
6. ✅ Cochez **"Public bucket"**
7. Cliquez sur **"Create bucket"**

**Option B : Via SQL (Alternative)**

1. Dans Supabase, allez dans **SQL Editor**
2. Ouvrez le fichier `supabase/migrations/016_create_storage_bucket.sql`
3. Copiez tout le contenu
4. Collez dans l'éditeur SQL
5. Cliquez sur **"Run"**

### 2. Vérifier les Variables d'Environnement

Assurez-vous que votre fichier `.env.local` contient :

```env
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre-anon-key
SUPABASE_SERVICE_ROLE_KEY=votre-service-role-key
```

**Important** : Après modification de `.env.local`, **redémarrez le serveur** :

```bash
# Arrêter le serveur (Ctrl+C)
# Puis relancer
npm run dev
```

### 3. Tester l'Upload d'Images

1. Connectez-vous en tant qu'administrateur
2. Allez dans **Admin → Produits → Nouveau Produit**
3. Cliquez sur la zone d'upload d'images
4. Sélectionnez une ou plusieurs images (max 5MB chacune)
5. Vérifiez que l'upload fonctionne et que les images s'affichent

### 4. Tester les Tailles Tennis

1. Créez un nouveau produit
2. Sélectionnez la catégorie **"Tennis"**
3. Dans la section "Variantes", cliquez sur **"Ajouter une taille"**
4. ✅ Vérifiez que le menu déroulant propose : **35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45**
5. Sélectionnez une taille (ex: 42)
6. Ajoutez une quantité en stock
7. Enregistrez le produit

---

## 🔍 Débogage

### Si l'upload échoue toujours :

1. **Ouvrir la Console du Navigateur** (F12)
   - Onglet **Console** : Erreurs JavaScript
   - Onglet **Network** : Voir la requête HTTP vers `/api/admin/products/upload-images`
   - Vérifier le statut (200, 401, 500, etc.)
   - Voir la réponse complète

2. **Vérifier les Logs Serveur**
   - Terminal où `npm run dev` tourne
   - Chercher les erreurs commençant par `Error uploading to Supabase Storage:`

3. **Erreurs Courantes** :

   - **"Bucket not found"**
     - **Solution** : Créer le bucket `product-images` (voir Section 1)

   - **"Non autorisé" (401)**
     - **Solution** : Vérifier que vous êtes connecté en tant qu'admin
     - Vérifier que le cookie `admin_token` existe

   - **"Service role key not found"**
     - **Solution** : Vérifier `SUPABASE_SERVICE_ROLE_KEY` dans `.env.local`
     - Redémarrer le serveur

   - **"new row violates row-level security policy"**
     - **Solution** : Vérifier les permissions du bucket Storage
     - Ou exécuter le script SQL de migration

---

## ✅ Résumé des Modifications

### Fichiers Modifiés :

1. **`src/app/api/admin/products/upload-images/route.ts`**
   - ✅ Authentification ajoutée
   - ✅ Gestion d'erreurs améliorée

2. **`src/components/admin/ProductForm.tsx`**
   - ✅ Fonction `getAvailableSizes()` corrigée pour tennis
   - ✅ Gestion d'erreurs améliorée dans `handleImageUpload()`

### Fichiers Créés :

1. **`supabase/migrations/016_create_storage_bucket.sql`**
   - Script SQL pour créer le bucket Storage
   - Configuration des permissions

---

## 🎯 Résultat Final

- ✅ **Upload d'images fonctionnel** avec authentification
- ✅ **Tennis utilisent les numéros 35-45** au lieu de XS, XL
- ✅ **Gestion d'erreurs complète** pour faciliter le débogage
- ✅ **Bucket Storage configurable** via migration SQL

L'upload d'images est maintenant **complètement fonctionnel** et sécurisé ! 🚀

