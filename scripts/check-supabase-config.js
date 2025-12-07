/**
 * Script pour vérifier la configuration Supabase
 * Usage: node scripts/check-supabase-config.js
 */

require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 Vérification de la configuration Supabase...\n');

// Vérifier NEXT_PUBLIC_SUPABASE_URL
if (!supabaseUrl || supabaseUrl === 'https://placeholder.supabase.co') {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL n\'est pas configuré');
} else {
  console.log('✅ NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl);
}

// Vérifier NEXT_PUBLIC_SUPABASE_ANON_KEY
if (!supabaseAnonKey || supabaseAnonKey === 'placeholder-anon-key') {
  console.error('❌ NEXT_PUBLIC_SUPABASE_ANON_KEY n\'est pas configuré');
} else {
  console.log('✅ NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey.substring(0, 20) + '...');
}

// Vérifier SUPABASE_SERVICE_ROLE_KEY
if (!supabaseServiceRoleKey || supabaseServiceRoleKey === 'placeholder-service-role-key') {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY n\'est pas configuré');
  console.error('\n📝 Pour obtenir la clé service role:');
  console.error('   1. Allez sur https://app.supabase.com');
  console.error('   2. Sélectionnez votre projet');
  console.error('   3. Allez dans Settings > API');
  console.error('   4. Copiez la clé "service_role" (pas l\'anon key)');
  console.error('   5. Ajoutez-la dans .env.local comme:');
  console.error('      SUPABASE_SERVICE_ROLE_KEY=votre-clé-service-role-ici');
} else {
  if (supabaseServiceRoleKey.length < 50) {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY semble trop courte (doit être ~200+ caractères)');
  } else if (!supabaseServiceRoleKey.startsWith('eyJ')) {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY ne semble pas être un JWT valide (doit commencer par "eyJ")');
  } else {
    console.log('✅ SUPABASE_SERVICE_ROLE_KEY est configurée (longueur:', supabaseServiceRoleKey.length, 'caractères)');
    console.log('   Premiers caractères:', supabaseServiceRoleKey.substring(0, 20) + '...');
    
    // Tester la connexion
    console.log('\n🧪 Test de connexion avec la clé service role...');
    const { createClient } = require('@supabase/supabase-js');
    
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    // Tester en listant les utilisateurs (opération qui nécessite service role)
    supabase.auth.admin.listUsers()
      .then(({ data, error }) => {
        if (error) {
          console.error('❌ Erreur lors du test de connexion:', error.message);
          if (error.message.includes('not allowed') || error.message.includes('permission')) {
            console.error('\n⚠️  La clé service role n\'a pas les permissions nécessaires.');
            console.error('   Vérifiez que vous avez copié la bonne clé (service_role, pas anon)');
          }
        } else {
          console.log('✅ Connexion réussie! La clé service role fonctionne correctement.');
          console.log('   Nombre d\'utilisateurs trouvés:', data?.users?.length || 0);
        }
      })
      .catch(err => {
        console.error('❌ Erreur lors du test:', err.message);
      });
  }
}

console.log('\n');

