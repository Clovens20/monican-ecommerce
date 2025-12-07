'use client';

import { useState, useEffect } from 'react';
import { Product } from '@/lib/types';
import ProductCard from '@/components/product/ProductCard';
import { useLanguage } from '@/contexts/LanguageContext';
import styles from './page.module.css';

type SortOption = 'newest' | 'price-asc' | 'price-desc' | 'popular';
type Category = 'all' | 'tennis' | 'chemises' | 'jeans' | 'maillots' | 'accessoires' | 'chaussures';

export default function CatalogPage() {
  const { t } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState<Category>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Charger les produits depuis l'API
  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true);
        setError(null);
        
        const url = selectedCategory === 'all' 
          ? '/api/products'
          : `/api/products?category=${selectedCategory}`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error('Erreur lors du chargement des produits');
        }
        
        const data = await response.json();
        setProducts(data.products || []);
      } catch (err) {
        console.error('Error fetching products:', err);
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, [selectedCategory]);

  // Sort products
  const sortedProducts = [...products].sort((a, b) => {
    switch (sortBy) {
      case 'price-asc':
        return a.price - b.price;
      case 'price-desc':
        return b.price - a.price;
      case 'popular':
        return (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0);
      case 'newest':
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  // Charger les catégories actives depuis l'API
  const [activeCategories, setActiveCategories] = useState<Array<{slug: string, name_key: string, icon: string | null}>>([]);
  useEffect(() => {
    async function fetchActiveCategories() {
      try {
        const response = await fetch('/api/categories');
        if (response.ok) {
          const data = await response.json();
          setActiveCategories(data.categories || []);
        }
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    }
    fetchActiveCategories();

    // Écouter les mises à jour
    const handleCategoriesUpdate = () => {
      fetchActiveCategories();
    };
    window.addEventListener('categories-updated', handleCategoriesUpdate);
    return () => {
      window.removeEventListener('categories-updated', handleCategoriesUpdate);
    };
  }, []);

  // Calculer les compteurs par catégorie (seulement pour les catégories actives)
  const categoryCounts = {
    all: products.length,
    tennis: products.filter(p => p.category === 'tennis').length,
    chemises: products.filter(p => p.category === 'chemises').length,
    jeans: products.filter(p => p.category === 'jeans').length,
    maillots: products.filter(p => p.category === 'maillots').length,
    accessoires: products.filter(p => p.category === 'accessoires').length,
    chaussures: products.filter(p => p.category === 'chaussures').length,
  };

  // Créer la liste des catégories avec seulement les actives
  const categories = [
    { id: 'all', nameKey: 'all', icon: '🏪', count: categoryCounts.all },
    ...activeCategories.map(cat => ({
      id: cat.slug,
      nameKey: cat.name_key,
      icon: cat.icon || '📦',
      count: categoryCounts[cat.slug as keyof typeof categoryCounts] || 0,
    })),
  ];

  // Charger tous les produits pour les stats (une seule fois)
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  useEffect(() => {
    async function fetchAllProducts() {
      try {
        const response = await fetch('/api/products');
        if (response.ok) {
          const data = await response.json();
          setAllProducts(data.products || []);
        }
      } catch (err) {
        console.error('Error fetching all products for stats:', err);
      }
    }
    fetchAllProducts();
  }, []);

  return (
    <div className={styles.page}>
      {/* Hero Section */}
      <div className={styles.hero}>
        <div className="container">
          <div className={styles.heroContent}>
            <h1 className={styles.heroTitle}>
              {t('collectionTitle')}
              <span className={styles.heroAccent}>{t('collectionExclusive')}</span>
            </h1>
            <p className={styles.heroSubtitle}>
              {t('catalogSubtitle')}
            </p>
            <div className={styles.heroStats}>
              <div className={styles.statItem}>
                <span className={styles.statNumber}>{allProducts.length}+</span>
                <span className={styles.statLabel}>{t('products')}</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statNumber}>{categories.filter(c => c.id !== 'all' && c.count > 0).length}</span>
                <span className={styles.statLabel}>{t('categories')}</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statNumber}>⭐ 4.8</span>
                <span className={styles.statLabel}>{t('customerReviews')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container">
        {/* Category Filter Pills */}
        <div className={styles.categorySection}>
          <div className={styles.categoryPills}>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id as Category)}
                className={`${styles.categoryPill} ${selectedCategory === cat.id ? styles.active : ''}`}
              >
                <span className={styles.categoryIcon}>{cat.icon}</span>
                <span className={styles.categoryName}>{t(cat.nameKey)}</span>
                <span className={styles.categoryCount}>{cat.count}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Toolbar */}
        <div className={styles.toolbar}>
          <div className={styles.toolbarLeft}>
            <h2 className={styles.resultsTitle}>
              {loading ? '...' : sortedProducts.length} {sortedProducts.length > 1 ? t('productsFound') : t('productFound')}
              {selectedCategory !== 'all' && (
                <span className={styles.categoryLabel}>
                  {t('inCategory')} {t(categories.find(c => c.id === selectedCategory)?.nameKey || 'all')}
                </span>
              )}
            </h2>
          </div>

          <div className={styles.toolbarRight}>
            {/* View Toggle */}
            <div className={styles.viewToggle}>
              <button
                onClick={() => setViewMode('grid')}
                className={`${styles.viewBtn} ${viewMode === 'grid' ? styles.active : ''}`}
                title={t('gridView')}
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <rect x="2" y="2" width="7" height="7" rx="1" fill="currentColor"/>
                  <rect x="11" y="2" width="7" height="7" rx="1" fill="currentColor"/>
                  <rect x="2" y="11" width="7" height="7" rx="1" fill="currentColor"/>
                  <rect x="11" y="11" width="7" height="7" rx="1" fill="currentColor"/>
                </svg>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`${styles.viewBtn} ${viewMode === 'list' ? styles.active : ''}`}
                title={t('listView')}
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <rect x="2" y="3" width="16" height="2" rx="1" fill="currentColor"/>
                  <rect x="2" y="9" width="16" height="2" rx="1" fill="currentColor"/>
                  <rect x="2" y="15" width="16" height="2" rx="1" fill="currentColor"/>
                </svg>
              </button>
            </div>

            {/* Sort Select */}
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className={styles.sortSelect}
            >
              <option value="newest">{t('newest')}</option>
              <option value="popular">{t('popular')}</option>
              <option value="price-asc">{t('priceAscending')}</option>
              <option value="price-desc">{t('priceDescending')}</option>
            </select>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className={styles.loadingState}>
            <div className={styles.loadingSpinner}></div>
            <p>{t('loading')}...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className={styles.errorState}>
            <div className={styles.errorIcon}>⚠️</div>
            <h3 className={styles.errorTitle}>{t('error')}</h3>
            <p className={styles.errorText}>{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className={styles.errorBtn}
            >
              {t('retry')}
            </button>
          </div>
        )}

        {/* Products Grid */}
        {!loading && !error && (
          <div className={`${styles.productsGrid} ${viewMode === 'list' ? styles.listView : ''}`}>
            {sortedProducts.map((product) => (
              <ProductCard key={product.id} product={product} viewMode={viewMode} />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && sortedProducts.length === 0 && (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>🔍</div>
            <h3 className={styles.emptyTitle}>{t('noProductsFound')}</h3>
            <p className={styles.emptyText}>
              {t('tryAnotherCategory')}
            </p>
            <button 
              onClick={() => setSelectedCategory('all')}
              className={styles.emptyBtn}
            >
              {t('viewAll')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
