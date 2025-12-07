# 🔍 Diagnostic d'Authentification - Guide Complet

## ✅ Tests Effectués

### Test 1: Connexion Supabase
```bash
npm run test:supabase
```
**Résultat**: ✅ **SUCCÈS**
- Connexion Supabase: OK
- Table user_profiles: Accessible
- Admins trouvés: 1 (support@monican.com)

### Test 2: verifyAuth avec ID admin
```bash
npm run test:verify-auth 407d7d1a-5ecf-4d9c-9cec-0d56bcece48c
```
**Résultat**: ✅ **SUCCÈS**
- Profil récupéré avec succès
- Utilisateur est admin
- Peut créer des sous-admins

## 🔴 Problème Identifié

L'erreur **"Non autorisé - Erreur de base de données lors de la vérification"** se produit dans `verifyAuth()` quand :
1. Le cookie `admin_token` n'existe pas ou est invalide
2. Le userId dans le cookie n'existe pas dans `user_profiles`
3. Vous n'êtes pas connecté en tant qu'admin

## 📁 Fichiers d'Authentification

### 1. **`src/lib/supabase.ts`** ✅
- Configuration des clients Supabase
- `supabaseAdmin`: Client avec service role key
- `supabase`: Client avec anon key

### 2. **`src/lib/auth.ts`** ⚠️
- **Fonction problématique**: `verifyAuth()` ligne 222
- **Logs ajoutés**: Lignes 248-313
- **Vérifie**: Cookie → userId → Profil → Rôle admin

### 3. **`src/middleware.ts`** ✅
- Protège les routes `/admin/*`
- Vérifie le cookie `admin_token`

### 4. **`src/app/api/auth/login/route.ts`** ✅
- Crée le cookie `admin_token` au format `admin-{userId}`
- Cookie: httpOnly, secure en production

### 5. **`src/app/api/admin/users/route.ts`** ⚠️
- **Route problématique**: POST ligne 77
- **Utilise**: `verifyAuth()` ligne 80
- **Erreur**: Retourne "Non autorisé" si `verifyAuth()` échoue

## 🛠️ Solutions

### Solution 1: Vérifier que vous êtes connecté

1. **Allez sur**: `http://localhost:3002/admin/login`
2. **Connectez-vous avec**:
   - Email: `support@monican.com`
   - Mot de passe: (votre mot de passe admin)
3. **Vérifiez** que la connexion réussit
4. **Retournez** sur `/admin/users`
5. **Essayez** de créer un sous-admin

### Solution 2: Vérifier le cookie dans le navigateur

1. Ouvrez les **DevTools** (F12)
2. Allez dans **Application** > **Cookies** > `http://localhost:3002`
3. Cherchez le cookie `admin_token`
4. Il doit contenir: `admin-407d7d1a-5ecf-4d9c-9cec-0d56bcece48c`
5. Si le cookie n'existe pas ou est différent, **reconnectez-vous**

### Solution 3: Exécuter la Migration RLS (si nécessaire)

Si l'erreur persiste après vous être reconnecté :

1. Allez sur [app.supabase.com](https://app.supabase.com)
2. Sélectionnez votre projet
3. Allez dans **SQL Editor**
4. Copiez le contenu de `supabase/migrations/010_fix_user_profiles_rls.sql`
5. Collez et exécutez

### Solution 4: Vérifier les logs du serveur

Quand vous essayez de créer un sous-admin, regardez les logs du serveur. Vous devriez voir :

```
[verifyAuth] Attempting to fetch user profile { userId: '...', ... }
[verifyAuth] User profile fetched successfully { ... }
```

Si vous voyez une erreur, elle indiquera la cause exacte.

## 📊 Commandes Utiles

```bash
# Tester la connexion Supabase
npm run test:supabase

# Lister les admins
npm run check:admin

# Tester verifyAuth avec un ID spécifique
npm run test:verify-auth [userId]

# Vérifier les variables d'environnement
npm run check:env
```

## 🔍 Prochaines Étapes

1. **Reconnectez-vous** sur `/admin/login`
2. **Vérifiez** que le cookie `admin_token` est créé
3. **Essayez** de créer un sous-admin
4. **Regardez** les logs du serveur pour voir l'erreur exacte
5. Si l'erreur persiste, **exécutez** la migration RLS

## 📝 Notes

- La clé service role fonctionne correctement (testé)
- La table user_profiles est accessible (testé)
- Le problème vient probablement du cookie/session
- Les logs détaillés sont maintenant activés pour identifier le problème

