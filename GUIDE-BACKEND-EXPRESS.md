# 🚀 Guide - Backend Express pour OAuth Square

## 📋 Vue d'ensemble

Ce guide explique comment utiliser le serveur Express séparé pour gérer le callback OAuth Square et stocker les tokens dans la table `square_tokens` de Supabase.

---

## ✅ Fonctionnalités Implémentées

1. **Serveur Express** (`server.js`)
   - Route GET `/oauth/callback` pour gérer le flux OAuth Square
   - Route GET `/health` pour vérifier l'état du serveur
   - Gestion d'erreurs complète
   - Validation des paramètres

2. **Table Supabase** (`square_tokens`)
   - Migration SQL créée dans `supabase/migrations/003_create_square_tokens_table.sql`
   - Stockage des tokens OAuth Square
   - Row Level Security (RLS) configuré
   - Contrainte unique par utilisateur

---

## 🔧 Configuration

### 1. Installation des dépendances

```bash
npm install express dotenv
```

### 2. Variables d'environnement

Ajoutez ces variables dans votre fichier `.env` :

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Square OAuth
SQUARE_CLIENT_ID=your_square_oauth_client_id
SQUARE_CLIENT_SECRET=your_square_oauth_client_secret

# Serveur Express (optionnel)
PORT=3001
HOST=0.0.0.0
```

### 3. Migration Base de Données

Exécutez la migration SQL dans Supabase :

```sql
-- Exécutez le contenu de supabase/migrations/003_create_square_tokens_table.sql
```

Ou via Supabase CLI :

```bash
supabase migration up
```

---

## 🚀 Utilisation

### Démarrer le serveur

```bash
# Mode production
npm run server

# Mode développement (avec watch)
npm run server:dev
```

Le serveur démarre sur `http://localhost:3001` par défaut.

### Routes disponibles

#### GET `/oauth/callback`

Gère le callback OAuth de Square.

**Paramètres de requête :**
- `code` (requis) : Code d'autorisation retourné par Square
- `state` (requis) : État de sécurité contenant l'ID utilisateur (format: `userId-timestamp`)
- `error` (optionnel) : Code d'erreur si l'autorisation a échoué

**Réponse de succès (200) :**
```json
{
  "success": true,
  "message": "Compte Square connecté avec succès !",
  "data": {
    "user_id": "uuid",
    "merchant_id": "square_merchant_id",
    "expires_at": "2025-12-31T23:59:59.000Z"
  }
}
```

**Réponse d'erreur (400/500) :**
```json
{
  "success": false,
  "error": "Type d'erreur",
  "message": "Message d'erreur explicite",
  "details": "Détails supplémentaires (optionnel)"
}
```

#### GET `/health`

Vérifie l'état du serveur.

**Réponse (200) :**
```json
{
  "status": "ok",
  "timestamp": "2025-01-27T12:00:00.000Z",
  "service": "Square OAuth Callback Server"
}
```

---

## 📝 Flux OAuth

```
1. Utilisateur clique sur "Connecter mon compte Square"
   ↓
2. Redirection vers Square OAuth avec:
   - client_id
   - scope: PAYMENTS_WRITE MERCHANT_PROFILE_READ
   - state: userId-timestamp
   - redirect_uri: http://votre-domaine.com/oauth/callback
   ↓
3. Utilisateur autorise l'application sur Square
   ↓
4. Square redirige vers /oauth/callback avec:
   - code: code d'autorisation
   - state: userId-timestamp
   ↓
5. Backend Express:
   - Extrait userId du state
   - Échange le code contre access_token
   - Récupère merchant_id si nécessaire
   - Insère dans square_tokens
   ↓
6. Retourne réponse JSON de succès/erreur
```

---

## 🔒 Sécurité

### Validation des paramètres

- Vérification de la présence de `code` et `state`
- Extraction et validation de l'ID utilisateur depuis `state`
- Vérification des credentials Square configurés

### Gestion des erreurs

- Erreurs OAuth capturées et retournées avec messages explicites
- Erreurs de base de données loggées et retournées
- Gestion des erreurs inattendues avec try/catch

### Row Level Security (RLS)

- Les utilisateurs ne peuvent voir/modifier que leurs propres tokens
- Les admins peuvent voir tous les tokens
- Contrainte unique par utilisateur (un seul token actif)

---

## 🛠️ Structure de la table `square_tokens`

```sql
CREATE TABLE square_tokens (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES user_profiles(id),
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    token_type VARCHAR(50) DEFAULT 'Bearer',
    merchant_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(user_id) -- Un seul token actif par utilisateur
);
```

---

## 📚 Exemple d'utilisation

### Frontend (Next.js)

```typescript
// Dans votre composant SquareConnectButton
const handleConnect = async () => {
  const state = `${userId}-${Date.now()}`;
  const redirectUri = 'http://localhost:3001/oauth/callback';
  const oauthUrl = `https://connect.squareup.com/oauth2/authorize?client_id=${clientId}&scope=PAYMENTS_WRITE MERCHANT_PROFILE_READ&state=${state}&redirect_uri=${redirectUri}`;
  
  window.location.href = oauthUrl;
};
```

### Vérifier le token stocké

```typescript
// Récupérer le token d'un utilisateur
const { data, error } = await supabase
  .from('square_tokens')
  .select('*')
  .eq('user_id', userId)
  .single();

if (data && data.access_token) {
  // Utiliser le token pour les appels API Square
  const response = await fetch('https://connect.squareup.com/v2/payments', {
    headers: {
      'Authorization': `Bearer ${data.access_token}`,
      'Square-Version': '2023-10-18',
    },
  });
}
```

---

## 🐛 Dépannage

### Erreur: "Variables d'environnement Supabase manquantes"

**Solution** : Vérifiez que `SUPABASE_URL` et `SUPABASE_SERVICE_ROLE_KEY` sont définis dans `.env`.

### Erreur: "Credentials Square non configurés"

**Solution** : Vérifiez que `SQUARE_CLIENT_ID` et `SQUARE_CLIENT_SECRET` sont définis dans `.env`.

### Erreur: "État invalide"

**Solution** : Vérifiez que le paramètre `state` est au format `userId-timestamp` et que l'ID utilisateur est valide.

### Erreur: "Erreur base de données"

**Solution** :
- Vérifiez que la migration `003_create_square_tokens_table.sql` a été exécutée
- Vérifiez les permissions RLS sur `square_tokens`
- Vérifiez que l'utilisateur existe dans `user_profiles`

### Erreur: "Échec de l'échange du token"

**Solution** :
- Vérifiez que le code n'a pas déjà été utilisé (les codes sont à usage unique)
- Vérifiez que les credentials Square sont corrects
- Vérifiez les logs serveur pour plus de détails

---

## 📝 Notes importantes

1. **Format de requête** : Square utilise `application/x-www-form-urlencoded` pour OAuth, pas JSON
2. **State** : Le paramètre `state` doit contenir l'ID utilisateur pour lier le token à l'utilisateur
3. **Un seul token** : La table `square_tokens` a une contrainte unique sur `user_id`, donc un utilisateur ne peut avoir qu'un seul token actif
4. **Refresh token** : Le refresh token est stocké pour permettre le renouvellement automatique du token d'accès
5. **Merchant ID** : Le merchant_id est récupéré automatiquement si non fourni dans la réponse OAuth

---

## ✅ Checklist de Déploiement

Avant de déployer en production :

- [ ] Variables d'environnement configurées (production)
- [ ] Migration SQL exécutée en production
- [ ] Table `square_tokens` créée et RLS configuré
- [ ] Serveur Express déployé et accessible
- [ ] URI de redirection configuré dans Square Dashboard
- [ ] Test de connexion OAuth en production
- [ ] Vérification du stockage des tokens
- [ ] Logs et monitoring configurés

---

**Note** : Ce serveur Express est séparé de l'application Next.js et peut être déployé indépendamment. Assurez-vous que l'URI de redirection dans Square Dashboard pointe vers ce serveur. 🎉

