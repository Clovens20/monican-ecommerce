# 🚀 Guide de Déploiement sur Vercel

Ce guide vous explique comment configurer correctement votre projet sur Vercel pour éviter les erreurs de build.

---

## ⚠️ PROBLÈME COMMUN : "Invalid API key" pendant le build

Si vous voyez ces erreurs pendant le build :
```
Error fetching featured products: {
  message: 'Invalid API key',
  hint: 'Double check your Supabase `anon` or `service_role` API key.'
}
```

Cela signifie que les variables d'environnement Supabase ne sont **pas configurées dans Vercel**.

---

## ✅ SOLUTION : Configurer les Variables d'Environnement dans Vercel

### Étape 1 : Récupérer vos clés Supabase

1. Allez sur [app.supabase.com](https://app.supabase.com)
2. Sélectionnez votre projet
3. Allez dans **Settings → API**
4. Copiez ces 3 valeurs :
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` ⚠️ **SECRET**

### Étape 2 : Ajouter les variables dans Vercel

1. Allez sur [vercel.com](https://vercel.com)
2. Sélectionnez votre projet
3. Allez dans **Settings → Environment Variables**
4. Ajoutez ces variables :

#### Variables Publiques (NEXT_PUBLIC_*)
Ces variables sont accessibles côté client :

| Nom | Valeur | Environnements |
|-----|--------|----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxxx.supabase.co` | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` (votre clé anon) | Production, Preview, Development |

#### Variables Secrètes (⚠️ NE JAMAIS EXPOSER)
Ces variables sont uniquement côté serveur :

| Nom | Valeur | Environnements |
|-----|--------|----------------|
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` (votre clé service_role) | Production, Preview, Development |

### Étape 3 : Autres Variables Requises

Assurez-vous d'ajouter aussi :

| Nom | Description | Exemple |
|-----|-------------|---------|
| `RESEND_API_KEY` | Clé API Resend pour les emails | `re_...` |
| `STRIPE_SECRET_KEY` | Clé secrète Stripe | `sk_live_...` ou `sk_test_...` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Clé publique Stripe | `pk_live_...` ou `pk_test_...` |
| `EMAIL_FROM` | Email expéditeur | `noreply@monican.com` |
| `EMAIL_FROM_NAME` | Nom expéditeur | `Monican E-commerce` |

### Étape 4 : Redéployer

1. Après avoir ajouté toutes les variables, allez dans **Deployments**
2. Cliquez sur **Redeploy** sur le dernier déploiement
3. Ou poussez un nouveau commit :
   ```bash
   git commit --allow-empty -m "Trigger redeploy"
   git push
   ```

---

## 🔍 Vérification

### Vérifier que les variables sont chargées

1. Allez dans **Deployments**
2. Cliquez sur le dernier déploiement
3. Regardez les **Build Logs**
4. Vous ne devriez **plus** voir d'erreurs "Invalid API key"

### Tester la connexion

Une fois déployé, testez :
- La page d'accueil charge-t-elle les produits ?
- Les pages produits fonctionnent-elles ?
- Le checkout fonctionne-t-il ?

---

## 🛠️ Dépannage

### Le build échoue toujours

1. **Vérifiez les noms des variables** : Ils doivent être exactement comme dans `.env.local`
2. **Vérifiez les valeurs** : Copiez-collez depuis Supabase, ne modifiez rien
3. **Vérifiez les environnements** : Les variables doivent être activées pour "Production", "Preview" et "Development"

### Les produits ne s'affichent pas

1. Vérifiez que `SUPABASE_SERVICE_ROLE_KEY` est bien configurée (pas juste `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
2. Vérifiez que les tables existent dans Supabase (exécutez les migrations)
3. Vérifiez les logs Vercel pour voir les erreurs exactes

### Erreur "Invalid API key" persistante

1. Régénérez la clé `service_role` dans Supabase si nécessaire
2. Assurez-vous que la clé est complète (200+ caractères)
3. Vérifiez qu'il n'y a pas d'espaces avant/après dans Vercel

---

## 📝 Checklist de Déploiement

- [ ] Variables Supabase configurées dans Vercel
- [ ] Variables Stripe configurées (si utilisé)
- [ ] Variables Resend configurées (si utilisé)
- [ ] Build réussi sans erreurs "Invalid API key"
- [ ] Page d'accueil charge les produits
- [ ] Checkout fonctionne
- [ ] Emails sont envoyés correctement

---

## 🔐 Sécurité

⚠️ **IMPORTANT** :
- Ne commitez **JAMAIS** vos fichiers `.env` ou `.env.local` dans Git
- Ne partagez **JAMAIS** vos clés API publiquement
- Utilisez des clés différentes pour développement et production
- Régénérez les clés si elles sont exposées

---

## 📚 Ressources

- [Documentation Vercel - Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Documentation Supabase - API Keys](https://supabase.com/docs/guides/api/api-keys)
- [Documentation Next.js - Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)

---

**✅ Une fois toutes les variables configurées, votre déploiement devrait réussir !**

