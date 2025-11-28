// CHEMIN: src/lib/supabase.ts
// ACTION: CRÉER CE FICHIER (créer le dossier lib si nécessaire)

import { createClient } from '@supabase/supabase-js';

// Récupérer les variables d'environnement avec valeurs par défaut pour permettre le build
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-service-role-key';

// Client pour le côté serveur (avec service_role key)
export const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseServiceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Client pour le côté client (avec anon key)
export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
);