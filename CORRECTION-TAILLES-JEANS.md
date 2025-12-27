# ✅ Correction - Tailles Numériques pour les Jeans

## 🎯 Problème Résolu

Lors de l'ajout d'un produit dans l'interface admin, quand on choisit la catégorie **"jeans"**, le système affichait les tailles standards (XS, S, M, L, XL, XXL) au lieu des tailles numériques.

## ✅ Solution Appliquée

### Modification du fichier : `src/components/admin/ProductForm.tsx`

#### 1. Ajout des tailles numériques pour les jeans

**Nouvelle constante ajoutée :**
```typescript
const JEANS_SIZES = ['28', '30', '32', '34', '36', '38', '40', '42', '44', '46'];
```

#### 2. Modification de la fonction `getAvailableSizes()`

**Avant :**
```typescript
const getAvailableSizes = useCallback(() => {
    // Les tennis et chaussures utilisent des numéros (35-45)
    if (formData.category === 'tennis' || formData.category === 'chaussures') {
        return SHOES_SIZES;
    } else if (CATEGORIES_WITH_SIZES.includes(formData.category)) {
        // Les autres catégories (chemises, jeans, maillots) utilisent XS, S, M, L, XL, XXL
        return CLOTHING_SIZES;
    }
    return [];
}, [formData.category]);
```

**Après :**
```typescript
const getAvailableSizes = useCallback(() => {
    // Les tennis et chaussures utilisent des numéros (35-45)
    if (formData.category === 'tennis' || formData.category === 'chaussures') {
        return SHOES_SIZES;
    } else if (formData.category === 'jeans') {
        // Les jeans utilisent des tailles numériques (28-46)
        return JEANS_SIZES;
    } else if (CATEGORIES_WITH_SIZES.includes(formData.category)) {
        // Les autres catégories (chemises, maillots) utilisent XS, S, M, L, XL, XXL
        return CLOTHING_SIZES;
    }
    return [];
}, [formData.category]);
```

#### 3. Réinitialisation des stocks lors du changement de catégorie

**Amélioration :**
Quand on change de catégorie, les `colorSizeStocks` sont maintenant aussi réinitialisés pour éviter des tailles incohérentes.

```typescript
onChange={(e) => {
    const newCategory = e.target.value;
    // Réinitialiser les variants et colorSizeStocks quand on change de catégorie
    setFormData({ 
        ...formData, 
        category: newCategory,
        variants: [],
        colorSizeStocks: [] // Réinitialiser aussi les stocks
    });
}}
```

## 📋 Résultat

Maintenant, selon la catégorie choisie :

| Catégorie | Tailles Disponibles |
|-----------|-------------------|
| **Jeans** | **28, 30, 32, 34, 36, 38, 40, 42, 44, 46** ✅ |
| Tennis | 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45 |
| Chaussures | 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45 |
| Chemises | XS, S, M, L, XL, XXL |
| Maillots | XS, S, M, L, XL, XXL |

## 🚀 Déploiement

Pour appliquer cette correction :

```bash
git add src/components/admin/ProductForm.tsx
git commit -m "Fix: Utiliser des tailles numériques pour les jeans (28-46)"
git push origin main
```

## ✅ Vérification

Après le déploiement, vérifiez que :
- [ ] Quand on sélectionne "jeans" comme catégorie, les tailles affichées sont : 28, 30, 32, 34, 36, 38, 40, 42, 44, 46
- [ ] Les autres catégories continuent d'afficher leurs tailles respectives
- [ ] Le changement de catégorie réinitialise bien les stocks

---

**✅ Correction terminée ! Les jeans utilisent maintenant des tailles numériques au lieu des tailles standards.**

