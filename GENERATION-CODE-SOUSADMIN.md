# 🔐 Génération Automatique des Codes Sous-Admin

## ✅ Format du Code

Le système génère **automatiquement** des codes au format **MON-XXX** où :
- **MON** = Préfixe fixe
- **XXX** = 3 chiffres (001, 002, 003, ..., 999)

### Exemples :
- MON-001
- MON-002
- MON-003
- MON-010
- MON-100
- MON-999

## 🔄 Comment ça fonctionne

### 1. Lors de la Création d'un Sous-Admin

Quand un administrateur crée un nouveau sous-admin via `/admin/users` :

1. Le système récupère tous les codes MON-XXX existants dans la base de données
2. Il trouve le prochain numéro disponible dans la séquence (1, 2, 3, etc.)
3. Il génère automatiquement le code avec 3 chiffres en utilisant `padStart(3, '0')`
4. Le code est assigné au sous-admin et affiché à l'administrateur

### 2. Algorithme de Génération

```typescript
// Format : MON-XXX où XXX est toujours 3 chiffres
subAdminCode = `MON-${String(nextNumber).padStart(3, '0')}`;
```

- Si c'est le premier sous-admin → **MON-001**
- Si MON-001 existe → **MON-002**
- Si MON-001 et MON-002 existent → **MON-003**
- Et ainsi de suite...

### 3. Gestion des "Trous" dans la Séquence

Le système est intelligent et peut remplir les "trous" :

- Si MON-001, MON-003 existent (MON-002 a été supprimé)
- Le prochain code généré sera **MON-002**

## 📋 Fichiers Concernés

### Génération du Code
- **`src/app/api/admin/users/route.ts`** : Fonction `generateUniqueSubAdminCode()` et logique de création

### Authentification
- **`src/app/api/admin/subadmin/auth/route.ts`** : Vérification du code lors de la connexion

### Interface
- **`src/app/admin/users/page.tsx`** : Formulaire de création de sous-admin
- **`src/app/admin/sousadmin/page.tsx`** : Formulaire de connexion sous-admin

## ✅ Vérification

Le système garantit que :

1. ✅ **Format toujours MON-XXX** (pas SA-XXX ni autre format)
2. ✅ **Toujours 3 chiffres** (001, 002, 010, 100, etc.)
3. ✅ **Génération automatique** (l'admin n'a pas besoin de saisir le code)
4. ✅ **Unicité garantie** (vérification avant assignation)
5. ✅ **Insensible à la casse** (MON-001 = mon-001 = Mon-001)

## 🔍 Test de la Génération

Pour tester que la génération fonctionne :

1. Allez dans `/admin/users`
2. Cliquez sur "➕ Créer un Sous-admin"
3. Remplissez le formulaire (Nom, Email)
4. Cliquez sur "Créer"
5. Le code généré sera affiché dans l'alerte (ex: "Code unique: MON-001")
6. Ce code peut être utilisé immédiatement pour se connecter

## 📝 Notes Importantes

- **Le code est généré automatiquement** - L'administrateur ne peut pas choisir le code
- **Le code doit être noté** lors de la création car il sera nécessaire pour la connexion
- **Le format est strict** : MON-XXX avec exactement 3 chiffres
- **La limite maximale** : MON-999 (999 sous-admins maximum, mais peut être étendu)

## 🆘 Si un Code Existe Déjà

Si par erreur un code existe déjà, le système :

1. Détecte le conflit
2. Utilise la fonction de secours `generateUniqueSubAdminCode()`
3. Trouve automatiquement le prochain code disponible
4. Continue la création normalement

## 🔐 Sécurité

- Les codes sont stockés en base de données de manière sécurisée
- Un code ne peut être utilisé que si le sous-admin est actif
- Les codes sont normalisés (majuscules, pas d'espaces) avant vérification

