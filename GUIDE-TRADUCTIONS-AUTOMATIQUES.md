# 🌍 Guide - Système de Traductions Automatiques

## 📋 Vue d'ensemble

Ce guide explique comment s'assurer que **TOUS les nouveaux fichiers** utilisent automatiquement le système de traductions dès leur intégration.

---

## ✅ Règles Obligatoires pour Nouveaux Fichiers

### 1. **Composants Client (Client Components)**

**TOUJOURS** utiliser `'use client'` et `useLanguage()` :

```tsx
'use client';

import { useLanguage } from '@/contexts/LanguageContext';

export default function MonNouveauComposant() {
  const { t } = useLanguage();

  return (
    <div>
      <h1>{t('monTitre')}</h1>
      <p>{t('maDescription')}</p>
    </div>
  );
}
```

### 2. **Composants Serveur (Server Components)**

**CRÉER un composant client séparé** pour les parties traduites :

```tsx
// page.tsx (Server Component)
import MonComposantClient from './MonComposantClient';

export default async function MaPage() {
  const data = await fetchData();
  
  return (
    <div>
      <MonComposantClient data={data} />
    </div>
  );
}
```

```tsx
// MonComposantClient.tsx (Client Component)
'use client';

import { useLanguage } from '@/contexts/LanguageContext';

export default function MonComposantClient({ data }) {
  const { t } = useLanguage();
  
  return <h1>{t('monTitre')}</h1>;
}
```

---

## 📝 Checklist pour Nouveaux Fichiers

Avant de créer un nouveau composant/page, vérifiez :

- [ ] **Aucun texte en dur** - Tous les textes utilisent `t('clé')`
- [ ] **Import de `useLanguage`** - `import { useLanguage } from '@/contexts/LanguageContext'`
- [ ] **'use client'** - Si c'est un composant client
- [ ] **Traductions ajoutées** - Toutes les clés dans `src/translations.js` (EN, FR, ES, HT)
- [ ] **Testé avec changement de langue** - Vérifier que les traductions fonctionnent

---

## 🔧 Template de Composant avec Traductions

### Template Client Component

```tsx
'use client';

import { useLanguage } from '@/contexts/LanguageContext';

export default function MonComposant() {
  const { t } = useLanguage();

  return (
    <div>
      <h1>{t('titre')}</h1>
      <p>{t('description')}</p>
      <button>{t('bouton')}</button>
    </div>
  );
}
```

### Template Page avec Server + Client

```tsx
// page.tsx
import MonComposantClient from './MonComposantClient';
import { fetchData } from '@/lib/data';

export default async function MaPage() {
  const data = await fetchData();
  
  return <MonComposantClient data={data} />;
}
```

```tsx
// MonComposantClient.tsx
'use client';

import { useLanguage } from '@/contexts/LanguageContext';

interface Props {
  data: any;
}

export default function MonComposantClient({ data }: Props) {
  const { t } = useLanguage();
  
  return (
    <div>
      <h1>{t('titre')}</h1>
      <p>{t('description')}</p>
    </div>
  );
}
```

---

## 📚 Ajouter de Nouvelles Traductions

### Étape 1: Ajouter dans `src/translations.js`

**TOUJOURS ajouter pour les 4 langues** (EN, FR, ES, HT) :

```javascript
export const translations = {
  en: {
    // ... traductions existantes
    maNouvelleCle: 'My New Text',
  },
  fr: {
    // ... traductions existantes
    maNouvelleCle: 'Mon Nouveau Texte',
  },
  es: {
    // ... traductions existantes
    maNouvelleCle: 'Mi Nuevo Texto',
  },
  ht: {
    // ... traductions existantes
    maNouvelleCle: 'Nouvo Tèks Mwen',
  },
};
```

### Étape 2: Utiliser dans le composant

```tsx
const { t } = useLanguage();
return <p>{t('maNouvelleCle')}</p>;
```

---

## 🚨 Erreurs Communes à Éviter

### ❌ NE PAS FAIRE

```tsx
// ❌ Texte en dur
<h1>Mon Titre</h1>

// ❌ Oublier 'use client'
export default function MonComposant() {
  const { t } = useLanguage(); // ❌ Erreur!
}

// ❌ Utiliser useLanguage dans un Server Component
export default async function MaPage() {
  const { t } = useLanguage(); // ❌ Erreur!
  return <h1>{t('titre')}</h1>;
}
```

### ✅ FAIRE

```tsx
// ✅ Utiliser t()
const { t } = useLanguage();
<h1>{t('monTitre')}</h1>

// ✅ 'use client' pour Client Components
'use client';
export default function MonComposant() {
  const { t } = useLanguage(); // ✅ OK
}

// ✅ Séparer Server et Client
// page.tsx (Server)
export default async function MaPage() {
  return <MonComposantClient />;
}

// MonComposantClient.tsx (Client)
'use client';
export default function MonComposantClient() {
  const { t } = useLanguage(); // ✅ OK
  return <h1>{t('titre')}</h1>;
}
```

---

## 🔍 Vérification Automatique

### Script de Vérification (à créer)

```bash
# Vérifier les textes en dur dans les composants
npm run check:translations
```

Ce script devrait :
1. Chercher les textes en dur (français/anglais) dans les fichiers `.tsx`
2. Vérifier que toutes les clés de traduction existent dans les 4 langues
3. Afficher un rapport des problèmes

---

## 📖 Structure des Traductions

Organisez les traductions par section dans `src/translations.js` :

```javascript
export const translations = {
  en: {
    // Navigation
    home: 'Home',
    shop: 'Shop',
    
    // Page spécifique
    aboutTitle: 'About Us',
    aboutDescription: '...',
    
    // Actions communes
    save: 'Save',
    cancel: 'Cancel',
  },
  // ... autres langues
};
```

---

## 🎯 Bonnes Pratiques

1. **Nommage des clés** : Utilisez des noms descriptifs
   - ✅ `aboutTitle`, `contactSubtitle`, `cartEmpty`
   - ❌ `t1`, `text1`, `label`

2. **Groupement** : Groupez les traductions par page/composant
   - `aboutTitle`, `aboutDescription`, `aboutMission`
   - `contactTitle`, `contactSubtitle`, `contactForm`

3. **Réutilisation** : Réutilisez les traductions communes
   - `save`, `cancel`, `loading`, `error` sont utilisés partout

4. **Pluriels** : Créez des clés séparées si nécessaire
   - `sold` (singulier) et `soldPlural` (pluriel)

---

## 🛠️ Outils Utiles

### Helper de Traduction

Utilisez `src/lib/translation-helper.ts` pour des helpers supplémentaires :

```tsx
import { useTranslation } from '@/lib/translation-helper';

export default function MonComposant() {
  const { t } = useTranslation(); // Affiche des warnings en dev si clé manquante
  
  return <p>{t('maCle', 'Fallback si manquant')}</p>;
}
```

---

## ✅ Checklist Finale

Avant de commit un nouveau fichier :

- [ ] Tous les textes utilisent `t('clé')`
- [ ] Toutes les clés ajoutées dans `translations.js` (4 langues)
- [ ] Composant testé avec changement de langue
- [ ] Aucun warning dans la console
- [ ] Code review vérifie les traductions

---

## 📞 Support

Si vous avez des questions sur les traductions :
1. Consultez ce guide
2. Regardez les exemples dans les composants existants
3. Vérifiez `src/translations.js` pour voir les clés disponibles

---

**Rappel : TOUS les nouveaux fichiers DOIVENT utiliser le système de traductions ! 🌍**

