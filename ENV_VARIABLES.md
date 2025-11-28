# Variables d'Environnement Requises

Créez un fichier `.env.local` à la racine du projet avec les variables suivantes:

```env
# ============================================================================
# SUPABASE CONFIGURATION
# ============================================================================
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# ============================================================================
# SQUARE PAYMENT API
# ============================================================================
SQUARE_APPLICATION_ID=your-square-application-id
SQUARE_ACCESS_TOKEN=your-square-access-token
SQUARE_ENVIRONMENT=sandbox
# Options: sandbox (test) ou production (live)

# ============================================================================
# EMAIL SERVICE (Resend)
# ============================================================================
RESEND_API_KEY=re_your-resend-api-key
RESEND_FROM_EMAIL=noreply@monican.com
RESEND_FROM_NAME=Monican E-commerce

# ============================================================================
# APPLICATION CONFIGURATION
# ============================================================================
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000

# ============================================================================
# SECURITY
# ============================================================================
COOKIE_SECRET=your-random-secret-key-here
```

## Instructions

1. Copiez ce contenu dans un fichier `.env.local`
2. Remplacez toutes les valeurs `your-...` par vos vraies clés API
3. Ne commitez JAMAIS le fichier `.env.local` (il est déjà dans .gitignore)

## Où obtenir les clés

- **Supabase:** https://app.supabase.com/project/_/settings/api
- **Square:** https://developer.squareup.com/apps
- **Resend:** https://resend.com/api-keys

