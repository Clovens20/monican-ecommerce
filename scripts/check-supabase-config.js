// ============================================================================
// SCRIPT DE VÉRIFICATION DE CONFIGURATION SUPABASE
// ============================================================================
// Ce script vérifie que vos clés Supabase sont correctement configurées
// SANS exposer les valeurs réelles des clés

require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const { createClient } = require('@supabase/supabase-js');

console.log('\n' + '='.repeat(80));
console.log('🔍 VÉRIFICATION DE LA CONFIGURATION SUPABASE');
console.log('='.repeat(80) + '\n');

// Récupérer les variables d'environnement
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Vérification 1: Présence des variables
console.log('📋 ÉTAPE 1: Vérification de la présence des variables\n');

const checks = {
    'NEXT_PUBLIC_SUPABASE_URL': {
        present: !!supabaseUrl,
        length: supabaseUrl?.length || 0,
        startsWith: supabaseUrl?.startsWith('https://') ? '✅' : '❌',
        isPlaceholder: supabaseUrl?.includes('placeholder') || false,
        isJWT: supabaseUrl?.startsWith('eyJ') || false, // Détecter si c'est une clé JWT au lieu d'une URL
        isValid: supabaseUrl?.startsWith('https://') && supabaseUrl?.includes('.supabase.co') ? '✅' : '❌',
    },
    'NEXT_PUBLIC_SUPABASE_ANON_KEY': {
        present: !!supabaseAnonKey,
        length: supabaseAnonKey?.length || 0,
        startsWith: supabaseAnonKey?.startsWith('eyJ') ? '✅' : '❌',
        isPlaceholder: supabaseAnonKey?.includes('placeholder') || false,
    },
    'SUPABASE_SERVICE_ROLE_KEY': {
        present: !!supabaseServiceRoleKey,
        length: supabaseServiceRoleKey?.length || 0,
        startsWith: supabaseServiceRoleKey?.startsWith('eyJ') ? '✅' : '❌',
        isPlaceholder: supabaseServiceRoleKey?.includes('placeholder') || false,
    },
};

Object.entries(checks).forEach(([key, check]) => {
    console.log(`  ${key}:`);
    console.log(`    ✓ Présente: ${check.present ? '✅ OUI' : '❌ NON'}`);
    if (check.present) {
        console.log(`    ✓ Longueur: ${check.length} caractères`);
        
        if (key === 'NEXT_PUBLIC_SUPABASE_URL') {
            if (check.isJWT) {
                console.log(`    ❌ ERREUR CRITIQUE: Vous avez mis une clé API au lieu de l'URL!`);
                console.log(`    💡 L'URL doit ressembler à: https://xxxxx.supabase.co`);
                console.log(`    💡 Actuellement vous avez: ${supabaseUrl?.substring(0, 30)}... (c'est une clé JWT)`);
            } else if (!check.startsWith || !supabaseUrl?.includes('.supabase.co')) {
                console.log(`    ❌ Format invalide: doit être une URL https://xxxxx.supabase.co`);
                if (supabaseUrl && supabaseUrl.length < 50) {
                    console.log(`    💡 Valeur actuelle semble trop courte (${check.length} caractères)`);
                    console.log(`    💡 Aperçu: ${supabaseUrl}`);
                }
            } else {
                console.log(`    ✓ Format: ${check.isValid} (URL valide)`);
            }
        } else {
            console.log(`    ✓ Format: ${check.startsWith} (commence par 'eyJ' pour JWT)`);
            if (key === 'SUPABASE_SERVICE_ROLE_KEY' && check.length < 200) {
                console.log(`    ⚠️  ATTENTION: La clé semble courte (${check.length} caractères, normalement 200+)`);
            }
        }
        
        if (check.isPlaceholder) {
            console.log(`    ⚠️  ATTENTION: Valeur placeholder détectée!`);
        }
    }
    console.log('');
});

// Vérification 2: Test de connexion
console.log('🔌 ÉTAPE 2: Test de connexion à Supabase\n');

if (checks['NEXT_PUBLIC_SUPABASE_URL'].isJWT) {
    console.log('❌ ERREUR CRITIQUE: NEXT_PUBLIC_SUPABASE_URL contient une clé API au lieu d\'une URL!\n');
    console.log('💡 CORRECTION:');
    console.log('   1. Allez sur https://app.supabase.com');
    console.log('   2. Sélectionnez votre projet');
    console.log('   3. Allez dans Settings → API');
    console.log('   4. Copiez "Project URL" (ex: https://xxxxx.supabase.co)');
    console.log('   5. Collez-la dans .env.local comme NEXT_PUBLIC_SUPABASE_URL\n');
    process.exit(1);
}

if (!supabaseUrl || !supabaseServiceRoleKey || checks['SUPABASE_SERVICE_ROLE_KEY'].isPlaceholder) {
    console.log('❌ Impossible de tester la connexion: variables manquantes ou invalides\n');
    process.exit(1);
}

async function testConnection() {
    try {
        const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            }
        });

        console.log('  🔄 Tentative de connexion...');
        
        // Test simple: essayer de lire une table
        const { data, error } = await supabase
            .from('products')
            .select('id')
            .limit(1);

        if (error) {
            console.log('  ❌ Erreur de connexion:');
            console.log(`     Message: ${error.message}`);
            console.log(`     Code: ${error.code || 'N/A'}`);
            console.log(`     Détails: ${error.details || 'N/A'}`);
            console.log(`     Hint: ${error.hint || 'N/A'}\n`);
            
            if (error.message?.includes('Invalid API key') || error.message?.includes('JWT')) {
                console.log('  💡 SOLUTION:');
                console.log('     1. Allez sur https://app.supabase.com');
                console.log('     2. Sélectionnez votre projet');
                console.log('     3. Allez dans Settings → API');
                console.log('     4. Copiez la clé "service_role" (pas "anon")');
                console.log('     5. Collez-la dans votre fichier .env.local comme SUPABASE_SERVICE_ROLE_KEY');
                console.log('     6. Redémarrez le serveur (npm run dev)\n');
            } else if (error.message?.includes('relation') || error.message?.includes('does not exist')) {
                console.log('  💡 SOLUTION:');
                console.log('     La table "products" n\'existe pas. Exécutez les migrations SQL dans Supabase.\n');
            }
            
            process.exit(1);
        } else {
            console.log('  ✅ Connexion réussie!');
            console.log('  ✅ La base de données est accessible\n');
            
            // Résumé final
            console.log('='.repeat(80));
            console.log('✅ CONFIGURATION SUPABASE: OK');
            console.log('='.repeat(80));
            console.log('\nVotre configuration Supabase est correcte. Les clients peuvent acheter.\n');
        }
    } catch (err) {
        console.log('  ❌ Exception lors de la connexion:');
        console.log(`     ${err.message}\n`);
        process.exit(1);
    }
}

// Exécuter le test
testConnection().catch(err => {
    console.log('  ❌ Erreur fatale:');
    console.log(`     ${err.message}\n`);
    process.exit(1);
});
