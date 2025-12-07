# 🔧 Solution au problème "function name is not unique"

## Problème

L'erreur `ERROR: 42725: function name "check_and_reserve_stock" is not unique` survient parce que PostgreSQL trouve plusieurs versions de la même fonction avec des signatures différentes :

- Version originale (001_initial_schema.sql) : `check_and_reserve_stock(UUID, VARCHAR, INTEGER)`
- Version nouvelle (011_fix_stock_locking.sql) : `check_and_reserve_stock(UUID, TEXT, INTEGER)`

PostgreSQL considère `VARCHAR` et `TEXT` comme des types différents pour la résolution de fonction, même s'ils sont compatibles.

## Solution

La migration `011_fix_stock_locking.sql` a été corrigée pour :

1. **Supprimer explicitement** toutes les versions possibles des fonctions avant de les recréer
2. **Utiliser CASCADE** pour supprimer même si d'autres objets dépendent de ces fonctions
3. **Spécifier la signature complète** dans les COMMENT ON FUNCTION

## Instructions

### Option 1: Réappliquer la migration corrigée

1. Exécutez d'abord ces commandes pour supprimer les fonctions existantes :

```sql
DROP FUNCTION IF EXISTS check_and_reserve_stock(UUID, VARCHAR, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS check_and_reserve_stock(UUID, TEXT, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS confirm_stock_reduction(UUID, VARCHAR, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS confirm_stock_reduction(UUID, TEXT, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS release_reserved_stock(UUID, VARCHAR, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS release_reserved_stock(UUID, TEXT, INTEGER) CASCADE;
```

2. Puis exécutez la migration `011_fix_stock_locking.sql` corrigée

### Option 2: Utiliser directement le fichier corrigé

Exécutez simplement le contenu complet de `supabase/migrations/011_fix_stock_locking.sql` qui contient maintenant les DROP statements nécessaires.

## Vérification

Après avoir appliqué la correction, vérifiez que les fonctions sont créées correctement :

```sql
-- Vérifier que seule une version existe
SELECT 
    proname as function_name,
    pg_get_function_arguments(oid) as arguments
FROM pg_proc
WHERE proname IN ('check_and_reserve_stock', 'confirm_stock_reduction', 'release_reserved_stock');
```

Vous devriez voir seulement les fonctions avec `TEXT` et non `VARCHAR`.

## Notes importantes

- Le `CASCADE` dans DROP FUNCTION peut supprimer des objets qui dépendent de ces fonctions. C'est normal car nous recréons les fonctions immédiatement après.
- TEXT et VARCHAR sont compatibles en PostgreSQL, mais PostgreSQL les distingue pour la résolution de fonction.
- Les appels RPC depuis Supabase fonctionneront correctement avec TEXT.

