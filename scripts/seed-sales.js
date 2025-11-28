/**
 * Script pour générer des données de ventes de test
 * Crée des commandes et order_items pour tester l'affichage des quantités vendues
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Erreur: Variables d\'environnement Supabase manquantes');
  console.error('Assurez-vous d\'avoir un fichier .env.local avec:');
  console.error('- NEXT_PUBLIC_SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function seedSales() {
  try {
    console.log('🔄 Génération de données de ventes de test...\n');

    // 1. Récupérer tous les produits actifs
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name, price')
      .eq('is_active', true)
      .limit(20);

    if (productsError) {
      console.error('❌ Erreur lors de la récupération des produits:', productsError);
      return;
    }

    if (!products || products.length === 0) {
      console.error('❌ Aucun produit trouvé. Exécutez d\'abord: npm run seed:products');
      return;
    }

    console.log(`✅ ${products.length} produits trouvés\n`);

    // 2. Supprimer les anciennes commandes de test (optionnel)
    console.log('🧹 Nettoyage des anciennes commandes de test...');
    const { data: oldOrders } = await supabase
      .from('orders')
      .select('id')
      .eq('customer_email', 'test@example.com')
      .limit(100);

    if (oldOrders && oldOrders.length > 0) {
      const orderIds = oldOrders.map(o => o.id);
      await supabase.from('order_items').delete().in('order_id', orderIds);
      await supabase.from('orders').delete().in('id', orderIds);
      console.log(`✅ ${oldOrders.length} anciennes commandes supprimées\n`);
    }

    // 3. Créer des commandes de test avec des quantités variées
    const ordersToCreate = [];
    const orderItemsToCreate = [];

    // Créer 10-15 commandes avec des quantités différentes
    const numOrders = Math.min(15, Math.floor(products.length / 2));
    
    for (let i = 0; i < numOrders; i++) {
      const orderNumber = `TEST-${String(i + 1).padStart(3, '0')}`;
      
      // Sélectionner 1-3 produits aléatoires par commande
      const numItems = Math.floor(Math.random() * 3) + 1;
      const selectedProducts = products
        .sort(() => Math.random() - 0.5)
        .slice(0, numItems);

      let subtotal = 0;
      const items = [];

      selectedProducts.forEach((product, idx) => {
        const quantity = Math.floor(Math.random() * 5) + 1; // 1-5 unités
        const price = parseFloat(product.price);
        subtotal += price * quantity;

        items.push({
          id: `${product.id}-M`,
          productId: product.id,
          name: product.name,
          quantity,
          price,
          size: 'M',
          image: '',
        });
      });

      const shippingCost = 5.99;
      const tax = subtotal * 0.1; // 10% de taxe
      const total = subtotal + shippingCost + tax;

      ordersToCreate.push({
        order_number: orderNumber,
        customer_id: null, // Guest checkout
        customer_name: `Client Test ${i + 1}`,
        customer_email: 'test@example.com',
        customer_phone: `+123456789${i}`,
        shipping_address: {
          street: `${i + 1} Rue Test`,
          city: 'Montreal',
          state: 'QC',
          zip: 'H1A 1A1',
          country: 'CA'
        },
        items: items,
        status: 'delivered',
        status_history: [{
          status: 'delivered',
          timestamp: new Date().toISOString(),
          note: 'Commande de test'
        }],
        subtotal: subtotal.toFixed(2),
        shipping_cost: shippingCost,
        tax: tax.toFixed(2),
        total: total.toFixed(2),
        currency: 'CAD',
        payment_method: 'Square',
        payment_id: `test_payment_${i}`,
        payment_status: 'completed',
        created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString() // Derniers 30 jours
      });
    }

    // 4. Insérer les commandes
    console.log(`📦 Création de ${ordersToCreate.length} commandes de test...`);
    const { data: createdOrders, error: ordersError } = await supabase
      .from('orders')
      .insert(ordersToCreate)
      .select('id, order_number');

    if (ordersError) {
      console.error('❌ Erreur lors de la création des commandes:', ordersError);
      return;
    }

    console.log(`✅ ${createdOrders.length} commandes créées\n`);

    // 5. Créer les order_items
    console.log('📋 Création des order_items...');
    
    for (let i = 0; i < createdOrders.length; i++) {
      const order = createdOrders[i];
      const orderData = ordersToCreate[i];

      for (const item of orderData.items) {
        orderItemsToCreate.push({
          order_id: order.id,
          product_id: item.productId,
          product_name: item.name,
          quantity: item.quantity,
          price: item.price,
          size: item.size,
          sku: item.id,
          image_url: item.image,
        });
      }
    }

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItemsToCreate);

    if (itemsError) {
      console.error('❌ Erreur lors de la création des order_items:', itemsError);
      return;
    }

    console.log(`✅ ${orderItemsToCreate.length} order_items créés\n`);

    // 6. Afficher les statistiques
    const { data: salesStats } = await supabase
      .from('order_items')
      .select('product_id, quantity');

    if (salesStats) {
      const productSales = {};
      salesStats.forEach(item => {
        productSales[item.product_id] = (productSales[item.product_id] || 0) + item.quantity;
      });

      const topProducts = Object.entries(productSales)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10);

      console.log('📊 Top 10 produits les plus vendus:');
      for (const [productId, quantity] of topProducts) {
        const product = products.find(p => p.id === productId);
        console.log(`   - ${product?.name || productId}: ${quantity} unité(s)`);
      }
    }

    console.log('\n✅ Données de ventes de test créées avec succès!');
    console.log('💡 Les quantités vendues devraient maintenant s\'afficher sur la page d\'accueil.\n');

  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

seedSales();

