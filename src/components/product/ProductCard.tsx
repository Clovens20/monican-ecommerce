'use client';

import Link from 'next/link';
import { Product } from '@/lib/types';
import styles from './ProductCard.module.css';
import { useCountry } from '@/lib/country';

interface ProductCardProps {
    product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
    const { formatPrice } = useCountry();

    // Calculate total stock
    const totalStock = product.variants.reduce((sum, v) => sum + v.stock, 0);

    const getStockStatus = () => {
        if (totalStock === 0) return { text: 'Rupture', class: 'out' };
        if (totalStock < 10) return { text: `${totalStock} restants`, class: 'low' };
        return { text: 'En stock', class: 'in' };
    };

    const stockStatus = getStockStatus();

    return (
        <Link href={`/product/${product.id}`} className={styles.card}>
            <div className={styles.imageWrapper}>
                {/* Badges */}
                {product.isNew && (
                    <div className={`${styles.badge} ${styles.newBadge}`}>
                        Nouveau
                    </div>
                )}
                {product.isFeatured && !product.isNew && (
                    <div className={`${styles.badge} ${styles.featuredBadge}`}>
                        Populaire
                    </div>
                )}

                {/* Stock badge */}
                <div className={`${styles.stockBadge} ${styles[stockStatus.class === 'in' ? 'inStock' : stockStatus.class === 'low' ? 'lowStock' : 'outOfStock']}`}>
                    {stockStatus.text}
                </div>

                {/* Placeholder for product image */}
                <div className={styles.placeholder}>
                    {product.name}
                </div>

                {/* Quick View button (appears on hover) */}
                <div className={styles.quickView}>
                    Voir les détails
                </div>
            </div>
            <div className={styles.content}>
                <span className={styles.category}>{product.category}</span>
                <h3 className={styles.title}>{product.name}</h3>
                <div className={styles.priceRow}>
                    <span className={styles.price}>{formatPrice(product.price)}</span>
                    <span className={`${styles.stockInfo} ${styles[stockStatus.class]}`}>
                        <span className={styles.stockDot}></span>
                        {totalStock > 0 ? `${totalStock} disponibles` : 'Épuisé'}
                    </span>
                </div>
            </div>
        </Link>
    );
}
