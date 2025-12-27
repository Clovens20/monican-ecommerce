#!/usr/bin/env node

/**
 * Script de vérification de la configuration Vercel
 * Vérifie que toutes les variables d'environnement requises sont présentes
 * et affiche un guide pour les configurer dans Vercel
 */

require('dotenv').config({ path: '.env.local' });

const requiredVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
];

const recommendedVars = [
  'STRIPE_SECRET_KEY',
  'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
  'EMAIL_SERVICE',
  'RESEND_API_KEY',
  'NEXT_PUBLIC_APP_URL',
  'JWT_SECRET',
];

console.log('🔍 Vérification de la configuration pour Vercel...\n');

// Vérifier les variables requises
const missing = [];
const present = [];
const warnings = [];

for (const varName of requiredVars) {
  const value = process.env[varName];
  if (!value || value.includes('placeholder') || value.includes('your-')) {
    missing.push(varName);
  } else {
    present.push(varName);
  }
}

// Vérifier les variables recommandées
for (const varName of recommendedVars) {
  const value = process.env[varName];
  if (!value || value.includes('placeholder') || value.includes('your-')) {
    warnings.push(varName);
  }
}

// Afficher les résultats
console.log('📊 RÉSULTATS :\n');

if (present.length > 0) {
  console.log('✅ Variables configurées :');
  present.forEach(varName => {
    const value = process.env[varName];
    const displayValue = varName.includes('KEY') || varName.includes('SECRET')
      ? `${value.substring(0, 20)}... (${value.length} caractères)`
      : value;
    console.log(`   ✓ ${varName} = ${displayValue}`);
  });
  console.log('');
}

if (missing.length > 0) {
  console.log('❌ Variables MANQUANTES (OBLIGATOIRES) :');
  missing.forEach(varName => {
    console.log(`   ✗ ${varName}`);
  });
  console.log('');
}

if (warnings.length > 0) {
  console.log('⚠️  Variables manquantes (RECOMMANDÉES) :');
  warnings.forEach(varName => {
    console.log(`   ⚠ ${varName}`);
  });
  console.log('');
}

// Instructions pour Vercel
if (missing.length > 0) {
  console.log('📋 INSTRUCTIONS POUR CONFIGURER DANS VERCEL :\n');
  console.log('1. Allez sur https://vercel.com/dashboard');
  console.log('2. Sélectionnez votre projet "monican-ecommerce"');
  console.log('3. Allez dans Settings → Environment Variables');
  console.log('4. Ajoutez les variables suivantes pour TOUS les environnements :\n');
  
  missing.forEach(varName => {
    console.log(`   ${varName}`);
    if (varName === 'NEXT_PUBLIC_SUPABASE_URL') {
      console.log('      → Récupérez depuis Supabase : Settings → API → Project URL');
    } else if (varName === 'NEXT_PUBLIC_SUPABASE_ANON_KEY') {
      console.log('      → Récupérez depuis Supabase : Settings → API → anon public key');
    } else if (varName === 'SUPABASE_SERVICE_ROLE_KEY') {
      console.log('      → Récupérez depuis Supabase : Settings → API → service_role key (SECRET)');
    }
    console.log('');
  });
  
  console.log('5. Après avoir ajouté les variables, redéployez :');
  console.log('   - Allez dans Deployments');
  console.log('   - Cliquez sur les 3 points (⋯) du dernier déploiement');
  console.log('   - Cliquez sur "Redeploy"');
  console.log('');
}

// Résumé final
if (missing.length === 0 && warnings.length === 0) {
  console.log('✅ Toutes les variables sont configurées !');
  console.log('💡 N\'oubliez pas de les configurer aussi dans Vercel (Settings → Environment Variables)');
  process.exit(0);
} else if (missing.length === 0) {
  console.log('✅ Toutes les variables OBLIGATOIRES sont configurées !');
  console.log('⚠️  Certaines variables recommandées manquent, mais le déploiement devrait fonctionner.');
  process.exit(0);
} else {
  console.log('❌ Des variables OBLIGATOIRES manquent !');
  console.log('⚠️  Le déploiement Vercel échouera sans ces variables.');
  console.log('\n💡 Consultez DIAGNOSTIC-VERCEL-DEPLOY.md pour plus de détails.');
  process.exit(1);
}

