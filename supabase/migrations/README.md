# Migrations Supabase

Ce dossier contient les migrations SQL pour la base de données Supabase.

## Installation

1. Connectez-vous à votre projet Supabase
2. Allez dans l'éditeur SQL
3. Exécutez le fichier `001_initial_schema.sql` dans l'ordre

## Structure

- `001_initial_schema.sql` - Schéma initial complet avec toutes les tables

## Ordre d'exécution

1. Exécutez `001_initial_schema.sql` en premier

## Notes importantes

- Les migrations créent automatiquement les index et triggers
- Les Row Level Security (RLS) est activé par défaut
- Ajustez les policies RLS selon vos besoins de sécurité
- Les fonctions utilitaires sont incluses pour la gestion du stock

## Vérification

Après l'exécution, vérifiez que toutes les tables sont créées :
- products
- user_profiles
- orders
- order_items
- inventory
- cart_items
- wishlist
- email_queue
- audit_log

