/**
 * Script pour tester la fonction verifyAuth avec un userId spécifique
 * Usage: node scripts/test-verify-auth.js [userId]
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Variables d\'environnement manquantes');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testVerifyAuth(userId) {
  console.log('🔍 Test de verifyAuth pour userId:', userId, '\n');
  
  try {
    // Simuler la requête de verifyAuth
    console.log('📊 Tentative de récupération du profil utilisateur...');
    
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (profileError) {
      console.error('❌ Erreur:', profileError.message);
      console.error('   Code:', profileError.code);
      console.error('   Détails:', profileError.details);
      console.error('   Hint:', profileError.hint);
      
      if (profileError.code === 'PGRST116') {
        console.error('\n⚠️  Utilisateur non trouvé dans user_profiles');
        console.error('   Vérifiez que l\'utilisateur existe dans auth.users ET user_profiles');
      } else if (profileError.message?.includes('permission') || profileError.message?.includes('policy')) {
        console.error('\n⚠️  Erreur de permissions RLS');
        console.error('   Exécutez: supabase/migrations/010_fix_user_profiles_rls.sql');
      }
      return;
    }
    
    if (!profile) {
      console.error('❌ Profil non trouvé');
      return;
    }
    
    console.log('✅ Profil trouvé:');
    console.log('   ID:', profile.id);
    console.log('   Email:', profile.email);
    console.log('   Nom:', profile.name);
    console.log('   Rôle:', profile.role);
    console.log('   Actif:', profile.is_active);
    
    if (profile.role !== 'admin' && profile.role !== 'super_admin') {
      console.warn('\n⚠️  L\'utilisateur n\'est pas admin');
    } else {
      console.log('\n✅ L\'utilisateur est admin et peut créer des sous-admins');
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error('   Stack:', error.stack);
  }
}

// Récupérer le userId depuis les arguments ou lister tous les admins
const userId = process.argv[2];

if (userId) {
  testVerifyAuth(userId);
} else {
  console.log('📋 Liste des admins disponibles:\n');
  supabaseAdmin
    .from('user_profiles')
    .select('id, email, name, role')
    .in('role', ['admin', 'super_admin'])
    .then(({ data, error }) => {
      if (error) {
        console.error('❌ Erreur:', error.message);
        return;
      }
      
      if (!data || data.length === 0) {
        console.log('⚠️  Aucun admin trouvé');
        return;
      }
      
      console.log('Admins trouvés:');
      data.forEach((admin, i) => {
        console.log(`   ${i + 1}. ${admin.name} (${admin.email})`);
        console.log(`      ID: ${admin.id}`);
        console.log(`      Rôle: ${admin.role}\n`);
      });
      
      console.log('\n💡 Pour tester verifyAuth avec un admin spécifique:');
      console.log(`   node scripts/test-verify-auth.js ${data[0].id}`);
    });
}

