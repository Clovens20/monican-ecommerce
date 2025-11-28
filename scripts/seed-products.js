// ============================================================================
// SCRIPT DE SEED - Produits fictifs avec images pour test
// ============================================================================
// Ce script insère des produits fictifs dans Supabase pour tester les sections
// "Meilleures Ventes" et "Produits Vedettes"

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Erreur: Variables d\'environnement Supabase manquantes');
  console.error('Assurez-vous d\'avoir un fichier .env.local avec:');
  console.error('- NEXT_PUBLIC_SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Produits fictifs avec images
const products = [
  {
    name: 'Tennis Urban Runner',
    description: 'Tennis confortables pour la ville. Design moderne et respirant.',
    detailed_description: 'Les Tennis Urban Runner sont conçues pour allier style et confort au quotidien. Leur design épuré et moderne s\'adapte à toutes vos tenues urbaines.',
    price: 89.99,
    category: 'tennis',
    brand: 'Monican',
    images: [
      { id: 'img-1-1', url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800', alt: 'Tennis Urban Runner - Vue principale', isPrimary: true },
      { id: 'img-1-2', url: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800', alt: 'Tennis Urban Runner - Vue côté', isPrimary: false },
    ],
    variants: [
      { size: '40', stock: 15, sku: 'TUR-40' },
      { size: '41', stock: 23, sku: 'TUR-41' },
      { size: '42', stock: 18, sku: 'TUR-42' },
      { size: '43', stock: 12, sku: 'TUR-43' },
    ],
    features: [
      { name: 'Matériau', value: 'Mesh respirant et synthétique' },
      { name: 'Semelle', value: 'Caoutchouc antidérapant' },
    ],
    colors: ['Noir', 'Blanc'],
    is_new: true,
    is_featured: true,
  },
  {
    name: 'Chemise Oxford Blue',
    description: 'Chemise classique en coton premium. Coupe ajustée.',
    detailed_description: 'Notre chemise Oxford Blue est un incontournable de la garde-robe masculine. Fabriquée en coton 100% premium.',
    price: 45.00,
    category: 'chemises',
    brand: 'Monican',
    images: [
      { id: 'img-2-1', url: 'https://images.unsplash.com/photo-1594938291221-94f18a24443c?w=800', alt: 'Chemise Oxford Blue', isPrimary: true },
    ],
    variants: [
      { size: 'S', stock: 20, sku: 'OXF-S' },
      { size: 'M', stock: 35, sku: 'OXF-M' },
      { size: 'L', stock: 28, sku: 'OXF-L' },
    ],
    features: [
      { name: 'Matériau', value: '100% Coton Premium' },
      { name: 'Coupe', value: 'Ajustée (Slim Fit)' },
    ],
    colors: ['Bleu'],
    is_new: false,
    is_featured: true,
  },
  {
    name: 'Jeans Slim Fit Indigo',
    description: 'Jeans denim durable avec une coupe moderne.',
    detailed_description: 'Ce jean slim fit en denim indigo de qualité supérieure combine style contemporain et confort.',
    price: 59.50,
    category: 'jeans',
    brand: 'Monican',
    images: [
      { id: 'img-3-1', url: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=800', alt: 'Jeans Slim Fit', isPrimary: true },
    ],
    variants: [
      { size: '30', stock: 12, sku: 'JSF-30' },
      { size: '32', stock: 25, sku: 'JSF-32' },
      { size: '34', stock: 30, sku: 'JSF-34' },
    ],
    features: [
      { name: 'Matériau', value: '98% Coton, 2% Élasthanne' },
      { name: 'Coupe', value: 'Slim Fit' },
    ],
    colors: ['Indigo'],
    is_new: false,
    is_featured: true,
  },
  {
    name: 'Maillot Sport Pro',
    description: 'Maillot technique pour le sport intensif.',
    detailed_description: 'Le Maillot Sport Pro est conçu pour les athlètes exigeants. Sa technologie d\'évacuation de l\'humidité vous garde au sec.',
    price: 29.99,
    category: 'maillots',
    brand: 'Monican',
    images: [
      { id: 'img-4-1', url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800', alt: 'Maillot Sport Pro', isPrimary: true },
    ],
    variants: [
      { size: 'M', stock: 40, sku: 'MSP-M' },
      { size: 'L', stock: 35, sku: 'MSP-L' },
      { size: 'XL', stock: 25, sku: 'MSP-XL' },
    ],
    features: [
      { name: 'Matériau', value: '100% Polyester technique' },
      { name: 'Technologie', value: 'Évacuation de l\'humidité' },
    ],
    colors: ['Noir', 'Rouge'],
    is_new: true,
    is_featured: false,
  },
  {
    name: 'Baskets Running Pro',
    description: 'Chaussures de running haute performance avec amorti supérieur.',
    detailed_description: 'Les Baskets Running Pro sont conçues pour les coureurs sérieux. Dotées d\'un système d\'amorti avancé.',
    price: 119.99,
    category: 'tennis',
    brand: 'Monican',
    images: [
      { id: 'img-5-1', url: 'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=800', alt: 'Baskets Running Pro', isPrimary: true },
    ],
    variants: [
      { size: '40', stock: 10, sku: 'BRP-40' },
      { size: '41', stock: 15, sku: 'BRP-41' },
      { size: '42', stock: 20, sku: 'BRP-42' },
    ],
    features: [
      { name: 'Matériau', value: 'Mesh technique et synthétique' },
      { name: 'Amorti', value: 'Technologie CloudFoam' },
    ],
    colors: ['Noir', 'Blanc'],
    is_new: true,
    is_featured: true,
  },
  {
    name: 'Chemise Lin Blanc',
    description: 'Chemise en lin naturel, parfaite pour l\'été.',
    detailed_description: 'Cette chemise en lin 100% naturel est l\'incarnation de l\'élégance décontractée.',
    price: 52.00,
    category: 'chemises',
    brand: 'Monican',
    images: [
      { id: 'img-6-1', url: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800', alt: 'Chemise Lin Blanc', isPrimary: true },
    ],
    variants: [
      { size: 'S', stock: 15, sku: 'CLB-S' },
      { size: 'M', stock: 25, sku: 'CLB-M' },
      { size: 'L', stock: 20, sku: 'CLB-L' },
    ],
    features: [
      { name: 'Matériau', value: '100% Lin naturel' },
      { name: 'Coupe', value: 'Regular Fit' },
    ],
    colors: ['Blanc'],
    is_new: false,
    is_featured: false,
  },
  {
    name: 'Jean Cargo Noir',
    description: 'Jean cargo style urbain avec poches multiples.',
    detailed_description: 'Le Jean Cargo Noir combine fonctionnalité et style urbain.',
    price: 69.99,
    category: 'jeans',
    brand: 'Monican',
    images: [
      { id: 'img-7-1', url: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=800', alt: 'Jean Cargo Noir', isPrimary: true },
    ],
    variants: [
      { size: '30', stock: 8, sku: 'JCN-30' },
      { size: '32', stock: 18, sku: 'JCN-32' },
      { size: '34', stock: 22, sku: 'JCN-34' },
    ],
    features: [
      { name: 'Matériau', value: '100% Coton denim' },
      { name: 'Poches', value: '8 poches dont 4 cargo' },
    ],
    colors: ['Noir'],
    is_new: true,
    is_featured: false,
  },
  {
    name: 'T-Shirt Performance',
    description: 'T-shirt technique respirant pour l\'entraînement.',
    detailed_description: 'Ce t-shirt de performance est conçu pour vous accompagner dans tous vos entraînements.',
    price: 24.99,
    category: 'maillots',
    brand: 'Monican',
    images: [
      { id: 'img-8-1', url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800', alt: 'T-Shirt Performance', isPrimary: true },
    ],
    variants: [
      { size: 'S', stock: 30, sku: 'TSP-S' },
      { size: 'M', stock: 45, sku: 'TSP-M' },
      { size: 'L', stock: 40, sku: 'TSP-L' },
    ],
    features: [
      { name: 'Matériau', value: '92% Polyester, 8% Élasthanne' },
      { name: 'Technologie', value: 'Quick-Dry' },
    ],
    colors: ['Gris'],
    is_new: false,
    is_featured: false,
  },
  {
    name: 'Sneakers Classic White',
    description: 'Sneakers blanches intemporelles, style minimaliste.',
    detailed_description: 'Les Sneakers Classic White sont l\'essence du style minimaliste.',
    price: 79.99,
    category: 'tennis',
    brand: 'Monican',
    images: [
      { id: 'img-9-1', url: 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=800', alt: 'Sneakers Classic White', isPrimary: true },
    ],
    variants: [
      { size: '39', stock: 12, sku: 'SCW-39' },
      { size: '40', stock: 20, sku: 'SCW-40' },
      { size: '41', stock: 25, sku: 'SCW-41' },
    ],
    features: [
      { name: 'Matériau', value: 'Cuir synthétique premium' },
      { name: 'Style', value: 'Minimaliste' },
    ],
    colors: ['Blanc'],
    is_new: false,
    is_featured: true,
  },
  {
    name: 'Chemise Carreaux Rouge',
    description: 'Chemise à carreaux style bûcheron moderne.',
    detailed_description: 'Cette chemise à carreaux revisite le classique style bûcheron avec une touche moderne.',
    price: 48.00,
    category: 'chemises',
    brand: 'Monican',
    images: [
      { id: 'img-10-1', url: 'https://images.unsplash.com/photo-1594938291221-94f18a24443c?w=800', alt: 'Chemise Carreaux Rouge', isPrimary: true },
    ],
    variants: [
      { size: 'S', stock: 18, sku: 'CCR-S' },
      { size: 'M', stock: 28, sku: 'CCR-M' },
      { size: 'L', stock: 25, sku: 'CCR-L' },
    ],
    features: [
      { name: 'Matériau', value: '100% Coton flanelle' },
      { name: 'Motif', value: 'Carreaux rouge et noir' },
    ],
    colors: ['Rouge', 'Noir'],
    is_new: false,
    is_featured: false,
  },
];

// Configuration des ventes par produit (index dans le tableau products)
// Format: { productIndex: totalQuantity }
const salesConfig = {
  0: 50, // Tennis Urban Runner - 50 unités
  1: 45, // Chemise Oxford Blue - 45 unités
  2: 40, // Jeans Slim Fit - 40 unités
  3: 35, // Maillot Sport Pro - 35 unités
  4: 30, // Baskets Running Pro - 30 unités
  5: 25, // Chemise Lin Blanc - 25 unités
  6: 20, // Jean Cargo Noir - 20 unités
  7: 15, // T-Shirt Performance - 15 unités
  8: 10, // Sneakers Classic White - 10 unités
};

async function seedProducts() {
  try {
    console.log('🌱 Début de l\'insertion des produits fictifs...\n');

    // 1. Insérer les produits
    const insertedProducts = [];
    for (const product of products) {
      const { data, error } = await supabase
        .from('products')
        .insert({
          name: product.name,
          description: product.description,
          detailed_description: product.detailed_description,
          price: product.price,
          category: product.category,
          brand: product.brand,
          images: product.images,
          variants: product.variants,
          features: product.features,
          colors: product.colors,
          is_new: product.is_new,
          is_featured: product.is_featured,
          is_active: true,
        })
        .select()
        .single();

      if (error) {
        console.error(`❌ Erreur lors de l'insertion de ${product.name}:`, error.message);
      } else {
        console.log(`✅ ${product.name} inséré (ID: ${data.id})`);
        insertedProducts.push(data);
      }
    }

    console.log(`\n✅ ${insertedProducts.length} produits insérés avec succès\n`);

    // 2. Créer les entrées d'inventaire
    console.log('📦 Création des entrées d\'inventaire...\n');
    for (const product of insertedProducts) {
      const productData = products.find(p => p.name === product.name);
      if (!productData) continue;

      for (const variant of productData.variants) {
        const { error } = await supabase
          .from('inventory')
          .insert({
            product_id: product.id,
            size: variant.size,
            sku: variant.sku,
            stock_quantity: variant.stock,
            reserved_quantity: 0,
            low_stock_threshold: 10,
          });

        if (error) {
          console.error(`❌ Erreur inventaire pour ${product.name} - ${variant.size}:`, error.message);
        }
      }
    }
    console.log('✅ Inventaire créé\n');

    // 3. Créer des commandes fictives pour générer des ventes
    console.log('🛒 Création de commandes fictives pour générer des ventes...\n');
    
    let orderCounter = 1;
    let totalOrders = 0;

    // Créer des commandes pour chaque produit selon salesConfig
    for (const [productIndexStr, totalQuantity] of Object.entries(salesConfig)) {
      const productIndex = parseInt(productIndexStr);
      const product = insertedProducts[productIndex];
      
      if (!product) {
        console.warn(`⚠️ Produit à l'index ${productIndex} non trouvé`);
        continue;
      }

      // Créer plusieurs commandes pour atteindre la quantité totale
      // Diviser en commandes de 5-10 unités pour plus de réalisme
      let remainingQuantity = totalQuantity;
      const ordersPerProduct = Math.ceil(totalQuantity / 10); // ~10 unités par commande

      for (let i = 0; i < ordersPerProduct && remainingQuantity > 0; i++) {
        const quantity = Math.min(remainingQuantity, 10);
        remainingQuantity -= quantity;

        const orderNumber = `ORD-${String(orderCounter).padStart(3, '0')}`;
        
        // Créer une commande
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .insert({
            order_number: orderNumber,
            customer_id: null, // Guest checkout
            customer_name: `Client Test ${orderCounter}`,
            customer_email: `client${orderCounter}@test.com`,
            customer_phone: `+1 555 ${String(orderCounter).padStart(4, '0')}`,
            shipping_address: {
              street: `${orderCounter} Rue Test`,
              city: 'Montréal',
              state: 'QC',
              zip: 'H1A 1A1',
              country: 'CA',
            },
            items: [{
              id: `${product.id}-M-${orderCounter}`,
              productId: product.id,
              name: product.name,
              quantity: quantity,
              price: product.price,
              size: 'M',
              image: product.images?.[0]?.url || '',
            }],
            status: 'delivered',
            status_history: [{
              status: 'delivered',
              timestamp: new Date().toISOString(),
              note: 'Commande de test',
            }],
            subtotal: product.price * quantity,
            shipping_cost: 10.00,
            tax: (product.price * quantity) * 0.15,
            total: (product.price * quantity) + 10.00 + ((product.price * quantity) * 0.15),
            currency: 'CAD',
            payment_method: 'Square (Test)',
            payment_status: 'completed',
          })
          .select()
          .single();

        if (orderError) {
          console.error(`❌ Erreur commande ${orderNumber}:`, orderError.message);
          continue;
        }

        // Créer les order_items
        const { error: itemsError } = await supabase
          .from('order_items')
          .insert({
            order_id: orderData.id,
            product_id: product.id,
            product_name: product.name,
            quantity: quantity,
            price: product.price,
            size: 'M',
            sku: productData.variants?.[0]?.sku || 'TEST',
            image_url: product.images?.[0]?.url || '',
          });

        if (itemsError) {
          console.error(`❌ Erreur order_items pour ${orderNumber}:`, itemsError.message);
        } else {
          console.log(`✅ Commande ${orderNumber} - ${product.name} x${quantity}`);
          totalOrders++;
        }

        orderCounter++;
      }
    }

    console.log(`\n✅ ${totalOrders} commandes créées avec succès\n`);
    console.log('🎉 Seed terminé avec succès !');
    console.log('\n📊 Résumé des ventes (Top 5):');
    console.log('   Position 1: Tennis Urban Runner (50 unités) → Meilleures Ventes + Produits Vedettes');
    console.log('   Position 2: Chemise Oxford Blue (45 unités) → Meilleures Ventes + Produits Vedettes');
    console.log('   Position 3: Jeans Slim Fit (40 unités) → Meilleures Ventes + Produits Vedettes');
    console.log('   Position 4: Maillot Sport Pro (35 unités) → Meilleures Ventes + Produits Vedettes');
    console.log('   Position 5: Baskets Running Pro (30 unités) → Produits Vedettes');
    console.log('\n🌐 Rechargez la page d\'accueil pour voir les résultats !');

  } catch (error) {
    console.error('❌ Erreur lors du seed:', error);
    process.exit(1);
  }
}

// Exécuter le seed
seedProducts()
  .then(() => {
    console.log('\n✅ Script terminé');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  });

