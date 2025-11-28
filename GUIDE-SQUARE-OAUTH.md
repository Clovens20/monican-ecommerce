# 🔐 Guide - Intégration OAuth Square

## 📋 Vue d'ensemble

Ce guide explique comment configurer et utiliser l'intégration OAuth Square pour permettre aux clients de connecter leur propre compte Square à l'application Monican.

---

## ✅ Fonctionnalités Implémentées

1. **Page Paramètres Admin** (`/admin/settings`)
   - Section Paiements avec bouton de connexion Square
   - Affichage du statut de connexion

2. **Bouton de Connexion Square** (`SquareConnectButton`)
   - Redirige vers l'URL OAuth Square
   - Génère un state unique basé sur l'ID utilisateur
   - Gère les états de chargement

3. **Route de Callback OAuth** (`/api/oauth/callback`)
   - Reçoit le code d'autorisation de Square
   - Échange le code contre un access_token
   - Stocke l'access_token en base de données

4. **Migration Base de Données**
   - Ajoute les colonnes nécessaires à `user_profiles`:
     - `square_access_token`
     - `square_access_token_expires_at`
     - `square_merchant_id`
     - `square_connected_at`

---

## 🔧 Configuration Requise

### 1. Variables d'Environnement

Ajoutez ces variables dans votre fichier `.env.local` :

```env
# Square OAuth
NEXT_PUBLIC_SQUARE_CLIENT_ID=your_square_oauth_client_id
SQUARE_CLIENT_ID=your_square_oauth_client_id
SQUARE_CLIENT_SECRET=your_square_oauth_client_secret
SQUARE_REDIRECT_URI=https://www.monican.shop/oauth/callback
```

**Note importante** : 
- `NEXT_PUBLIC_SQUARE_CLIENT_ID` est exposé côté client (nécessaire pour l'URL OAuth)
- `SQUARE_CLIENT_SECRET` doit rester secret (utilisé uniquement côté serveur)

### 2. Configuration Square Dashboard

1. Connectez-vous à [Square Developer Dashboard](https://developer.squareup.com/)
2. Créez une nouvelle application OAuth
3. Configurez l'URI de redirection : `https://www.monican.shop/oauth/callback`
4. Copiez le **Client ID** et **Client Secret**
5. Ajoutez-les dans vos variables d'environnement

### 3. Migration Base de Données

Exécutez la migration SQL dans Supabase :

```bash
# Via Supabase Dashboard > SQL Editor
# Ou via CLI: supabase migration up
```

Le fichier de migration se trouve dans : `supabase/migrations/002_add_square_oauth.sql`

---

## 🚀 Utilisation

### Pour l'Administrateur

1. Connectez-vous à l'interface admin
2. Allez dans **Paramètres** (menu latéral)
3. Dans la section **Paiements**, cliquez sur **"Connecter mon compte Square"**
4. Vous serez redirigé vers Square pour autoriser l'application
5. Après autorisation, vous serez redirigé vers `/admin/settings?success=square_connected`

### Vérification du Statut

L'application vérifie automatiquement si Square est connecté et affiche :
- ✅ Badge "Connecté" si le compte est lié
- 🔵 Bouton "Connecter mon compte Square" si non connecté

---

## 📝 Flux OAuth

```
1. Admin clique sur "Connecter mon compte Square"
   ↓
2. Redirection vers Square OAuth avec:
   - client_id (depuis NEXT_PUBLIC_SQUARE_CLIENT_ID)
   - scope: PAYMENTS_WRITE MERCHANT_PROFILE_READ
   - state: userId-timestamp (unique)
   - redirect_uri: https://www.monican.shop/oauth/callback
   ↓
3. Admin autorise l'application sur Square
   ↓
4. Square redirige vers /api/oauth/callback avec:
   - code: code d'autorisation
   - state: userId-timestamp
   ↓
5. Backend échange le code contre access_token
   ↓
6. Backend stocke access_token en base de données
   ↓
7. Redirection vers /admin/settings?success=square_connected
```

---

## 🔒 Sécurité

### Protection du State

Le paramètre `state` contient l'ID utilisateur et un timestamp pour :
- Prévenir les attaques CSRF
- Identifier l'utilisateur lors du callback
- Vérifier l'intégrité de la requête

### Stockage des Tokens

- Les tokens sont stockés de manière sécurisée dans Supabase
- L'access_token est lié à l'utilisateur via `user_profiles.id`
- Les tokens expirent automatiquement (géré par Square)

### Variables d'Environnement

- **NEXT_PUBLIC_*** : Exposées côté client (nécessaires pour OAuth)
- **Sans NEXT_PUBLIC_*** : Privées, utilisées uniquement côté serveur

---

## 🛠️ Utilisation de l'Access Token

Une fois connecté, vous pouvez utiliser l'access_token pour :

```typescript
// Exemple: Récupérer l'access_token d'un utilisateur
const { data: profile } = await supabaseAdmin
  .from('user_profiles')
  .select('square_access_token, square_merchant_id')
  .eq('id', userId)
  .single();

const accessToken = profile?.square_access_token;

// Utiliser l'access_token pour les appels API Square
const response = await fetch('https://connect.squareup.com/v2/payments', {
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Square-Version': '2023-10-18',
  },
});
```

---

## 🐛 Dépannage

### Erreur: "Square Client ID non configuré"

**Solution** : Vérifiez que `NEXT_PUBLIC_SQUARE_CLIENT_ID` est défini dans `.env.local` et redémarrez le serveur de développement.

### Erreur: "missing_parameters"

**Cause** : Square n'a pas renvoyé le code ou le state.

**Solution** : 
- Vérifiez que l'URI de redirection est correctement configuré dans Square Dashboard
- Vérifiez que l'URI correspond exactement à `SQUARE_REDIRECT_URI`

### Erreur: "token_exchange_failed"

**Cause** : L'échange du code contre le token a échoué.

**Solution** :
- Vérifiez que `SQUARE_CLIENT_ID` et `SQUARE_CLIENT_SECRET` sont corrects
- Vérifiez que le code n'a pas déjà été utilisé (les codes sont à usage unique)
- Vérifiez les logs serveur pour plus de détails

### Erreur: "database_error"

**Cause** : Erreur lors de la sauvegarde en base de données.

**Solution** :
- Vérifiez que la migration `002_add_square_oauth.sql` a été exécutée
- Vérifiez les permissions RLS sur `user_profiles`
- Vérifiez les logs Supabase

---

## 📚 Ressources

- [Square OAuth Documentation](https://developer.squareup.com/docs/oauth-api/overview)
- [Square Developer Dashboard](https://developer.squareup.com/apps)
- [Square API Reference](https://developer.squareup.com/reference/square)

---

## ✅ Checklist de Déploiement

Avant de déployer en production :

- [ ] Variables d'environnement configurées (production)
- [ ] Migration SQL exécutée en production
- [ ] URI de redirection configuré dans Square Dashboard (production)
- [ ] Test de connexion OAuth en production
- [ ] Vérification du stockage des tokens
- [ ] Test de l'utilisation de l'access_token pour les paiements

---

**Note** : Cette fonctionnalité permet à chaque client d'avoir son propre compte Square connecté, sans que vous ayez besoin de gérer leurs API keys directement. 🎉

