# 🔥 Guide - Affichage des Quantités Vendues

## 📋 Vue d'ensemble

Les sections **"Produits Vedettes"** affichent maintenant automatiquement les **top 5 produits les plus vendus** avec leur **quantité vendue** (du 1er au 5e produit).

---

## ✅ Fonctionnalités

### 1. **Affichage Automatique**
- Les produits sont automatiquement triés par nombre de ventes
- Les top 5 produits (positions 1 à 5) s'affichent dans "Produits Vedettes"
- Chaque produit affiche un badge **🔥 X vendu(s)** avec la quantité réelle

### 2. **Badge de Quantité Vendue**
- **Badge violet** : Si le produit a été vendu (quantité > 0)
- **Badge gris** : Si le produit n'a pas encore été vendu (quantité = 0)
- Visible sur les cartes produits dans la section "Produits Vedettes"

---

## 🚀 Pour Tester avec des Données Réelles

### Étape 1: Ajouter des Produits
```bash
npm run seed:products
```

### Étape 2: Générer des Données de Ventes de Test
```bash
npm run seed:sales
```

Ce script va :
- Créer 10-15 commandes de test
- Ajouter des `order_items` avec des quantités variées
- Permettre l'affichage des quantités vendues

### Étape 3: Vérifier l'Affichage
1. Rechargez la page d'accueil
2. Allez dans la section **"Produits Vedettes"**
3. Vous devriez voir les badges **🔥 X vendu(s)** sur chaque produit

---

## 📊 Comment ça Fonctionne

### Logique de Calcul

1. **Récupération des Statistiques**
   - Le système interroge la table `order_items` dans Supabase
   - Il calcule la somme des quantités vendues pour chaque produit

2. **Tri et Sélection**
   - Les produits sont triés par quantité vendue (décroissant)
   - Les **top 5** sont sélectionnés pour "Produits Vedettes"

3. **Affichage**
   - Chaque produit affiche sa quantité vendue dans un badge
   - Le badge est toujours visible, même si la quantité est 0

### Code Concerné

- **`src/lib/products-db.ts`** :
  - `getProductSalesStats()` : Calcule les statistiques de ventes
  - `getFeaturedProductsWithSales()` : Récupère les top 5 avec quantités

- **`src/app/page.tsx`** :
  - Appelle `getFeaturedProductsWithSales(5)` pour les produits vedettes
  - Passe `salesCount` au composant `ProductCard`

- **`src/components/product/ProductCard.tsx`** :
  - Affiche le badge avec la quantité vendue
  - Badge violet si quantité > 0, gris si quantité = 0

---

## 🔍 Vérification dans Supabase

Pour vérifier les données de ventes :

1. **Allez dans Supabase > Table Editor > order_items**
2. **Vérifiez les colonnes** :
   - `product_id` : ID du produit
   - `quantity` : Quantité vendue pour cette commande
   - `order_id` : ID de la commande

3. **Pour voir les totaux par produit** :
   ```sql
   SELECT 
     product_id,
     SUM(quantity) as total_vendu
   FROM order_items
   GROUP BY product_id
   ORDER BY total_vendu DESC
   LIMIT 5;
   ```

---

## 🐛 Dépannage

### Problème: Les quantités ne s'affichent pas

**Solutions:**
1. Vérifiez que vous avez des données dans `order_items`
2. Exécutez `npm run seed:sales` pour créer des données de test
3. Vérifiez la console du navigateur pour les erreurs

### Problème: Tous les produits affichent "0 vendu"

**Solutions:**
1. Vérifiez que des commandes existent dans la table `orders`
2. Vérifiez que des `order_items` sont liés à ces commandes
3. Exécutez `npm run seed:sales` pour générer des données

### Problème: Les mauvais produits s'affichent

**Solutions:**
1. Vérifiez que les produits dans `order_items` existent dans `products`
2. Vérifiez que les produits ont `is_active = true`
3. Vérifiez que les `product_id` dans `order_items` correspondent aux `id` dans `products`

---

## 📝 Notes Importantes

- **Les quantités sont calculées en temps réel** depuis la base de données
- **Les produits sont automatiquement triés** par nombre de ventes
- **Le badge s'affiche toujours**, même si la quantité est 0
- **Les données mockées** n'ont pas de quantités réelles (affichage "0 vendu")

---

## 🎯 Prochaines Étapes

Pour avoir des données réelles :
1. Créez des commandes via le processus de checkout
2. Les quantités seront automatiquement calculées et affichées
3. Les produits vedettes se mettront à jour automatiquement

---

**Les quantités vendues devraient maintenant s'afficher correctement ! 🔥**

