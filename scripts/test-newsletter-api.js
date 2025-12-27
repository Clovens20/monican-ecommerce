// Script de test pour l'API newsletter
// Usage: node scripts/test-newsletter-api.js

const testEmail = process.argv[2] || 'test@example.com';

async function testNewsletterAPI() {
  console.log('🧪 Test de l\'API Newsletter\n');
  console.log('Email de test:', testEmail);
  console.log('URL:', 'http://localhost:3000/api/newsletter/subscribe');
  console.log('\n---\n');

  try {
    const response = await fetch('http://localhost:3000/api/newsletter/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: testEmail }),
    });

    const data = await response.json();

    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));

    if (response.ok && data.success) {
      console.log('\n✅ Succès !');
    } else {
      console.log('\n❌ Erreur détectée');
      if (data.debug) {
        console.log('Debug info:', data.debug);
      }
    }
  } catch (error) {
    console.error('❌ Erreur de connexion:', error.message);
    console.error('\nAssurez-vous que le serveur de développement est démarré (npm run dev)');
  }
}

testNewsletterAPI();

