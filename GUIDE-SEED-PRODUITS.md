# 🌱 Guide - Ajouter des Produits Fictifs pour Test

Ce guide vous explique comment ajouter des produits fictifs avec images pour tester les sections "Meilleures Ventes" et "Produits Vedettes".

---

## 🚀 Utilisation Rapide

### 1. Prérequis

Assurez-vous d'avoir un fichier `.env.local` avec vos clés Supabase :

```env
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
SUPABASE_SERVICE_ROLE_KEY=votre-service-role-key
```

### 2. Exécuter le script

```bash
npm run seed:products
```

Le script va :
- ✅ Insérer 10 produits fictifs avec images
- ✅ Créer les entrées d'inventaire
- ✅ Créer 15 commandes fictives pour générer des ventes
- ✅ Afficher un résumé des ventes

---

## 📦 Produits Inclus

Le script insère 10 produits avec des images Unsplash :

1. **Tennis Urban Runner** - 89.99$ (50 unités vendues)
2. **Chemise Oxford Blue** - 45.00$ (45 unités vendues)
3. **Jeans Slim Fit Indigo** - 59.50$ (40 unités vendues)
4. **Maillot Sport Pro** - 29.99$ (35 unités vendues)
5. **Baskets Running Pro** - 119.99$ (30 unités vendues)
6. **Chemise Lin Blanc** - 52.00$ (25 unités vendues)
7. **Jean Cargo Noir** - 69.99$ (20 unités vendues)
8. **T-Shirt Performance** - 24.99$ (15 unités vendues)
9. **Sneakers Classic White** - 79.99$ (10 unités vendues)
10. **Chemise Carreaux Rouge** - 48.00$ (0 unités vendues)

---

## 📊 Résultat Attendu

Après l'exécution du script :

### Section "Meilleures Ventes" (Top 4)
- Tennis Urban Runner (50 vendus)
- Chemise Oxford Blue (45 vendus)
- Jeans Slim Fit Indigo (40 vendus)
- Maillot Sport Pro (35 vendus)

### Section "Produits Vedettes" (Top 5 avec quantité)
- Tennis Urban Runner (🔥 50 vendus)
- Chemise Oxford Blue (🔥 45 vendus)
- Jeans Slim Fit Indigo (🔥 40 vendus)
- Maillot Sport Pro (🔥 35 vendus)
- Baskets Running Pro (🔥 30 vendus)

---

## 🖼️ Images

Les produits utilisent des images depuis Unsplash (gratuites et libres) :
- Images haute qualité
- Chargement rapide
- Pas besoin de télécharger d'images

---

## 🔄 Réexécuter le Script

Si vous voulez réinitialiser les données :

1. **Option 1: Supprimer et réinsérer**
   - Supprimez les produits existants dans Supabase
   - Réexécutez `npm run seed:products`

2. **Option 2: Modifier le script**
   - Modifiez `scripts/seed-products.js` pour changer les quantités
   - Réexécutez le script

---

## ⚠️ Notes Importantes

- Le script utilise `SUPABASE_SERVICE_ROLE_KEY` (côté serveur uniquement)
- Les commandes sont créées avec `status: 'delivered'` pour être comptabilisées
- Les images sont des URLs Unsplash (pas de stockage local nécessaire)
- Vous pouvez modifier les quantités dans le script si besoin

---

## 🐛 Dépannage

### Erreur: "Variables d'environnement manquantes"
- Vérifiez que `.env.local` existe
- Vérifiez que les clés Supabase sont correctes

### Erreur: "relation does not exist"
- Exécutez d'abord le script SQL `supabase/migrations/001_initial_schema.sql`

### Les produits n'apparaissent pas
- Vérifiez que `is_active = true` dans Supabase
- Vérifiez que les images se chargent (URLs Unsplash)

---

**Après l'exécution, rechargez la page d'accueil pour voir les résultats ! 🎉**

