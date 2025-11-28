# 🔧 Dépannage - Produits Ne S'Affichent Pas

## 🔍 Diagnostic

Si les produits ne s'affichent pas dans les sections "Meilleures Ventes" et "Produits Vedettes", voici les étapes de diagnostic :

---

## ✅ Étape 1: Vérifier les Variables d'Environnement

### Vérifier que `.env.local` existe et contient :

```env
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre-anon-key
SUPABASE_SERVICE_ROLE_KEY=votre-service-role-key
```

### Tester la connexion Supabase

Ouvrez la console du navigateur (F12) et vérifiez s'il y a des erreurs Supabase.

---

## ✅ Étape 2: Vérifier que les Tables Existent

Dans Supabase, vérifiez que ces tables existent :
- `products`
- `order_items`
- `inventory`

Si elles n'existent pas, exécutez le script SQL `supabase/migrations/001_initial_schema.sql`

---

## ✅ Étape 3: Ajouter des Produits de Test

### Option A: Via le Script de Seed (Recommandé)

```bash
npm run seed:products
```

**Prérequis:**
- Fichier `.env.local` avec les clés Supabase
- Tables créées dans Supabase

### Option B: Manuellement dans Supabase

1. Allez dans **Table Editor > products**
2. Cliquez sur **Insert > Insert row**
3. Ajoutez un produit avec :
   - `name`: "Produit Test"
   - `price`: 29.99
   - `category`: "tennis"
   - `is_active`: true
   - `is_featured`: true
   - `images`: `[{"id":"1","url":"https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800","alt":"Test","isPrimary":true}]`
   - `variants`: `[{"size":"M","stock":10,"sku":"TEST-M"}]`

---

## ✅ Étape 4: Vérifier les Erreurs dans la Console

1. Ouvrez la console du navigateur (F12)
2. Rechargez la page
3. Cherchez les erreurs :
   - Erreurs Supabase (connexion, permissions)
   - Erreurs de chargement de produits
   - Erreurs de rendu React

---

## ✅ Étape 5: Vérifier les Logs Serveur

Dans le terminal où `npm run dev` tourne, vérifiez :
- Erreurs de connexion Supabase
- Erreurs dans `getBestSellingProducts`
- Erreurs dans `getFeaturedProductsWithSales`

---

## 🔄 Fallback Automatique

Le système a maintenant un **fallback automatique** :

1. **Si Supabase est vide** → Utilise les données mockées
2. **Si Supabase échoue** → Utilise les données mockées
3. **Si aucune vente** → Affiche les produits "featured"

Les produits mockés devraient toujours s'afficher même si Supabase est vide.

---

## 🐛 Problèmes Courants

### Problème: "Aucun produit disponible"

**Solution:**
1. Vérifiez que les produits existent dans Supabase
2. Vérifiez que `is_active = true`
3. Exécutez `npm run seed:products`

### Problème: Erreur "relation does not exist"

**Solution:**
- Exécutez le script SQL `supabase/migrations/001_initial_schema.sql`

### Problème: Erreur de connexion Supabase

**Solution:**
- Vérifiez les variables d'environnement
- Vérifiez que les clés API sont correctes
- Vérifiez votre connexion internet

### Problème: Les produits s'affichent mais sans images

**Solution:**
- Les images utilisent Unsplash (nécessite internet)
- Vérifiez votre connexion
- Les images peuvent prendre quelques secondes à charger

---

## 🧪 Test Rapide

Pour tester rapidement si le système fonctionne :

1. **Vérifier les données mockées:**
   - Les produits mockés devraient s'afficher même sans Supabase
   - Si rien ne s'affiche, il y a un problème dans le code

2. **Vérifier Supabase:**
   - Allez dans Supabase > Table Editor > products
   - Vérifiez qu'il y a des produits
   - Vérifiez que `is_active = true`

3. **Vérifier les commandes:**
   - Allez dans Supabase > Table Editor > order_items
   - Vérifiez qu'il y a des commandes
   - Les quantités doivent être > 0

---

## 📞 Si Rien Ne Fonctionne

1. Vérifiez la console du navigateur (F12)
2. Vérifiez les logs du serveur (terminal)
3. Vérifiez que les tables existent dans Supabase
4. Vérifiez les variables d'environnement

---

**Le système devrait maintenant afficher les produits mockés même si Supabase est vide !**

