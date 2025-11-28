// CHEMIN: src/app/admin/products/page.tsx
// ACTION: REMPLACER TOUT LE CONTENU

'use client';

import Link from 'next/link';
import { useState } from 'react';
import { mockProducts } from '@/lib/products';
import styles from './products.module.css';

export default function ProductsPage() {
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = ['all', 'jeans', 'maillot', 'chemise', 'tennis'];
  
  const filteredProducts = mockProducts.filter(product => {
    const matchesCategory = filter === 'all' || product.category === filter;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className={styles.productsPage}>
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Produits</h1>
          <p className={styles.pageSubtitle}>Gérez votre catalogue de produits</p>
        </div>
        <div className={styles.headerActions}>
          <Link href="/admin/products/import" className={styles.btnSecondary}>
            📥 Importer CSV
          </Link>
          <Link href="/admin/products/new" className={styles.btnPrimary}>
            ➕ Nouveau produit
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        <div className={styles.searchBox}>
          <span className={styles.searchIcon}>🔍</span>
          <input
            type="search"
            placeholder="Rechercher un produit..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <div className={styles.categoryFilters}>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`${styles.filterBtn} ${filter === cat ? styles.active : ''}`}
            >
              {cat === 'all' ? 'Tous' : cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Bar */}
      <div className={styles.statsBar}>
        <div className={styles.stat}>
          <span className={styles.statValue}>{filteredProducts.length}</span>
          <span className={styles.statLabel}>Produits</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statValue}>
            {filteredProducts.reduce((sum, p) => sum + p.variants.reduce((s, v) => s + v.stock, 0), 0)}
          </span>
          <span className={styles.statLabel}>En stock</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statValue}>4</span>
          <span className={styles.statLabel}>Catégories</span>
        </div>
      </div>

      {/* Products Grid */}
      <div className={styles.productsGrid}>
        {filteredProducts.map(product => (
          <div key={product.id} className={styles.productCard}>
            <div className={styles.productImage}>
              <div className={styles.imagePlaceholder}>
                {product.images && product.images.length > 0 ? (
                  <img src={product.images[0].url} alt={product.images[0].alt || product.name} />
                ) : (
                  <span className={styles.noImage}>📷</span>
                )}
              </div>
              <div className={styles.productBadges}>
                <span className={styles.badge}>{product.category}</span>
                {product.variants.reduce((s, v) => s + v.stock, 0) < 10 && (
                  <span className={`${styles.badge} ${styles.warning}`}>Stock bas</span>
                )}
              </div>
            </div>

            <div className={styles.productInfo}>
              <h3 className={styles.productName}>{product.name}</h3>
              <p className={styles.productDescription}>{product.description}</p>

              <div className={styles.productMeta}>
                <div className={styles.productPrice}>${product.price}</div>
                <div className={styles.productStock}>
                  {product.variants.reduce((s, v) => s + v.stock, 0)} en stock
                </div>
              </div>

              <div className={styles.productSizes}>
                {product.variants.map(v => (
                  <span key={v.sku} className={styles.sizeTag}>
                    {v.size}
                  </span>
                ))}
              </div>

              <div className={styles.productActions}>
                <Link href={`/product/${product.id}`} className={styles.actionBtn}>
                  👁️ Voir
                </Link>
                <Link href={`/admin/products/${product.id}`} className={styles.actionBtn}>
                  ✏️ Modifier
                </Link>
                <button className={`${styles.actionBtn} ${styles.danger}`}>
                  🗑️ Supprimer
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>📦</div>
          <h3 className={styles.emptyTitle}>Aucun produit trouvé</h3>
          <p className={styles.emptyText}>
            {searchQuery 
              ? `Aucun produit ne correspond à "${searchQuery}"`
              : 'Commencez par ajouter votre premier produit'}
          </p>
          <Link href="/admin/products/new" className={styles.btnPrimary}>
            ➕ Ajouter un produit
          </Link>
        </div>
      )}
    </div>
  );
}