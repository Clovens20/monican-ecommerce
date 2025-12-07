/**
 * Script pour changer le mot de passe d'un admin
 * Usage: node scripts/change-admin-password.js <email> <nouveauMotDePasse>
 * Exemple: node scripts/change-admin-password.js admin@monican.com NouveauMotDePasse123
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

const [email, newPassword] = process.argv.slice(2);

if (!email || !newPassword) {
  console.error('❌ Usage: node scripts/change-admin-password.js <email> <nouveauMotDePasse>');
  console.error('   Exemple: node scripts/change-admin-password.js admin@monican.com NouveauMotDePasse123');
  process.exit(1);
}

if (newPassword.length < 6) {
  console.error('❌ Le mot de passe doit contenir au moins 6 caractères');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function changePassword() {
  try {
    console.log(`🔐 Changement du mot de passe pour: ${email}\n`);

    // Vérifier que l'utilisateur existe et est un admin
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, email, name, role')
      .eq('email', email)
      .in('role', ['admin', 'super_admin'])
      .single();

    if (profileError || !profile) {
      console.error('❌ Admin non trouvé avec cet email:', email);
      console.error('   Vérifiez que l\'email est correct et que l\'utilisateur est un admin');
      process.exit(1);
    }

    console.log(`✅ Admin trouvé: ${profile.name || profile.email}`);
    console.log(`   Rôle: ${profile.role}\n`);

    // Changer le mot de passe
    const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(
      profile.id,
      {
        password: newPassword,
      }
    );

    if (updateError) {
      console.error('❌ Erreur lors de la mise à jour du mot de passe:', updateError.message);
      process.exit(1);
    }

    console.log('✅ Mot de passe mis à jour avec succès!');
    console.log(`   Email: ${profile.email}`);
    console.log(`   ID: ${profile.id}\n`);
    console.log('💡 Le mot de passe a été changé. Vous pouvez maintenant vous connecter.');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

changePassword();

