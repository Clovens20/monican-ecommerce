# 📋 Fichiers d'Authentification - Documentation

## 🔐 Fichiers Principaux

### 1. **`src/lib/supabase.ts`**
- **Rôle**: Configuration des clients Supabase
- **Clients**:
  - `supabaseAdmin`: Client serveur avec clé service role (bypass RLS)
  - `supabase`: Client client avec clé anon
- **Variables requises**:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`

### 2. **`src/lib/auth.ts`**
- **Rôle**: Fonctions d'authentification
- **Fonctions principales**:
  - `loginAdmin()`: Connexion admin
  - `verifyAuth()`: Vérification d'authentification pour les routes API ⚠️ **PROBLÈME ICI**
  - `getCurrentUser()`: Récupération de l'utilisateur actuel
  - `createAdmin()`: Création d'un admin
- **Fichier problématique**: `verifyAuth()` ligne 222-336

### 3. **`src/middleware.ts`**
- **Rôle**: Middleware Next.js pour protéger les routes admin
- **Protection**: Vérifie le cookie `admin_token` pour les routes `/admin/*`
- **Routes publiques**: `/admin/login`, `/api/auth/login`, `/api/auth/logout`

### 4. **`src/app/api/auth/login/route.ts`**
- **Rôle**: Route API pour la connexion admin
- **Action**: Crée le cookie `admin_token` avec format `admin-{userId}`
- **Cookie**: `admin_token` (httpOnly, secure en production)

### 5. **`src/app/api/admin/users/route.ts`**
- **Rôle**: Route API pour gérer les utilisateurs (GET) et créer des sous-admins (POST)
- **Authentification**: Utilise `verifyAuth()` ligne 80
- **Problème**: L'erreur "Non autorisé - Erreur de base de données" vient de `verifyAuth()`

## 🔍 Diagnostic du Problème

### Erreur Actuelle
```
"Non autorisé - Erreur de base de données lors de la vérification"
```

### Cause Probable
La fonction `verifyAuth()` dans `src/lib/auth.ts` (ligne 248) essaie de récupérer le profil utilisateur mais échoue à cause de :
1. **RLS Policies**: Les policies bloquent l'accès même avec service role key
2. **Cookie invalide**: Le cookie `admin_token` contient un userId qui n'existe pas
3. **Migration non exécutée**: La migration `010_fix_user_profiles_rls.sql` n'a pas été exécutée

### Tests Effectués
✅ Connexion Supabase: **OK**
✅ Table user_profiles: **Accessible**
✅ Admins trouvés: **1 admin** (support@monican.com)

## 🛠️ Solutions

### Solution 1: Exécuter la Migration RLS
```sql
-- Exécutez dans Supabase SQL Editor:
-- supabase/migrations/010_fix_user_profiles_rls.sql
```

### Solution 2: Vérifier le Cookie
Le cookie `admin_token` doit contenir: `admin-{userId}`
- Vérifiez que vous êtes connecté
- Vérifiez que le userId dans le cookie existe dans `user_profiles`

### Solution 3: Logs Détaillés
Les logs sont maintenant activés dans `verifyAuth()` pour identifier le problème exact.

## 📝 Commandes de Test

```bash
# Tester la connexion Supabase
npm run test:supabase

# Tester verifyAuth avec un userId spécifique
npm run test:verify-auth [userId]

# Vérifier les admins
npm run check:admin
```

## 🔗 Fichiers Liés

- `src/app/api/admin/users/[id]/status/route.ts` - Utilise `verifyAuth()`
- `src/app/api/admin/promotions/route.ts` - Utilise `verifyAuth()`
- `src/app/api/admin/orders/route.ts` - Utilise `verifyAuth()`
- `src/app/admin/login/page.tsx` - Page de connexion
- `src/app/admin/users/page.tsx` - Page de gestion des utilisateurs

