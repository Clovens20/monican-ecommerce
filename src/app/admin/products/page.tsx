// CHEMIN: src/app/admin/products/page.tsx
// ACTION: REMPLACER TOUT LE CONTENU

'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import styles from './products.module.css';
import { filterVariantsByCategory } from '@/lib/product-utils';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  images: Array<{ url: string; alt?: string }>;
  isNew: boolean;
  isFeatured: boolean;
  isActive: boolean;
  variants?: Array<{ size: string; stock: number; sku: string }>;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [updatingProducts, setUpdatingProducts] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function fetchProducts() {
      try {
        const response = await fetch('/api/admin/products');
        const data = await response.json();
        
        if (data.success) {
          setProducts(data.products);
        } else {
          setError(data.error || 'Erreur lors du chargement des produits');
        }
      } catch (err) {
        console.error('Error fetching products:', err);
        setError('Erreur de connexion au serveur');
      } finally {
        setLoading(false);
      }
    }
    
    fetchProducts();
  }, []);

  const categories = ['all', 'jeans', 'maillot', 'chemise', 'tennis'];
  
  const filteredProducts = products.filter(product => {
    const matchesCategory = filter === 'all' || product.category === filter;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesActiveFilter = showInactive ? true : (product.isActive !== false);
    return matchesCategory && matchesSearch && matchesActiveFilter;
  });

  const handleToggleActive = async (productId: string, currentStatus: boolean) => {
    try {
      setUpdatingProducts(prev => new Set(prev).add(productId));
      
      const response = await fetch(`/api/admin/products/${productId}/toggle-active`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      const data = await response.json();

      if (data.success) {
        // Mettre à jour l'état local
        setProducts(prevProducts =>
          prevProducts.map(p =>
            p.id === productId ? { ...p, isActive: !currentStatus } : p
          )
        );
      } else {
        alert(data.error || 'Erreur lors de la mise à jour');
      }
    } catch (err) {
      console.error('Error toggling product status:', err);
      alert('Erreur de connexion au serveur');
    } finally {
      setUpdatingProducts(prev => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });
    }
  };

  if (loading) {
    return (
      <div className={styles.productsPage}>
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
          <p>Chargement des produits...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.productsPage}>
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⚠️</div>
          <p>{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            style={{ marginTop: '1rem', padding: '0.5rem 1rem', background: '#10b981', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer' }}
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

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

        <div className={styles.toggleSection}>
          <label className={styles.toggleLabel}>
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className={styles.toggleCheckbox}
            />
            <span>Afficher les produits désactivés</span>
          </label>
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
            {filteredProducts.reduce((sum, p) => {
              if (p.variants && Array.isArray(p.variants)) {
                return sum + p.variants.reduce((s, v) => s + (v.stock || 0), 0);
              }
              return sum;
            }, 0)}
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
          <div key={product.id} className={`${styles.productCard} ${product.isActive === false ? styles.inactiveProduct : ''}`}>
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
                {product.isNew && <span className={`${styles.badge} ${styles.new}`}>Nouveau</span>}
                {product.isFeatured && <span className={`${styles.badge} ${styles.featured}`}>Vedette</span>}
                {product.variants && Array.isArray(product.variants) && product.variants.reduce((s, v) => s + (v.stock || 0), 0) < 10 && (
                  <span className={`${styles.badge} ${styles.warning}`}>Stock bas</span>
                )}
              </div>
            </div>

            <div className={styles.productInfo}>
              <h3 className={styles.productName}>{product.name}</h3>
              <p className={styles.productDescription}>{product.description}</p>

              <div className={styles.productMeta}>
                <div className={styles.productPrice}>
                  {new Intl.NumberFormat('fr-FR', {
                    style: 'currency',
                    currency: 'USD'
                  }).format(product.price)}
                </div>
                <div className={styles.productStock}>
                  {product.variants && Array.isArray(product.variants) 
                    ? `${product.variants.reduce((s, v) => s + (v.stock || 0), 0)} en stock`
                    : 'Stock non disponible'}
                </div>
              </div>

              {product.variants && Array.isArray(product.variants) && product.variants.length > 0 && (
                <div className={styles.productSizes}>
                  {filterVariantsByCategory(product.variants, product.category).map((v, idx) => (
                    <span key={v.sku || idx} className={styles.sizeTag}>
                      {v.size || 'N/A'}
                    </span>
                  ))}
                </div>
              )}

              <div className={styles.productStatus}>
                <label className={styles.toggleSwitch}>
                  <input
                    type="checkbox"
                    checked={product.isActive !== false}
                    onChange={() => handleToggleActive(product.id, product.isActive !== false)}
                    disabled={updatingProducts.has(product.id)}
                    className={styles.toggleInput}
                  />
                  <span className={`${styles.toggleSlider} ${product.isActive !== false ? styles.active : styles.inactive}`}>
                    <span className={styles.toggleText}>
                      {product.isActive !== false ? 'Actif' : 'Inactif'}
                    </span>
                  </span>
                </label>
                {updatingProducts.has(product.id) && (
                  <span className={styles.updatingIndicator}>⏳</span>
                )}
              </div>

              <div className={styles.productActions}>
                <Link href={`/product/${product.id}`} className={styles.actionBtn}>
                  👁️ Voir
                </Link>
                <Link href={`/admin/products/edit/${product.id}`} className={styles.actionBtn}>
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