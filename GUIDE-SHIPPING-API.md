# Guide d'Utilisation - Service de Calcul Automatique des Frais de Livraison

## 📋 Vue d'ensemble

Ce système calcule automatiquement les frais de livraison en utilisant :
- **USPS Rate API** : Pour les livraisons locales/nationales (même pays que l'entrepôt)
- **FedEx Rate API** : Pour les livraisons internationales (pays différent)

## 🔧 Configuration

### Variables d'environnement requises

Ajoutez ces variables dans votre fichier `.env.local` :

```env
# Adresse d'origine (votre entrepôt)
SHIPPING_ORIGIN_STREET=123 Main St
SHIPPING_ORIGIN_CITY=New York
SHIPPING_ORIGIN_STATE=NY
SHIPPING_ORIGIN_ZIP=10001
SHIPPING_ORIGIN_COUNTRY=US

# USPS API (pour livraisons domestiques)
USPS_USER_ID=your-usps-user-id
USPS_ENVIRONMENT=production  # ou 'test' pour le développement

# FedEx API (pour livraisons internationales)
FEDEX_API_KEY=your-fedex-api-key
FEDEX_API_SECRET=your-fedex-api-secret
FEDEX_ACCOUNT_NUMBER=your-fedex-account-number
FEDEX_ENVIRONMENT=production  # Production uniquement

# FedEx API URLs (optionnel - valeurs par défaut si non définies)
FEDEX_OAUTH_URL=https://apis.fedex.com/oauth/token
FEDEX_RATE_URL=https://apis.fedex.com/rate/v1/rates/quotes
```

### Obtenir les credentials

#### USPS
1. Créez un compte sur [USPS Business](https://www.usps.com/business/web-tools-apis/)
2. Allez dans "Web Tools" > "Rate Calculator API"
3. Enregistrez votre User ID

#### FedEx
1. Créez un compte sur [FedEx Developer Portal](https://developer.fedex.com/)
2. Créez une nouvelle application
3. Obtenez votre API Key et Secret
4. Utilisez votre numéro de compte FedEx existant

## 🚀 Utilisation dans le Checkout

Le système est déjà intégré dans le checkout. Voici comment il fonctionne :

### 1. Calcul automatique

Quand l'utilisateur remplit son adresse de livraison, les frais sont calculés automatiquement :

```typescript
// Dans src/app/checkout/page.tsx
const calculateShippingRates = async () => {
    const response = await fetch('/api/shipping/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            shippingAddress: {
                street: '123 Main St',
                city: 'Los Angeles',
                state: 'CA',
                zip: '90001',
                country: 'US'
            },
            items: [
                { quantity: 2, weight: 1.5 }, // 2 articles de 1.5 lbs chacun
            ]
        })
    });

    const data = await response.json();
    // data.options contient les options triées par prix croissant
};
```

### 2. Format de réponse

```json
{
    "success": true,
    "options": [
        {
            "carrier": "USPS",
            "service": "usps_1",
            "serviceName": "Priority Mail",
            "price": 8.50,
            "currency": "USD",
            "estimatedDays": {
                "min": 2,
                "max": 5
            }
        },
        {
            "carrier": "USPS",
            "service": "usps_2",
            "serviceName": "Priority Mail Express",
            "price": 25.00,
            "currency": "USD",
            "estimatedDays": {
                "min": 1,
                "max": 2
            }
        }
    ],
    "packageDimensions": {
        "weight": 3.0,
        "length": 12,
        "width": 10,
        "height": 6
    }
}
```

## 🔄 Logique de sélection automatique

### Si USPS peut livrer dans le pays de destination
- ✅ **USPS** : Proposé pour comparaison
- ✅ **FedEx** : Proposé pour comparaison
- 📊 **Résultat** : Le client voit les deux options et peut choisir la moins chère
- 🔢 **Tri automatique** : Les options sont triées par prix croissant (moins cher en premier)

**Pays où USPS peut livrer** (depuis les US) :
- 🇺🇸 États-Unis (domestique)
- 🇨🇦 Canada
- 🇲🇽 Mexique
- 🇬🇧 Royaume-Uni, 🇫🇷 France, 🇩🇪 Allemagne, 🇮🇹 Italie, 🇪🇸 Espagne, et autres pays européens
- 🇦🇺 Australie, 🇳🇿 Nouvelle-Zélande, 🇯🇵 Japon, 🇰🇷 Corée du Sud, et autres pays asiatiques
- 🇧🇷 Brésil, 🇦🇷 Argentine, et autres pays d'Amérique du Sud
- Et beaucoup d'autres...

### Si USPS ne peut pas livrer dans le pays
- ❌ **USPS** : Non disponible
- ✅ **FedEx** : Utilisé pour toutes les options

## 📦 Calcul du poids et dimensions

Le système calcule automatiquement les dimensions du colis à partir des articles :

```typescript
// Chaque article peut avoir un poids personnalisé
items: [
    { quantity: 2, weight: 1.5 },  // 2 articles × 1.5 lbs = 3 lbs
    { quantity: 1, weight: 2.0 }    // 1 article × 2.0 lbs = 2 lbs
]
// Total: 5 lbs

// Dimensions par défaut (si non spécifiées) :
// - Longueur: 12 pouces
// - Largeur: 10 pouces
// - Hauteur: 6 pouces × nombre d'articles (max 108 pouces)
```

## 🔐 Gestion OAuth FedEx

Le système gère automatiquement :
- ✅ Authentification OAuth avec cache du token
- ✅ Renouvellement automatique avant expiration
- ✅ Gestion des erreurs d'authentification

## 📄 Conversion XML USPS

Le système convertit automatiquement les réponses XML USPS en JSON :
- ✅ Parsing des balises `<Postage>`
- ✅ Extraction des prix et services
- ✅ Gestion des erreurs USPS

## 🧪 Test du système

### Test avec une adresse US (domestique)
```bash
curl -X POST http://localhost:3000/api/shipping/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "shippingAddress": {
      "street": "456 Oak Ave",
      "city": "Los Angeles",
      "state": "CA",
      "zip": "90001",
      "country": "US"
    },
    "items": [
      { "quantity": 1, "weight": 2.0 }
    ]
  }'
```

### Test avec une adresse internationale
```bash
curl -X POST http://localhost:3000/api/shipping/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "shippingAddress": {
      "street": "123 Rue de la Paix",
      "city": "Paris",
      "state": "Île-de-France",
      "zip": "75001",
      "country": "FR"
    },
    "items": [
      { "quantity": 1, "weight": 2.0 }
    ]
  }'
```

## ⚠️ Gestion des erreurs

Le système inclut une gestion robuste des erreurs :

1. **Erreurs d'API** : Retourne des fallback rates si les APIs échouent
2. **Credentials manquants** : Utilise des taux estimés
3. **Erreurs de réseau** : Logs détaillés + fallback
4. **Validation** : Vérifie que l'adresse est complète avant l'appel

## 🔍 Debugging

Activez les logs pour voir les détails :

```typescript
// Les erreurs sont loggées dans la console serveur
console.error('Error calculating shipping:', error);
```

## 📝 Notes importantes

1. **FedEx Sandbox** : Utilisez `FEDEX_ENVIRONMENT=sandbox` pour les tests
2. **USPS Test** : Utilisez `USPS_ENVIRONMENT=test` pour le développement
3. **Poids maximum** : USPS limite à 70 lbs, FedEx jusqu'à 150 lbs
4. **Dimensions** : Maximum 108 pouces pour USPS
5. **Devise** : Les prix sont convertis automatiquement selon le pays de destination

## 🎯 Exemple complet d'intégration

```typescript
// Dans votre composant checkout
import { useState, useEffect } from 'react';

function CheckoutComponent() {
    const [shippingOptions, setShippingOptions] = useState([]);
    const [selectedOption, setSelectedOption] = useState(null);

    const calculateShipping = async (address, items) => {
        try {
            const response = await fetch('/api/shipping/calculate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    shippingAddress: address,
                    items: items.map(item => ({
                        quantity: item.quantity,
                        weight: item.weight || 1.0 // Poids par défaut
                    }))
                })
            });

            const data = await response.json();
            
            if (data.success && data.options.length > 0) {
                setShippingOptions(data.options);
                // Sélectionner automatiquement l'option la moins chère
                setSelectedOption(data.options[0]);
            }
        } catch (error) {
            console.error('Erreur calcul livraison:', error);
        }
    };

    return (
        <div>
            {shippingOptions.map(option => (
                <div key={`${option.carrier}-${option.service}`}>
                    <input
                        type="radio"
                        checked={selectedOption?.service === option.service}
                        onChange={() => setSelectedOption(option)}
                    />
                    <label>
                        {option.carrier} - {option.serviceName}
                        <br />
                        ${option.price.toFixed(2)} {option.currency}
                        {option.estimatedDays && (
                            <span>
                                ({option.estimatedDays.min}-{option.estimatedDays.max} jours)
                            </span>
                        )}
                    </label>
                </div>
            ))}
        </div>
    );
}
```

## 📊 Migration SQL requise

**⚠️ IMPORTANT** : Pour le système de gestion de stock par couleur/taille, vous devez exécuter la migration SQL suivante :

**Fichier** : `supabase/migrations/026_add_color_to_inventory.sql`

**Comment l'exécuter** :
1. Via Supabase Dashboard :
   - Allez dans SQL Editor
   - Copiez le contenu du fichier de migration
   - Exécutez le script

2. Ou via CLI :
   ```bash
   supabase db push
   ```

Cette migration ajoute le champ `color` à la table `inventory` pour permettre la gestion du stock par couleur et taille.

## ✅ Checklist de déploiement

- [ ] Variables d'environnement configurées
- [ ] Credentials USPS obtenus et testés
- [ ] Credentials FedEx obtenus et testés
- [ ] URLs FedEx configurées (optionnel)
- [ ] Adresse d'origine configurée
- [ ] Migration SQL exécutée (026_add_color_to_inventory.sql)
- [ ] Test avec adresse domestique réussi
- [ ] Test avec adresse internationale réussi
- [ ] Fallback rates testés (sans credentials)
- [ ] Gestion d'erreurs validée

