# Dépannage : l'email est envoyé mais n'arrive pas

## Vérifications à faire

### 1. Dossier Spam / Courrier indésirable
- Vérifier dans la boîte du **demandant** (destinataire)
- Vérifier aussi les onglets Gmail : "Actualités", "Promotions", "Réseaux sociaux"

### 2. Domaine vérifié dans Resend
- Connexion à [resend.com/domains](https://resend.com/domains)
- Le domaine utilisé dans `EMAIL_FROM` (ex: `noreply@monican.shop`) doit être **verified** (statut vert)
- SPF et DKIM doivent être configurés correctement dans les DNS

### 3. Dashboard Resend - Logs
- [resend.com/emails](https://resend.com/emails) : voir le statut de chaque email
- Si "Delivered" : l'email est parti, vérifier le spam côté destinataire
- Si "Bounced" ou "Complained" : problème d'adresse ou de réputation

### 4. Variable d'environnement
- `EMAIL_FROM` doit utiliser une adresse sur un **domaine vérifié** dans Resend
- Exemple : `EMAIL_FROM=noreply@monican.shop` (si monican.shop est vérifié)

### 5. Test avec une autre adresse
- Envoyer une réponse wholesale à votre propre email (Gmail, etc.) pour tester
- Si ça arrive : le problème vient peut-être du serveur mail du demandant

## Modifications apportées au code
- Les réponses wholesale sont maintenant marquées comme **transactionnelles** (meilleure délivrabilité)
- Suppression des en-têtes "newsletter" qui pouvaient être mal interprétés
