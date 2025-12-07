# 🔧 Guide de Résolution : Problème de Connexion Sous-Admin

## 📋 Problème Identifié

Vous essayez de vous connecter avec le code **MON-001** mais recevez un message d'erreur indiquant que le code est invalide.

## ✅ Corrections Apportées

### 1. **Placeholder mis à jour**
   - Le placeholder dans le formulaire de connexion affiche maintenant **"MON-001"** au lieu de "SA-XXX"
   - Conversion automatique en majuscules lors de la saisie

### 2. **Messages d'erreur améliorés**
   - L'API d'authentification affiche maintenant les **codes disponibles** dans le message d'erreur
   - Diagnostic amélioré avec logs détaillés côté serveur

### 3. **Normalisation du code**
   - Le code est automatiquement normalisé (majuscules, espaces supprimés)
   - Recherche insensible à la casse

## 🔍 Pourquoi MON-001 ne fonctionne pas ?

**Causes possibles :**

1. **Le sous-admin MON-001 n'existe pas dans la base de données**
   - Vous devez d'abord créer un sous-admin via l'interface admin
   - Le code sera généré automatiquement (MON-001, MON-002, etc.)

2. **Le sous-admin existe mais est désactivé**
   - Vérifiez dans `/admin/users` si le sous-admin est actif

3. **Le code existe avec un format différent**
   - Vérifiez dans la base de données le format exact stocké

## 📝 Comment Vérifier et Résoudre

### Option 1 : Vérifier dans l'Interface Admin

1. Connectez-vous à `/admin`
2. Allez dans **Utilisateurs** (`/admin/users`)
3. Regardez la liste des sous-admins et leurs codes
4. Vérifiez que le code est **actif** (badge vert)

### Option 2 : Vérifier via l'API de Diagnostic

1. Connectez-vous à `/admin`
2. Ouvrez la console du navigateur (F12)
3. Exécutez cette commande :
   ```javascript
   fetch('/api/admin/subadmin/debug')
     .then(r => r.json())
     .then(data => console.log('Codes disponibles:', data));
   ```

### Option 3 : Créer un Nouveau Sous-Admin

Si MON-001 n'existe pas :

1. Allez dans `/admin/users`
2. Cliquez sur **"➕ Créer un Sous-admin"**
3. Remplissez le formulaire (Nom, Email)
4. Le code sera généré automatiquement (probablement MON-001 si c'est le premier)
5. **Notez bien le code affiché** après la création
6. Utilisez ce code pour vous connecter

## 🎯 Format du Code

- Format : **MON-XXX** (ex: MON-001, MON-002, MON-003)
- Le code est en **majuscules**
- Pas d'espaces
- Généré automatiquement lors de la création

## 🔐 Étapes pour Se Connecter

1. Allez sur `/admin/sousadmin`
2. Entrez votre code (ex: **MON-001**)
3. Cliquez sur **"Connexion"**
4. Si erreur, vérifiez :
   - Que le code existe dans `/admin/users`
   - Que le sous-admin est **actif**
   - Que vous avez entré le bon format (MON-XXX)

## 📞 Si le Problème Persiste

1. **Vérifiez les logs du serveur** :
   - Ouvrez la console du terminal où Next.js tourne
   - Cherchez les logs qui commencent par 🔍 ou ❌

2. **Vérifiez dans Supabase** :
   - Connectez-vous à votre dashboard Supabase
   - Allez dans **Table Editor** → `user_profiles`
   - Filtrez par `role = 'subadmin'`
   - Vérifiez que `subadmin_code` contient "MON-001"
   - Vérifiez que `is_active = true`

3. **Testez avec un autre code** :
   - Si vous avez créé plusieurs sous-admins, essayez MON-002, MON-003, etc.

## ✅ Checklist

- [ ] Un sous-admin a été créé via `/admin/users`
- [ ] Le code affiché lors de la création a été noté
- [ ] Le sous-admin est actif (badge vert dans `/admin/users`)
- [ ] Le format du code est correct (MON-XXX)
- [ ] Pas d'espaces avant/après le code
- [ ] Les logs du serveur sont vérifiés

## 🆘 Support

Si après toutes ces vérifications le problème persiste, fournissez :
- Les logs du serveur (console du terminal)
- Le code exact que vous essayez d'utiliser
- Une capture d'écran de la liste des sous-admins dans `/admin/users`

