'use client';

import Link from 'next/link';
import ProductCard from './ProductCard';
import { Product } from '@/lib/types';
import styles from './ProductRecommendations.module.css';

interface ProductRecommendationsProps {
    products: Product[];
}

export default function ProductRecommendations({ products }: ProductRecommendationsProps) {
    if (products.length === 0) return null;

    return (
        <div className={styles.recommendations}>
            <div className={styles.header}>
                <h2 className={styles.title}>VOUS POURRIEZ AIMER</h2>
                <Link href="/catalog" className={styles.seeAllLink}>
                    Voir tout
                </Link>
            </div>
            <div className={styles.productsGrid}>
                {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                ))}
            </div>
        </div>
    );
}

