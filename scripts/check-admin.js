/**
 * Script pour vérifier s'il y a un admin et afficher les informations
 * Usage: node scripts/check-admin.js
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Variables d\'environnement manquantes:');
  console.error('   - NEXT_PUBLIC_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkAdmins() {
  try {
    console.log('🔍 Vérification des admins...\n');

    const { data: admins, error } = await supabase
      .from('user_profiles')
      .select('id, email, name, role, is_active, created_at')
      .in('role', ['admin', 'super_admin'])
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Erreur:', error.message);
      process.exit(1);
    }

    if (!admins || admins.length === 0) {
      console.log('⚠️  Aucun admin trouvé dans la base de données.\n');
      console.log('📝 Pour créer un admin:');
      console.log('   1. Allez dans Supabase > Authentication > Users');
      console.log('   2. Créez un utilisateur avec email et mot de passe');
      console.log('   3. Notez l\'UUID de l\'utilisateur');
      console.log('   4. Exécutez le script: node scripts/create-admin.js');
      return;
    }

    console.log(`✅ ${admins.length} admin(s) trouvé(s):\n`);
    
    admins.forEach((admin, index) => {
      console.log(`${index + 1}. ${admin.name || 'Sans nom'}`);
      console.log(`   Email: ${admin.email}`);
      console.log(`   Rôle: ${admin.role}`);
      console.log(`   Statut: ${admin.is_active ? '✅ Actif' : '❌ Inactif'}`);
      console.log(`   ID: ${admin.id}`);
      console.log(`   Créé le: ${new Date(admin.created_at).toLocaleDateString('fr-FR')}`);
      console.log('');
    });

    console.log('💡 Pour changer le mot de passe d\'un admin:');
    console.log('   Utilisez l\'API: POST /api/admin/change-password');
    console.log('   Body: { "email": "admin@example.com", "newPassword": "nouveauMotDePasse123" }');
    console.log('   Ou utilisez Supabase Dashboard > Authentication > Users');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

checkAdmins();

