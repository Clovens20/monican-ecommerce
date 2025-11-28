// CHEMIN: src/app/catalog/page.tsx
// ACTION: REMPLACER TOUT LE CONTENU

'use client';

import { useState } from 'react';
import { mockProducts } from '@/lib/products';
import ProductCard from '@/components/product/ProductCard';
import { useLanguage } from '@/contexts/LanguageContext';
import styles from './page.module.css';

type SortOption = 'newest' | 'price-asc' | 'price-desc' | 'popular';
type Category = 'all' | 'tennis' | 'chemises' | 'jeans' | 'maillots';

export default function CatalogPage() {
  const { t } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState<Category>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Filter products
  const filteredProducts = mockProducts.filter(product => 
    selectedCategory === 'all' || product.category === selectedCategory
  );

  // Sort products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
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

  const categories = [
    { id: 'all', nameKey: 'all', icon: '🏪', count: mockProducts.length },
    { id: 'tennis', nameKey: 'tennis', icon: '👟', count: mockProducts.filter(p => p.category === 'tennis').length },
    { id: 'chemises', nameKey: 'shirts', icon: '👔', count: mockProducts.filter(p => p.category === 'chemises').length },
    { id: 'jeans', nameKey: 'jeans', icon: '👖', count: mockProducts.filter(p => p.category === 'jeans').length },
    { id: 'maillots', nameKey: 'jerseys', icon: '👕', count: mockProducts.filter(p => p.category === 'maillots').length },
  ];

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
                <span className={styles.statNumber}>{mockProducts.length}+</span>
                <span className={styles.statLabel}>{t('products')}</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statNumber}>4</span>
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
              {filteredProducts.length} {filteredProducts.length > 1 ? t('productsFound') : t('productFound')}
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

        {/* Products Grid */}
        <div className={`${styles.productsGrid} ${viewMode === 'list' ? styles.listView : ''}`}>
          {sortedProducts.map((product) => (
            <ProductCard key={product.id} product={product} viewMode={viewMode} />
          ))}
        </div>

        {/* Empty State */}
        {filteredProducts.length === 0 && (
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