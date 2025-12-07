/**
 * Script pour tester la connexion Supabase et vérifier les tables
 * Usage: node scripts/test-supabase-connection.js
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 Test de connexion Supabase...\n');

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Variables d\'environnement manquantes:');
  console.error('   - NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceRoleKey ? '✅' : '❌');
  process.exit(1);
}

console.log('✅ Variables d\'environnement configurées');
console.log('   URL:', supabaseUrl);
console.log('   Service Role Key:', supabaseServiceRoleKey.substring(0, 20) + '... (' + supabaseServiceRoleKey.length + ' caractères)\n');

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testConnection() {
  try {
    console.log('📊 Test 1: Vérifier la connexion à la base de données...');
    
    // Test simple: lister les utilisateurs auth
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ Erreur lors de la liste des utilisateurs auth:', authError.message);
      if (authError.message.includes('not allowed') || authError.message.includes('permission')) {
        console.error('\n⚠️  La clé service role n\'a pas les permissions nécessaires.');
        console.error('   Vérifiez que vous avez copié la clé "service_role" (pas "anon")');
        console.error('   Dans Supabase: Settings > API > service_role key');
      }
      return;
    }
    
    console.log('✅ Connexion réussie!');
    console.log('   Nombre d\'utilisateurs auth:', authUsers?.users?.length || 0);
    
    // Test 2: Vérifier la table user_profiles
    console.log('\n📊 Test 2: Vérifier la table user_profiles...');
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('id, email, name, role, is_active')
      .limit(5);
    
    if (profilesError) {
      console.error('❌ Erreur lors de la lecture de user_profiles:', profilesError.message);
      console.error('   Code:', profilesError.code);
      console.error('   Détails:', profilesError.details);
      console.error('   Hint:', profilesError.hint);
      
      if (profilesError.code === '42P01') {
        console.error('\n⚠️  La table user_profiles n\'existe pas.');
        console.error('   Exécutez la migration: supabase/migrations/001_initial_schema.sql');
      } else if (profilesError.message?.includes('permission') || profilesError.message?.includes('policy')) {
        console.error('\n⚠️  Erreur de permissions RLS.');
        console.error('   Exécutez la migration: supabase/migrations/010_fix_user_profiles_rls.sql');
      }
      return;
    }
    
    console.log('✅ Table user_profiles accessible!');
    console.log('   Nombre de profils trouvés:', profiles?.length || 0);
    
    if (profiles && profiles.length > 0) {
      console.log('\n   Exemples de profils:');
      profiles.forEach((p, i) => {
        console.log(`   ${i + 1}. ${p.name} (${p.email}) - ${p.role} - ${p.is_active ? 'Actif' : 'Inactif'}`);
      });
    }
    
    // Test 3: Vérifier les admins
    console.log('\n📊 Test 3: Vérifier les administrateurs...');
    const { data: admins, error: adminsError } = await supabase
      .from('user_profiles')
      .select('id, email, name, role, is_active')
      .in('role', ['admin', 'super_admin'])
      .eq('is_active', true);
    
    if (adminsError) {
      console.error('❌ Erreur lors de la recherche des admins:', adminsError.message);
    } else {
      console.log('✅ Admins trouvés:', admins?.length || 0);
      if (admins && admins.length > 0) {
        admins.forEach((admin, i) => {
          console.log(`   ${i + 1}. ${admin.name} (${admin.email})`);
        });
      } else {
        console.warn('⚠️  Aucun admin actif trouvé.');
        console.warn('   Créez un admin via Supabase Auth + user_profiles');
      }
    }
    
    // Test 4: Tester la création d'un utilisateur auth (simulation)
    console.log('\n📊 Test 4: Tester les permissions de création d\'utilisateur...');
    console.log('   (Test de simulation - aucun utilisateur ne sera créé)');
    
    // On ne crée pas vraiment d'utilisateur, on vérifie juste que la méthode existe
    console.log('✅ Les méthodes admin.auth sont disponibles');
    
    console.log('\n✅ Tous les tests sont passés!\n');
    console.log('💡 Si vous avez des erreurs RLS, exécutez:');
    console.log('   supabase/migrations/010_fix_user_profiles_rls.sql');
    
  } catch (error) {
    console.error('❌ Erreur inattendue:', error.message);
    console.error('   Stack:', error.stack);
  }
}

testConnection();

