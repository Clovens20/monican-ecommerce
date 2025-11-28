# Guide de Développement - Monican E-commerce

## 🚀 Démarrage Rapide

### Prérequis
- Node.js 20+ installé
- npm installé

### Installation
```bash
npm install
```

### Commandes Disponibles

#### Développement
```bash
# Lancer le serveur de développement (nettoie automatiquement le lock file)
npm run dev

# Lancer le serveur de développement avec nettoyage explicite
npm run dev:clean
```

Le serveur sera accessible sur:
- **Local**: http://localhost:3000
- **Réseau**: http://0.0.0.0:3000

#### Build et Preview
```bash
# Construire le projet pour la production
npm run build

# Lancer le serveur de production (preview)
npm run preview
```

Le serveur preview sera accessible sur:
- **Local**: http://localhost:3000
- **Réseau**: http://0.0.0.0:3000

#### Nettoyage
```bash
# Nettoyer le fichier de verrou Next.js
npm run clean:lock

# Nettoyer complètement le dossier .next
npm run clean
```

## 🔧 Résolution de Problèmes

### Problème: "Unable to acquire lock"
Si vous rencontrez l'erreur `Unable to acquire lock at .next/dev/lock`:

1. **Solution automatique**: Utilisez `npm run dev:clean` qui nettoie automatiquement le lock file
2. **Solution manuelle**: 
   ```bash
   npm run clean:lock
   ```
   Ou supprimez manuellement le fichier `.next/dev/lock`

### Problème: Port déjà utilisé
Si le port 3000 est déjà utilisé, Next.js utilisera automatiquement le port suivant disponible (3001, 3002, etc.)

### Problème: Avertissement sur les lockfiles multiples
Cet avertissement apparaît si vous avez plusieurs `package-lock.json` dans votre système. Il n'affecte pas le fonctionnement du projet mais vous pouvez:
- Supprimer les lockfiles inutiles
- Ou ignorer l'avertissement (il est inoffensif)

## 📁 Structure du Projet

```
monican-ecommerce/
├── src/
│   ├── app/              # Pages Next.js (App Router)
│   ├── components/       # Composants React
│   └── lib/              # Utilitaires et données mock
├── scripts/              # Scripts utilitaires
│   └── clean-lock.ps1    # Script de nettoyage du lock file
├── public/               # Fichiers statiques
└── package.json
```

## 🌐 Accès aux Interfaces

### Interface Client
- **Accueil**: http://localhost:3000
- **Catalogue**: http://localhost:3000/catalog
- **Panier**: http://localhost:3000/cart

### Interface Admin
- **Dashboard**: http://localhost:3000/admin
- **Commandes**: http://localhost:3000/admin/orders
- **Produits**: http://localhost:3000/admin/products

### Interface Sous-Admin
- **Login**: http://localhost:3000/admin-sousadmin
- **Codes de test**: SA-001, SA-002, SA-003

## 🛠️ Technologies Utilisées

- **Next.js 16.0.4** - Framework React
- **React 19.2.0** - Bibliothèque UI
- **TypeScript** - Typage statique
- **Supabase** - Backend (configuration requise)

## 📝 Notes

- Le projet utilise le mode App Router de Next.js
- Les données sont actuellement mockées (voir `src/lib/`)
- L'intégration Supabase nécessite la configuration des variables d'environnement

