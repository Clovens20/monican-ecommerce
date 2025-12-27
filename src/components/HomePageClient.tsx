'use client';

import ProductCard from "@/components/product/ProductCard";
import AnimatedSection from "@/components/ui/AnimatedSection";
import { useLanguage } from "@/contexts/LanguageContext";
import { Product } from "@/lib/types";
import styles from '../app/page.module.css';

interface HomePageClientProps {
  bestSellers: Product[];
  featuredProductsWithSales: Array<Product & { salesCount: number }>;
}

export default function HomePageClient({
  bestSellers,
  featuredProductsWithSales,
}: HomePageClientProps) {
  const { t } = useLanguage();

  const renderProducts = (
    products: Array<Product & { salesCount?: number }>,
    sales: boolean = false
  ) => {
    if (!products.length) {
      return (
        <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '2rem' }}>
          <p>{t('noProductsAvailable')}</p>
          <p style={{ fontSize: '0.9rem', color: '#666', marginTop: '0.5rem' }}>
            {t('checkBackSoon')}
          </p>
        </div>
      );
    }

    return products.map((product, index) => (
      <AnimatedSection key={product.id} delay={index * 100} direction="up">
        <ProductCard product={product} salesCount={sales ? product.salesCount : undefined} />
      </AnimatedSection>
    ));
  };

  return (
    <>
      {/* Best Sellers */}
      <section className={`container ${styles.productsSection}`}>
        <AnimatedSection direction="up" delay={100}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>{t('bestSellers')}</h2>
            <p className={styles.sectionSubtitle}>{t('bestSellersSubtitle')}</p>
          </div>
        </AnimatedSection>
        <div className={styles.productsGrid}>
          {renderProducts(bestSellers)}
        </div>
      </section>

      {/* Featured Products */}
      <section className={`container ${styles.productsSection}`}>
        <AnimatedSection direction="up" delay={200}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>{t('featuredProducts')}</h2>
            <p className={styles.sectionSubtitle}>{t('featuredProductsSubtitle')}</p>
          </div>
        </AnimatedSection>
        <div className={styles.productsGrid}>
          {renderProducts(featuredProductsWithSales, true)}
        </div>
      </section>
    </>
  );
}
