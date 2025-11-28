const { Pool } = require('pg');
require('dotenv').config({ path: '.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function resetProducts() {
  try {
    await pool.query('DROP TABLE IF EXISTS products CASCADE');
    console.log('✓ Table products supprimée');

    await pool.query(`
      CREATE TABLE products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10, 2) NOT NULL,
        image_url TEXT,
        category VARCHAR(100),
        stock INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Table products créée');

    await pool.query('CREATE INDEX idx_products_category ON products(category)');
    await pool.query('CREATE INDEX idx_products_is_active ON products(is_active)');
    console.log('✓ Index créés');

    console.log('\n✅ Reset terminé avec succès !');
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await pool.end();
  }
}

resetProducts();