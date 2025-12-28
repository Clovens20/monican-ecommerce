// CHEMIN: src/components/product/ProductCard.tsx
// ACTION: REMPLACER TOUT LE CONTENU

'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Product } from '@/lib/types';
import styles from './ProductCard.module.css';
import { useCountry } from '@/lib/country';
import { useLanguage } from '@/contexts/LanguageContext';
import { findBestPromotion, calculateDiscountedPrice, Promotion } from '@/lib/promotions';
import { filterVariantsByCategory } from '@/lib/product-utils';

interface ProductCardProps {
  product: Product;
  viewMode?: 'grid' | 'list';
  salesCount?: number; // Nombre d'unités vendues (optionnel)
}

export default function ProductCard({ product, viewMode = 'grid', salesCount }: ProductCardProps) {
  const { formatPrice } = useCountry();
  const { t } = useLanguage();
  const [isHovered, setIsHovered] = useState(false);
  const [promotion, setPromotion] = useState<Promotion | null>(null);

  // Charger les promotions pour ce produit
  useEffect(() => {
    async function fetchPromotion() {
      try {
        const response = await fetch(`/api/promotions?productId=${product.id}&category=${product.category}`);
        if (response.ok) {
          const data = await response.json();
          const bestPromo = findBestPromotion(data.promotions || [], product.id, product.category);
          setPromotion(bestPromo);
        }
      } catch (err) {
        console.error('Error fetching promotion:', err);
      }
    }
    fetchPromotion();
  }, [product.id, product.category]);

  // Calculate total stock
  const totalStock = product.variants.reduce((sum, v) => sum + v.stock, 0);

  // Calculer le prix avec promotion
  const { discountedPrice, discountAmount } = promotion
    ? calculateDiscountedPrice(product.price, promotion)
    : { discountedPrice: product.price, discountAmount: 0 };
  
  const hasDiscount = discountAmount > 0;

  const getStockStatus = () => {
    if (totalStock === 0) return { text: t('outOfStock'), class: 'out', color: '#ef4444' };
    if (totalStock < 10) return { text: `${totalStock} ${t('remaining')}`, class: 'low', color: '#f59e0b' };
    return { text: t('inStock'), class: 'in', color: '#10b981' };
  };

  const stockStatus = getStockStatus();

  // Get primary image or use placeholder
  const primaryImage = product.images?.find(img => img.isPrimary) || product.images?.[0];
  const hasMedia = primaryImage && primaryImage.url;
  const isVideo = primaryImage?.type === 'video';

  if (viewMode === 'list') {
    return (
      <Link 
        href={`/product/${product.id}`} 
        className={styles.cardList}
        prefetch={true}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className={styles.imageWrapperList}>
          {hasMedia ? (
            isVideo ? (
              <video
                src={primaryImage.url}
                className={styles.productImage}
                muted
                loop
                playsInline
                onMouseEnter={(e) => e.currentTarget.play()}
                onMouseLeave={(e) => {
                  e.currentTarget.pause();
                  e.currentTarget.currentTime = 0;
                }}
              />
            ) : (
              <img 
                src={primaryImage.url} 
                alt={primaryImage.alt || product.name}
                className={styles.productImage}
              />
            )
          ) : (
            <div className={styles.imagePlaceholder}>
              <span className={styles.placeholderIcon}>📦</span>
            </div>
          )}
          {product.isNew && (
            <div className={styles.badgeNew}>{t('new')}</div>
          )}
        </div>

        <div className={styles.contentList}>
        <div className={styles.header}>
          <span className={styles.category}>{product.category}</span>
          {product.isFeatured && <span className={styles.featuredBadge}>⭐ {t('popular')}</span>}
          {salesCount !== undefined && (
            <span style={{ 
              fontSize: '11px',
              color: salesCount > 0 ? '#667eea' : '#94a3b8',
              fontWeight: '600'
            }}>
              🔥 {salesCount > 0 ? (
                <>{salesCount} {salesCount > 1 ? t('soldPlural') : t('sold')}</>
              ) : (
                <>0 {t('sold')}</>
              )}
            </span>
          )}
        </div>
          
          <h3 className={styles.titleList}>{product.name}</h3>
          <p className={styles.description}>{product.description}</p>

          <div className={styles.footer}>
            <div className={styles.priceSection}>
              {hasDiscount ? (
                <div className={styles.priceWithDiscount}>
                  <span className={styles.originalPrice}>{formatPrice(product.price)}</span>
                  <span className={styles.discountedPrice}>{formatPrice(discountedPrice)}</span>
                  <span className={styles.discountBadge}>
                    -{promotion?.discount_type === 'percentage' ? `${promotion.discount_value}%` : formatPrice(discountAmount)}
                  </span>
                </div>
              ) : (
                <>
                  {product.comparePrice && product.comparePrice > product.price ? (
                    <div className={styles.priceWithCompare}>
                      <span className={styles.comparePrice}>{formatPrice(product.comparePrice)}</span>
                      <span className={styles.price}>{formatPrice(product.price)}</span>
                      <span className={styles.discountPercent}>
                        -{Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)}%
                      </span>
                    </div>
                  ) : (
                    <span className={styles.price}>{formatPrice(product.price)}</span>
                  )}
                </>
              )}
              <span className={`${styles.stockBadge} ${styles[stockStatus.class]}`}>
                <span className={styles.stockDot} style={{ background: stockStatus.color }}></span>
                {stockStatus.text}
              </span>
            </div>

            <div className={styles.sizes}>
              {filterVariantsByCategory(product.variants, product.category).slice(0, 4).map(v => (
                <span key={v.sku} className={styles.sizeTag}>{v.size}</span>
              ))}
              {filterVariantsByCategory(product.variants, product.category).length > 4 && (
                <span className={styles.sizeTag}>+{filterVariantsByCategory(product.variants, product.category).length - 4}</span>
              )}
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link 
      href={`/product/${product.id}`} 
      className={styles.card}
      prefetch={true}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={styles.imageWrapper}>
        {/* Afficher l'image ou la vidéo réelle */}
        {hasMedia ? (
          isVideo ? (
            <video
              src={primaryImage.url}
              className={styles.productImage}
              muted
              loop
              playsInline
              onMouseEnter={(e) => e.currentTarget.play()}
              onMouseLeave={(e) => {
                e.currentTarget.pause();
                e.currentTarget.currentTime = 0;
              }}
            />
          ) : (
            <img 
              src={primaryImage.url} 
              alt={primaryImage.alt || product.name}
              className={styles.productImage}
            />
          )
        ) : (
          <div className={styles.imagePlaceholder}>
            <span className={styles.placeholderIcon}>📦</span>
            <span className={styles.placeholderText}>{product.name}</span>
          </div>
        )}

        {/* Badges */}
        <div className={styles.badges}>
          {product.isNew && (
            <div className={styles.badgeNew}>
              <span className={styles.badgeIcon}>✨</span>
              {t('new')}
            </div>
          )}
          {product.isFeatured && !product.isNew && (
            <div className={styles.badgeFeatured}>
              <span className={styles.badgeIcon}>⭐</span>
              {t('popular')}
            </div>
          )}
          {salesCount !== undefined && (
            <div className={styles.badgeSales} style={{ 
              background: salesCount > 0 
                ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                : 'linear-gradient(135deg, #94a3b8 0%, #64748b 100%)',
              color: 'white',
              padding: '4px 8px',
              borderRadius: '12px',
              fontSize: '11px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <span>🔥</span>
              {salesCount > 0 ? (
                <>{salesCount} {salesCount > 1 ? t('soldPlural') : t('sold')}</>
              ) : (
                <>0 {t('sold')}</>
              )}
            </div>
          )}
        </div>

        {/* Stock Badge */}
        <div className={`${styles.stockBadgeCard} ${styles[stockStatus.class]}`}>
          <span className={styles.stockDot} style={{ background: stockStatus.color }}></span>
          {stockStatus.text}
        </div>

        {/* Quick Actions */}
        <div className={`${styles.quickActions} ${isHovered ? styles.visible : ''}`}>
          <button className={styles.actionBtn} title={t('quickView')}>
            👁️
          </button>
          <button className={styles.actionBtn} title={t('addToWishlist')}>
            ❤️
          </button>
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.header}>
          <span className={styles.category}>{product.category}</span>
          <span className={styles.rating}>
            ⭐ 4.8
          </span>
        </div>

        <h3 className={styles.title}>{product.name}</h3>
        <p className={styles.descriptionShort}>{product.description}</p>

        <div className={styles.priceRow}>
          <div className={styles.priceSection}>
            {hasDiscount ? (
              <div className={styles.priceWithDiscount}>
                <span className={styles.originalPrice}>{formatPrice(product.price)}</span>
                <span className={styles.discountedPrice}>{formatPrice(discountedPrice)}</span>
                <span className={styles.discountBadge}>
                  -{promotion?.discount_type === 'percentage' ? `${promotion.discount_value}%` : formatPrice(discountAmount)}
                </span>
              </div>
            ) : (
              <>
                {product.comparePrice && product.comparePrice > product.price ? (
                  <div className={styles.priceWithCompare}>
                    <span className={styles.comparePrice}>{formatPrice(product.comparePrice)}</span>
                    <span className={styles.price}>{formatPrice(product.price)}</span>
                    <span className={styles.discountPercent}>
                      -{Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)}%
                    </span>
                  </div>
                ) : (
                  <>
                    <span className={styles.price}>{formatPrice(product.price)}</span>
                    <span className={styles.priceLabel}>{t('taxIncluded')}</span>
                  </>
                )}
              </>
            )}
          </div>
          <span className={styles.stockInfo}>
            {totalStock > 0 ? `${totalStock} ${t('available')}` : t('outOfStock')}
          </span>
        </div>

        {/* Sizes */}
        <div className={styles.sizes}>
          {filterVariantsByCategory(product.variants, product.category).slice(0, 5).map(v => (
            <span key={v.sku} className={styles.sizeTag}>{v.size}</span>
          ))}
          {filterVariantsByCategory(product.variants, product.category).length > 5 && (
            <span className={styles.sizeTag}>+{filterVariantsByCategory(product.variants, product.category).length - 5}</span>
          )}
        </div>

        {/* CTA */}
        <button className={styles.ctaBtn}>
          <span>{t('viewProduct')}</span>
          <span className={styles.ctaArrow}>→</span>
        </button>
      </div>
    </Link>
  );
}