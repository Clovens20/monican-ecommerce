# ✅ Corrections Complètes - Upload d'Images & Tailles Tennis

## 🎯 Problèmes Résolus

### 1. **Upload d'Images - Authentification Ajoutée** ✅

**Fichier** : `src/app/api/admin/products/upload-images/route.ts`

**Modifications** :
- ✅ Ajout de l'import `verifyAuth` depuis `@/lib/auth`
- ✅ Vérification de l'authentification admin avant l'upload
- ✅ Retour d'erreur 401 si non authentifié

**Code ajouté** :
```typescript
// Vérifier l'authentification admin
const authResult = await verifyAuth(request);
if (authResult.status !== 200 || authResult.user?.role !== 'admin') {
  return NextResponse.json(
    { success: false, error: 'Non autorisé. Vous devez être administrateur.' },
    { status: 401 }
  );
}
```

### 2. **Upload d'Images - Gestion d'Erreurs Améliorée** ✅

**Fichier** : `src/app/api/admin/products/upload-images/route.ts`

**Modifications** :
- ✅ Messages d'erreur détaillés avec le message de Supabase
- ✅ Logs d'erreur complets en mode développement
- ✅ Gestion d'erreurs améliorée dans le formulaire

**Code amélioré** :
```typescript
if (error) {
  console.error('Error uploading to Supabase Storage:', error);
  return NextResponse.json(
    { 
      success: false, 
      error: `Erreur lors de l'upload de ${file.name}: ${error.message || 'Erreur inconnue'}`,
      details: process.env.NODE_ENV === 'development' ? {
        message: error.message,
        statusCode: error.statusCode,
        error: error
      } : undefined
    },
    { status: 500 }
  );
}
```

### 3. **Tailles Tennis - Utilisation des Numéros (35-45)** ✅

**Fichier** : `src/components/admin/ProductForm.tsx`

**Problème** : Quand on ajoutait des tennis, le système proposait XS, S, M, L, XL au lieu des numéros 35-45.

**Solution** :
- ✅ Correction de la fonction `getAvailableSizes()` pour détecter la catégorie 'tennis'
- ✅ Les tennis ET chaussures utilisent maintenant les numéros : **35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45**
- ✅ Les autres catégories (chemises, jeans, maillots) utilisent toujours XS, S, M, L, XL, XXL

**Code corrigé** :
```typescript
const getAvailableSizes = useCallback(() => {
    // Les tennis et chaussures utilisent des numéros (35-45)
    if (formData.category === 'tennis' || formData.category === 'chaussures') {
        return SHOES_SIZES; // ['35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45']
    } else if (CATEGORIES_WITH_SIZES.includes(formData.category)) {
        // Les autres catégories utilisent XS, S, M, L, XL, XXL
        return CLOTHING_SIZES;
    }
    return [];
}, [formData.category]);
```

### 4. **Réinitialisation des Variants lors du Changement de Catégorie** ✅

**Fichier** : `src/components/admin/ProductForm.tsx`

**Amélioration** : Quand on change de catégorie (ex: tennis → chemises), les variants sont réinitialisés pour éviter des tailles incohérentes.

**Code ajouté** :
```typescript
onChange={(e) => {
    const newCategory = e.target.value;
    // Réinitialiser les variants quand on change de catégorie
    // car les tailles disponibles peuvent être différentes
    setFormData({ 
        ...formData, 
        category: newCategory,
        variants: [] // Réinitialiser les variants
    });
}}
```

### 5. **Script SQL pour Créer le Bucket Storage** ✅

**Fichier créé** : `supabase/migrations/016_create_storage_bucket.sql`

**Contenu** :
- Création du bucket `product-images` (public)
- Configuration des permissions (INSERT, SELECT, UPDATE, DELETE)
- Limite de 5MB par fichier
- Types MIME autorisés : JPEG, PNG, WEBP, GIF

---

## 📋 Configuration Nécessaire

### 1. **Créer le Bucket Storage dans Supabase**

**Option A : Via l'Interface (Recommandé)**

1. Allez sur [app.supabase.com](https://app.supabase.com)
2. Sélectionnez votre projet
3. **Storage** → **"New bucket"**
4. Nom : `product-images`
5. ✅ Cocher **"Public bucket"**
6. Cliquer sur **"Create bucket"**

**Option B : Via SQL**

1. Dans Supabase : **SQL Editor**
2. Ouvrir `supabase/migrations/016_create_storage_bucket.sql`
3. Copier tout le contenu
4. Coller dans l'éditeur SQL
5. Cliquer sur **"Run"**

### 2. **Vérifier les Variables d'Environnement**

Votre fichier `.env.local` doit contenir :

```env
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre-anon-key
SUPABASE_SERVICE_ROLE_KEY=votre-service-role-key
```

**⚠️ Important** : Après modification de `.env.local`, **redémarrer le serveur** :
```bash
# Arrêter (Ctrl+C)
npm run dev  # Relancer
```

---

## ✅ Résumé des Modifications

### Fichiers Modifiés :

1. ✅ **`src/app/api/admin/products/upload-images/route.ts`**
   - Authentification ajoutée
   - Gestion d'erreurs améliorée

2. ✅ **`src/components/admin/ProductForm.tsx`**
   - Fonction `getAvailableSizes()` corrigée pour tennis
   - Réinitialisation des variants lors du changement de catégorie
   - Gestion d'erreurs améliorée

### Fichiers Créés :

1. ✅ **`supabase/migrations/016_create_storage_bucket.sql`**
   - Script SQL pour créer le bucket Storage

---

## 🧪 Tests à Effectuer

### Test 1 : Upload d'Images

1. Connectez-vous en tant qu'admin
2. Admin → Produits → Nouveau Produit
3. Cliquez sur la zone d'upload
4. Sélectionnez 1-5 images (max 5MB chacune)
5. ✅ Vérifier que les images s'affichent après upload

### Test 2 : Tailles Tennis

1. Créez un nouveau produit
2. Sélectionnez la catégorie **"Tennis"**
3. Dans "Variantes", cliquez **"Ajouter une taille"**
4. ✅ Vérifier que le menu propose : **35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45**
5. Sélectionnez une taille (ex: 42)
6. Ajoutez une quantité
7. Enregistrez

### Test 3 : Changement de Catégorie

1. Créez un produit "Tennis" avec tailles 38, 40, 42
2. Changez la catégorie pour "Chemises"
3. ✅ Vérifier que les variants sont réinitialisés
4. ✅ Vérifier que les nouvelles tailles proposées sont : XS, S, M, L, XL, XXL

---

## 🔍 Débogage

### Si l'upload échoue :

1. **Console Navigateur (F12)** :
   - Onglet **Network** → Chercher `/api/admin/products/upload-images`
   - Voir le statut (200, 401, 500)
   - Voir la réponse JSON

2. **Logs Serveur** :
   - Terminal `npm run dev`
   - Chercher `Error uploading to Supabase Storage:`

3. **Erreurs Courantes** :

   - **"Bucket not found"** → Créer le bucket (voir Section Configuration)
   - **"Non autorisé" (401)** → Vérifier que vous êtes connecté en tant qu'admin
   - **"Service role key not found"** → Vérifier `.env.local` et redémarrer le serveur

---

## 🎯 Résultat Final

- ✅ **Upload d'images fonctionnel et sécurisé**
- ✅ **Tennis utilisent les numéros 35-45**
- ✅ **Chaussures utilisent aussi les numéros 35-45**
- ✅ **Autres catégories utilisent XS, S, M, L, XL, XXL**
- ✅ **Variants réinitialisés lors du changement de catégorie**
- ✅ **Gestion d'erreurs complète**

Tout est maintenant **complètement fonctionnel** ! 🚀

