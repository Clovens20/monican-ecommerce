# ✅ Guide pour Votre Configuration Supabase Existante

Puisque vous avez déjà Supabase intégré dans votre projet, voici ce qu'il reste à vérifier/faire :

---

## 🔍 ÉTAPE 1: Vérifier vos Variables d'Environnement

### 1.1 Vérifier que vous avez un fichier `.env.local`

Créez ou vérifiez que vous avez un fichier `.env.local` à la racine du projet avec :

```env
# Supabase (vous devez avoir ces valeurs depuis votre projet Supabase)
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre-anon-key
SUPABASE_SERVICE_ROLE_KEY=votre-service-role-key
```

### 1.2 Où trouver ces valeurs dans Supabase

1. Allez sur [app.supabase.com](https://app.supabase.com)
2. Sélectionnez votre projet
3. Allez dans **Settings > API**
4. Vous verrez :
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` (⚠️ SECRET, ne jamais exposer)

---

## 🗄️ ÉTAPE 2: Vérifier/Créer les Tables dans Supabase

### 2.1 Vérifier quelles tables existent déjà

Dans votre projet Supabase :
1. Allez dans **Table Editor**
2. Vérifiez quelles tables vous avez déjà

### 2.2 Tables nécessaires pour la production

Vérifiez que vous avez au minimum ces tables :

- ✅ `products` - Produits
- ✅ `user_profiles` - Profils utilisateurs (pour les admins)
- ✅ `orders` - Commandes
- ✅ `order_items` - Articles de commande
- ✅ `inventory` - Gestion du stock

### 2.3 Si des tables manquent

Si certaines tables manquent, exécutez le script SQL :

1. Dans Supabase, allez dans **SQL Editor**
2. Ouvrez le fichier `supabase/migrations/001_initial_schema.sql`
3. Copiez le contenu
4. Collez dans l'éditeur SQL de Supabase
5. Exécutez le script

**Note:** Le script utilise `CREATE TABLE IF NOT EXISTS`, donc il ne supprimera pas vos données existantes.

---

## 👤 ÉTAPE 3: Vérifier/Créer un Admin

### 3.1 Vérifier si vous avez déjà un admin

Dans Supabase :
1. Allez dans **Authentication > Users**
2. Vérifiez si vous avez des utilisateurs
3. Allez dans **Table Editor > user_profiles**
4. Vérifiez s'il y a un utilisateur avec `role = 'admin'`

### 3.2 Si vous n'avez pas d'admin

**Option A: Via l'interface Supabase (Recommandé)**

1. Allez dans **Authentication > Users**
2. Cliquez sur **Add User**
3. Créez un utilisateur avec email et mot de passe
4. Notez l'**User ID** (UUID)

5. Ensuite, dans **SQL Editor**, exécutez :

```sql
INSERT INTO user_profiles (id, email, name, role, permissions, is_active)
VALUES (
  'UUID-DE-L-UTILISATEUR-CREE', -- Remplacez par l'UUID de l'utilisateur créé
  'admin@monican.com',           -- Email de l'admin
  'Admin Principal',            -- Nom de l'admin
  'admin',                      -- Rôle
  '["all"]'::jsonb,             -- Permissions
  true                          -- Actif
);
```

**Option B: Via le code (si vous avez accès)**

Vous pouvez utiliser la fonction `createAdminUser` de `src/lib/supabase-auth.ts` dans une route API temporaire.

---

## ✅ ÉTAPE 4: Tester la Connexion

### 4.1 Tester localement

```bash
npm run dev
```

Puis testez :
- La connexion admin : `http://localhost:3000/admin/login`
- L'affichage des produits (si vous avez des produits dans Supabase)

### 4.2 Vérifier les erreurs

Si vous avez des erreurs, vérifiez :
- Les variables d'environnement sont correctes
- Les tables existent dans Supabase
- Les policies RLS permettent l'accès

---

## 🔧 ÉTAPE 5: Configurer les Autres Services (Optionnel)

### 5.1 Square (pour les paiements)

Si vous voulez activer les paiements :
- Créez un compte sur [developer.squareup.com](https://developer.squareup.com)
- Ajoutez les clés dans `.env.local`

### 5.2 Email (Resend ou SendGrid)

Si vous voulez activer les emails :
- Créez un compte sur [resend.com](https://resend.com) ou [sendgrid.com](https://sendgrid.com)
- Ajoutez les clés dans `.env.local`

---

## 📋 Checklist Rapide

- [ ] Variables d'environnement Supabase configurées dans `.env.local`
- [ ] Tables créées dans Supabase (ou vérifiées qu'elles existent)
- [ ] Au moins un admin créé dans `user_profiles`
- [ ] Test de connexion admin réussi
- [ ] (Optionnel) Square configuré
- [ ] (Optionnel) Email configuré

---

## 🆘 Problèmes Courants

### Erreur: "relation does not exist"

**Solution:** Les tables n'existent pas. Exécutez le script SQL `supabase/migrations/001_initial_schema.sql`

### Erreur: "Invalid API key"

**Solution:** Vérifiez que vos clés Supabase dans `.env.local` sont correctes

### Erreur: "User is not an admin"

**Solution:** L'utilisateur n'a pas de profil dans `user_profiles` avec `role = 'admin'`. Créez le profil.

### Erreur: "permission denied"

**Solution:** Vérifiez les policies RLS dans Supabase. Le script SQL les configure automatiquement.

---

## 📞 Besoin d'Aide ?

Si vous avez des questions spécifiques sur votre configuration Supabase existante, vérifiez :
1. Les logs dans la console du navigateur
2. Les logs dans Supabase Dashboard > Logs
3. Les variables d'environnement

---

**Vous avez déjà Supabase configuré, il ne reste qu'à vérifier que tout est en place ! 🚀**

