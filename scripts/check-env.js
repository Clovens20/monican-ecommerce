/**
 * Script pour vérifier les variables d'environnement
 * Usage: node scripts/check-env.js
 */

require('dotenv').config({ path: '.env.local' });

function validateEnvironmentVariables() {
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
  ];

  const recommended = [
    'STRIPE_SECRET_KEY',
    'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
    'EMAIL_SERVICE',
    'RESEND_API_KEY',
  ];

  const missing = [];
  const warnings = [];

  // Vérifier les variables requises
  for (const varName of required) {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  }

  // Vérifier les variables recommandées
  for (const varName of recommended) {
    if (!process.env[varName]) {
      warnings.push(varName);
    }
  }

  // Vérifications spécifiques
  if (process.env.STRIPE_SECRET_KEY && !process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
    warnings.push('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY (requis si STRIPE_SECRET_KEY est configuré)');
  }

  if (process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY && !process.env.STRIPE_SECRET_KEY) {
    warnings.push('STRIPE_SECRET_KEY (requis si NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY est configuré)');
  }

  if (process.env.EMAIL_SERVICE === 'resend' && !process.env.RESEND_API_KEY) {
    warnings.push('RESEND_API_KEY (requis si EMAIL_SERVICE=resend)');
  }

  if (process.env.EMAIL_SERVICE === 'sendgrid' && !process.env.SENDGRID_API_KEY) {
    warnings.push('SENDGRID_API_KEY (requis si EMAIL_SERVICE=sendgrid)');
  }

  return {
    valid: missing.length === 0,
    missing,
    warnings,
  };
}

const result = validateEnvironmentVariables();

if (result.missing.length > 0) {
  console.error('❌ Variables d\'environnement manquantes (REQUISES):');
  result.missing.forEach((varName) => {
    console.error(`   - ${varName}`);
  });
  console.error('\n💡 Copiez env.example vers .env.local et remplissez les valeurs');
  process.exit(1);
}

if (result.warnings.length > 0) {
  console.warn('⚠️  Variables d\'environnement manquantes (RECOMMANDÉES):');
  result.warnings.forEach((varName) => {
    console.warn(`   - ${varName}`);
  });
  console.warn('\n💡 Ces variables sont recommandées pour un fonctionnement optimal');
}

if (result.valid && result.warnings.length === 0) {
  console.log('✅ Toutes les variables d\'environnement sont configurées');
  process.exit(0);
}

process.exit(0);

