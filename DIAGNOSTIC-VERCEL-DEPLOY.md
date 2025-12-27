# 🔍 Guide de Diagnostic - Problèmes de Déploiement Vercel

Ce guide vous aide à diagnostiquer et résoudre les problèmes de déploiement sur Vercel.

---

## 🚨 PROBLÈME : Les push n'arrivent pas sur Vercel / Les changements ne sont pas déployés

### Étape 1 : Vérifier la connexion Git ↔ Vercel

1. **Vérifier que le projet est bien connecté à Vercel**
   - Allez sur [vercel.com/dashboard](https://vercel.com/dashboard)
   - Vérifiez que votre projet `monican-ecommerce` est listé
   - Cliquez sur le projet

2. **Vérifier la branche connectée**
   - Allez dans **Settings → Git**
   - Vérifiez que la branche `main` est bien connectée
   - Vérifiez que le repository GitHub est correct : `Clovens20/monican-ecommerce`

3. **Vérifier les webhooks GitHub**
   - Allez sur GitHub : `https://github.com/Clovens20/monican-ecommerce/settings/hooks`
   - Vérifiez qu'il y a un webhook Vercel actif
   - Si le webhook est manquant, reconnectez le projet dans Vercel

### Étape 2 : Vérifier que les commits sont bien poussés

```bash
# Vérifier le statut Git
git status

# Vérifier les derniers commits
git log --oneline -5

# Vérifier que vous êtes sur la bonne branche
git branch

# Si nécessaire, pousser les changements
git push origin main
```

### Étape 3 : Vérifier les logs de déploiement Vercel

1. Allez sur [vercel.com/dashboard](https://vercel.com/dashboard)
2. Sélectionnez votre projet
3. Allez dans l'onglet **Deployments**
4. Cliquez sur le dernier déploiement (même s'il a échoué)
5. Regardez les **Build Logs** pour identifier l'erreur exacte

---

## 🔴 ERREUR COMMUNE : "Invalid API key" ou "Environment variables missing"

### Symptômes
- Le build échoue avec l'erreur : `Invalid API key`
- Ou : `Error fetching featured products`
- Ou : `SUPABASE_SERVICE_ROLE_KEY is not defined`

### Solution : Configurer les Variables d'Environnement

#### 1. Récupérer vos clés Supabase

1. Allez sur [app.supabase.com](https://app.supabase.com)
2. Sélectionnez votre projet
3. Allez dans **Settings → API**
4. Copiez ces valeurs :
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` ⚠️ **SECRET**

#### 2. Ajouter les variables dans Vercel

1. Allez sur [vercel.com](https://vercel.com)
2. Sélectionnez votre projet `monican-ecommerce`
3. Allez dans **Settings → Environment Variables**
4. Ajoutez ces variables **pour tous les environnements** (Production, Preview, Development) :

| Nom | Valeur | Environnements |
|-----|--------|----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxxx.supabase.co` | ✅ Production, ✅ Preview, ✅ Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` (votre clé anon) | ✅ Production, ✅ Preview, ✅ Development |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` (votre clé service_role) | ✅ Production, ✅ Preview, ✅ Development |

#### 3. Variables Optionnelles (mais recommandées)

Si vous utilisez Stripe, Resend, etc., ajoutez aussi :

| Nom | Description | Environnements |
|-----|-------------|----------------|
| `STRIPE_SECRET_KEY` | Clé secrète Stripe | ✅ Production, ✅ Preview, ✅ Development |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Clé publique Stripe | ✅ Production, ✅ Preview, ✅ Development |
| `RESEND_API_KEY` | Clé API Resend (pour emails) | ✅ Production, ✅ Preview, ✅ Development |
| `EMAIL_SERVICE` | `resend` ou `sendgrid` | ✅ Production, ✅ Preview, ✅ Development |
| `NEXT_PUBLIC_APP_URL` | URL de votre site (ex: `https://monican.vercel.app`) | ✅ Production, ✅ Preview, ✅ Development |
| `JWT_SECRET` | Secret pour signer les JWT (min 32 caractères) | ✅ Production, ✅ Preview, ✅ Development |

#### 4. Redéployer après avoir ajouté les variables

⚠️ **IMPORTANT** : Après avoir ajouté/modifié des variables d'environnement, vous devez **redéployer** :

1. Allez dans **Deployments**
2. Cliquez sur les **3 points** (⋯) du dernier déploiement
3. Cliquez sur **Redeploy**
4. Ou faites un nouveau commit et push

---

## 🔴 ERREUR : "Build failed" sans message clair

### Diagnostic

1. **Vérifier les logs de build complets**
   - Dans Vercel, ouvrez le déploiement qui a échoué
   - Regardez les **Build Logs** en entier
   - Cherchez les erreurs TypeScript, ESLint, ou de dépendances

2. **Tester le build localement**
   ```bash
   npm run build
   ```
   - Si le build local échoue, corrigez les erreurs d'abord
   - Si le build local réussit mais Vercel échoue, c'est probablement un problème de variables d'environnement

3. **Vérifier les erreurs TypeScript**
   ```bash
   npx tsc --noEmit
   ```

4. **Vérifier les erreurs ESLint**
   ```bash
   npm run lint
   ```

---

## 🔴 ERREUR : "Deployment failed" - Timeout ou Memory

### Solutions

1. **Augmenter le timeout de build**
   - Dans Vercel, allez dans **Settings → General**
   - Augmentez le **Build Command Timeout** (max 45 minutes)

2. **Optimiser le build**
   - Vérifiez que `next.config.ts` est optimisé
   - Réduisez les imports inutiles
   - Utilisez le lazy loading pour les composants lourds

3. **Vérifier la mémoire**
   - Vercel Free : 1024 MB
   - Si vous dépassez, upgradez vers Pro

---

## ✅ CHECKLIST DE VÉRIFICATION

Avant de déployer, vérifiez :

- [ ] **Git est à jour** : `git status` montre "working tree clean"
- [ ] **Les commits sont poussés** : `git log` montre vos derniers commits
- [ ] **Variables d'environnement configurées** dans Vercel (Settings → Environment Variables)
- [ ] **Build local fonctionne** : `npm run build` réussit sans erreur
- [ ] **TypeScript compile** : `npx tsc --noEmit` ne montre pas d'erreurs
- [ ] **ESLint passe** : `npm run lint` ne montre pas d'erreurs bloquantes
- [ ] **Le projet est connecté** à Vercel (Settings → Git)
- [ ] **La branche `main` est connectée** dans Vercel

---

## 🔧 COMMANDES UTILES

### Vérifier la configuration locale
```bash
# Vérifier les variables d'environnement
npm run check:env

# Vérifier la connexion Supabase
npm run test:supabase

# Build local
npm run build

# Lancer en production locale
npm start
```

### Forcer un redéploiement
```bash
# Option 1 : Faire un commit vide
git commit --allow-empty -m "Trigger Vercel redeploy"
git push origin main

# Option 2 : Via l'interface Vercel
# Deployments → 3 points → Redeploy
```

---

## 📞 SUPPORT

Si le problème persiste :

1. **Vérifiez les logs Vercel** en détail
2. **Comparez avec le build local** : est-ce que `npm run build` fonctionne ?
3. **Vérifiez la documentation Vercel** : [vercel.com/docs](https://vercel.com/docs)
4. **Contactez le support Vercel** si nécessaire

---

## 🎯 SOLUTION RAPIDE

Si vous voulez juste forcer un redéploiement :

1. **Vérifiez que toutes les variables d'environnement sont configurées** dans Vercel
2. **Faites un commit vide** :
   ```bash
   git commit --allow-empty -m "Trigger Vercel redeploy"
   git push origin main
   ```
3. **Attendez le déploiement** (2-5 minutes)
4. **Vérifiez les logs** si ça échoue encore

---

**✅ Une fois toutes ces étapes suivies, votre déploiement devrait fonctionner !**

