# Guide - Système de Rappel pour Paniers Abandonnés

## 📋 Vue d'ensemble

Ce système permet de :
1. **Capturer l'email** des visiteurs avec un panier non vide via un popup élégant
2. **Envoyer automatiquement** un email de rappel après 3 heures si le panier n'est pas finalisé
3. **Récupérer le panier** via un lien unique dans l'email

## 🎨 Fonctionnalités

### Popup de Capture Email
- ✅ S'affiche automatiquement après **2 minutes** de navigation avec panier non vide
- ✅ Design professionnel avec les couleurs de la marque (vert #10B981 et bleu #3B82F6)
- ✅ Non intrusif, peut être fermé
- ✅ Message attirant et visuellement professionnel
- ✅ Sauvegarde automatique du panier avec l'email

### Email de Rappel
- ✅ Envoyé automatiquement **3 heures** après l'abandon du panier
- ✅ Design professionnel avec gradient de la marque
- ✅ Liste des articles avec images
- ✅ Lien unique pour récupérer le panier
- ✅ Valable pendant 7 jours

### Page de Récupération
- ✅ Interface élégante pour récupérer le panier
- ✅ Redirection automatique vers le panier
- ✅ Gestion des erreurs (panier expiré, déjà récupéré, etc.)

## 🔧 Configuration

### 1. Variables d'environnement

Ajoutez dans votre `.env.local` :

```env
# URL du site (pour les liens dans les emails)
NEXT_PUBLIC_SITE_URL=https://monican.shop

# Clé secrète pour sécuriser l'endpoint cron (optionnel mais recommandé)
ABANDONED_CART_CRON_SECRET=your-secret-key-here
```

### 2. Migration de base de données

Exécutez la migration SQL :

```bash
# Via Supabase Dashboard
# Allez dans SQL Editor et exécutez :
supabase/migrations/027_create_abandoned_carts.sql

# Ou via CLI
supabase db push
```

### 3. Configuration du Cron Job

Pour envoyer automatiquement les emails de rappel, configurez un cron job qui appelle l'API toutes les heures :

#### Option 1 : Vercel Cron (Recommandé)

Créez `vercel.json` à la racine du projet :

```json
{
  "crons": [
    {
      "path": "/api/cart/abandoned/remind",
      "schedule": "0 * * * *"
    }
  ]
}
```

Et ajoutez la clé secrète dans les variables d'environnement Vercel.

#### Option 2 : GitHub Actions

Créez `.github/workflows/abandoned-cart-reminder.yml` :

```yaml
name: Abandoned Cart Reminder
on:
  schedule:
    - cron: '0 * * * *' # Toutes les heures
  workflow_dispatch: # Permet de déclencher manuellement

jobs:
  remind:
    runs-on: ubuntu-latest
    steps:
      - name: Send Reminders
        run: |
          curl -X POST https://monican.shop/api/cart/abandoned/remind \
            -H "Authorization: Bearer ${{ secrets.ABANDONED_CART_CRON_SECRET }}"
```

#### Option 3 : Service externe (Cron-job.org, EasyCron, etc.)

Configurez une tâche qui appelle :
```
POST https://monican.shop/api/cart/abandoned/remind
Authorization: Bearer YOUR_SECRET_KEY
```

## 📊 Structure de la base de données

### Table `abandoned_carts`

```sql
- id: UUID (clé primaire)
- email: VARCHAR(255) (email du client)
- cart_data: JSONB (données du panier)
- token: VARCHAR(255) UNIQUE (token pour récupérer le panier)
- status: VARCHAR(50) ('pending', 'reminder_sent', 'recovered', 'expired')
- reminder_sent_at: TIMESTAMP (quand l'email a été envoyé)
- recovered_at: TIMESTAMP (quand le panier a été récupéré)
- expires_at: TIMESTAMP (expiration après 7 jours)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

## 🚀 Utilisation

### Le popup s'affiche automatiquement

Le popup apparaît automatiquement après 2 minutes si :
- Le panier n'est pas vide
- L'utilisateur n'a pas fermé le popup récemment (24h)

### Flux complet

1. **Client ajoute des articles** au panier
2. **Après 2 minutes** → Popup s'affiche
3. **Client saisit son email** → Panier sauvegardé
4. **Après 3 heures** → Email de rappel envoyé automatiquement
5. **Client clique sur le lien** → Panier récupéré
6. **Client finalise** sa commande

## 📧 Format de l'email

L'email de rappel contient :
- ✅ Design professionnel avec gradient de la marque
- ✅ Liste complète des articles avec images
- ✅ Prix total en évidence
- ✅ Bouton CTA "Récupérer mon panier"
- ✅ Lien unique valable 7 jours
- ✅ Message d'urgence ("Cette offre est valable pendant 7 jours")

## 🔒 Sécurité

- ✅ Token unique pour chaque panier
- ✅ Expiration automatique après 7 jours
- ✅ Endpoint cron protégé par clé secrète (optionnel)
- ✅ Validation des données côté serveur

## 📈 Statistiques

Pour voir les statistiques des paniers abandonnés :

```sql
-- Paniers en attente de rappel
SELECT COUNT(*) FROM abandoned_carts WHERE status = 'pending';

-- Paniers avec rappel envoyé
SELECT COUNT(*) FROM abandoned_carts WHERE status = 'reminder_sent';

-- Paniers récupérés
SELECT COUNT(*) FROM abandoned_carts WHERE status = 'recovered';

-- Taux de récupération
SELECT 
    COUNT(CASE WHEN status = 'recovered' THEN 1 END) * 100.0 / 
    COUNT(CASE WHEN status IN ('reminder_sent', 'recovered') THEN 1 END) as recovery_rate
FROM abandoned_carts;
```

## 🛠️ Personnalisation

### Modifier le délai d'affichage du popup

Dans `src/components/cart/AbandonedCartPopup.tsx`, ligne 33 :

```typescript
const timer = setTimeout(() => {
    setShow(true);
}, 2 * 60 * 1000); // Modifier ici (en millisecondes)
```

### Modifier le délai d'envoi de l'email

Dans `src/app/api/cart/abandoned/remind/route.ts`, ligne 24 :

```typescript
threeHoursAgo.setHours(threeHoursAgo.getHours() - 3); // Modifier ici
```

### Modifier la durée de validité

Dans `src/app/api/cart/abandoned/route.ts`, ligne 20 :

```typescript
expiresAt.setDate(expiresAt.getDate() + 7); // Modifier ici (en jours)
```

## ✅ Checklist de déploiement

- [ ] Migration SQL exécutée
- [ ] Variables d'environnement configurées
- [ ] Cron job configuré (Vercel, GitHub Actions, ou service externe)
- [ ] Test du popup (ajouter un article, attendre 2 minutes)
- [ ] Test de l'email (créer un panier, attendre 3h ou déclencher manuellement)
- [ ] Test de récupération (cliquer sur le lien dans l'email)
- [ ] Vérifier que les emails arrivent bien (pas dans les spams)

## 🐛 Dépannage

### Le popup ne s'affiche pas
- Vérifier que le panier n'est pas vide
- Vérifier que le popup n'a pas été fermé récemment (localStorage)
- Vérifier la console pour les erreurs

### Les emails ne sont pas envoyés
- Vérifier la configuration du service email (Resend/SendGrid)
- Vérifier que le cron job est configuré et fonctionne
- Vérifier les logs de l'API `/api/cart/abandoned/remind`

### Le panier ne se récupère pas
- Vérifier que le token est valide
- Vérifier que le panier n'a pas expiré (7 jours)
- Vérifier les logs de l'API `/api/cart/abandoned/recover`

## 📝 Notes importantes

- Le popup ne s'affiche qu'une fois toutes les 24h si fermé
- Les paniers expirent après 7 jours
- Les paniers expirés sont automatiquement nettoyés après 30 jours
- Le système fonctionne même si l'utilisateur n'est pas connecté

