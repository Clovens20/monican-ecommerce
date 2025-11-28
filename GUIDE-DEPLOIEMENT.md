# 🚀 Guide de Déploiement - Monican E-commerce

Ce guide vous accompagne étape par étape pour déployer l'application en production.

---

## 📋 Prérequis

- Compte Supabase (gratuit ou payant)
- Compte Square (pour les paiements)
- Compte Resend ou SendGrid (pour les emails)
- Compte Vercel ou autre plateforme de déploiement
- Node.js 20+ installé localement

---

## 🔧 ÉTAPE 1: Configuration Supabase

### 1.1 Créer un projet Supabase

1. Allez sur [supabase.com](https://supabase.com)
2. Créez un nouveau projet
3. Notez votre URL et vos clés API

### 1.2 Exécuter les migrations

1. Dans votre projet Supabase, allez dans **SQL Editor**
2. Copiez le contenu de `supabase/migrations/001_initial_schema.sql`
3. Exécutez le script
4. Vérifiez que toutes les tables sont créées

### 1.3 Configurer l'authentification

1. Allez dans **Authentication > Settings**
2. Activez **Email Auth**
3. Configurez les URLs de redirection :
   - `http://localhost:3000/**` (développement)
   - `https://votre-domaine.com/**` (production)

### 1.4 Créer le premier admin

Exécutez cette requête SQL dans l'éditeur SQL (remplacez les valeurs) :

```sql
-- Créer l'utilisateur dans Supabase Auth (via l'interface ou API)
-- Puis créer le profil admin :

INSERT INTO user_profiles (id, email, name, role, permissions, is_active)
VALUES (
  'uuid-de-l-utilisateur-auth', -- Remplacer par l'ID de l'utilisateur créé
  'admin@monican.com',
  'Admin Principal',
  'admin',
  '["all"]'::jsonb,
  true
);
```

**OU** utilisez l'interface Supabase Auth pour créer l'utilisateur, puis créez le profil manuellement.

---

## 💳 ÉTAPE 2: Configuration Square

### 2.1 Créer une application Square

1. Allez sur [developer.squareup.com](https://developer.squareup.com)
2. Créez un compte développeur
3. Créez une nouvelle application
4. Notez votre **Application ID** et **Access Token**

### 2.2 Configurer l'environnement

- **Sandbox** : Pour les tests (gratuit)
- **Production** : Pour les vrais paiements (nécessite un compte Square actif)

### 2.3 Obtenir le Location ID

1. Dans votre dashboard Square, allez dans **Locations**
2. Notez votre **Location ID**

### 2.4 Configurer les webhooks (optionnel)

1. Dans Square Dashboard, configurez les webhooks
2. URL : `https://votre-domaine.com/api/webhooks/square`
3. Notez la **Webhook Signature Key**

---

## 📧 ÉTAPE 3: Configuration Email

### Option A: Resend (Recommandé)

1. Allez sur [resend.com](https://resend.com)
2. Créez un compte
3. Vérifiez votre domaine ou utilisez le domaine de test
4. Créez une API Key
5. Notez votre clé API

### Option B: SendGrid

1. Allez sur [sendgrid.com](https://sendgrid.com)
2. Créez un compte
3. Vérifiez votre domaine
4. Créez une API Key
5. Notez votre clé API

---

## 🔐 ÉTAPE 4: Configuration des Variables d'Environnement

### 4.1 Créer le fichier .env.local

Copiez `env.example` vers `.env.local` et remplissez toutes les variables :

```bash
cp env.example .env.local
```

### 4.2 Variables requises

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre-anon-key
SUPABASE_SERVICE_ROLE_KEY=votre-service-role-key

# Square
SQUARE_APPLICATION_ID=votre-app-id
SQUARE_ACCESS_TOKEN=votre-access-token
SQUARE_ENVIRONMENT=sandbox  # ou production
SQUARE_LOCATION_ID=votre-location-id

# Email
EMAIL_SERVICE=resend  # ou sendgrid
RESEND_API_KEY=votre-resend-key
# OU
SENDGRID_API_KEY=votre-sendgrid-key

EMAIL_FROM=noreply@monican.com
EMAIL_FROM_NAME=Monican E-commerce

# Application
NEXT_PUBLIC_APP_URL=https://votre-domaine.com
NODE_ENV=production
```

### 4.3 Générer JWT_SECRET

```bash
openssl rand -base64 32
```

Ajoutez le résultat à `JWT_SECRET` dans `.env.local`

---

## 🏗️ ÉTAPE 5: Build et Test Local

### 5.1 Installer les dépendances

```bash
npm install
```

### 5.2 Tester le build

```bash
npm run build
```

### 5.3 Tester en local

```bash
npm run start
```

Vérifiez que tout fonctionne :
- ✅ Connexion admin
- ✅ Affichage des produits
- ✅ Checkout (en mode sandbox)

---

## 🚀 ÉTAPE 6: Déploiement sur Vercel

### 6.1 Préparer le projet

1. Assurez-vous que votre code est sur GitHub/GitLab
2. Vérifiez que `.env.local` est dans `.gitignore`

### 6.2 Déployer sur Vercel

1. Allez sur [vercel.com](https://vercel.com)
2. Importez votre projet GitHub
3. Configurez les variables d'environnement dans Vercel :
   - Allez dans **Settings > Environment Variables**
   - Ajoutez toutes les variables de `.env.local`
4. Déployez

### 6.3 Configurer le domaine

1. Dans Vercel, allez dans **Settings > Domains**
2. Ajoutez votre domaine personnalisé
3. Suivez les instructions DNS

---

## ✅ ÉTAPE 7: Vérifications Post-Déploiement

### 7.1 Vérifier Supabase

- [ ] Les tables sont créées
- [ ] Les policies RLS fonctionnent
- [ ] L'authentification fonctionne

### 7.2 Vérifier Square

- [ ] Les paiements en sandbox fonctionnent
- [ ] Les webhooks sont configurés (si utilisés)
- [ ] Tester un paiement complet

### 7.3 Vérifier Email

- [ ] Envoyer un email de test
- [ ] Vérifier la réception
- [ ] Tester les templates

### 7.4 Vérifier l'application

- [ ] Page d'accueil charge
- [ ] Catalogue affiche les produits
- [ ] Panier fonctionne
- [ ] Checkout fonctionne
- [ ] Admin peut se connecter
- [ ] Admin peut gérer les produits

---

## 🔄 ÉTAPE 8: Migration des Données

### 8.1 Importer les produits

1. Connectez-vous à l'admin
2. Allez dans **Produits > Import**
3. Importez vos produits via CSV

### 8.2 Vérifier le stock

1. Vérifiez que le stock est correctement configuré
2. Testez la réduction de stock lors d'une commande

---

## 🛡️ ÉTAPE 9: Sécurité

### 9.1 Vérifications

- [ ] HTTPS est activé
- [ ] Les variables d'environnement sont sécurisées
- [ ] Les clés API ne sont pas exposées
- [ ] Les cookies sont sécurisés (httpOnly, secure)
- [ ] Rate limiting est configuré (si applicable)

### 9.2 Monitoring

- [ ] Configurer Sentry (optionnel)
- [ ] Configurer les logs
- [ ] Configurer les alertes

---

## 📊 ÉTAPE 10: Passage en Production Square

### 10.1 Prérequis

- Compte Square actif
- Vérification d'identité complétée
- Compte bancaire connecté

### 10.2 Configuration

1. Dans Square Dashboard, passez en **Production**
2. Obtenez les nouvelles clés API de production
3. Mettez à jour les variables d'environnement :
   ```env
   SQUARE_ENVIRONMENT=production
   SQUARE_ACCESS_TOKEN=votre-token-production
   ```
4. Redéployez l'application

### 10.3 Tests

- [ ] Tester un petit paiement réel
- [ ] Vérifier la réception des fonds
- [ ] Tester un remboursement

---

## 🆘 Dépannage

### Problème: Erreur de connexion Supabase

- Vérifiez que les clés API sont correctes
- Vérifiez que l'URL Supabase est correcte
- Vérifiez les policies RLS

### Problème: Paiements échouent

- Vérifiez que vous êtes en mode sandbox pour les tests
- Vérifiez que le token Square est valide
- Vérifiez les logs Square Dashboard

### Problème: Emails ne partent pas

- Vérifiez que la clé API email est correcte
- Vérifiez que le domaine est vérifié (Resend/SendGrid)
- Vérifiez les logs du service d'email

### Problème: Build échoue

- Vérifiez que toutes les variables d'environnement sont définies
- Vérifiez les erreurs de TypeScript
- Vérifiez les logs de build

---

## 📞 Support

Pour toute question ou problème :
- Consultez la documentation Supabase
- Consultez la documentation Square
- Consultez la documentation de votre service d'email

---

**Bon déploiement ! 🚀**

