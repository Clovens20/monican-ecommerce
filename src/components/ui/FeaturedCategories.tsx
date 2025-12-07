'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import AnimatedSection from './AnimatedSection';
import { useLanguage } from '@/contexts/LanguageContext';
import { Product } from '@/lib/types';
import ProductCard from '@/components/product/ProductCard';
import styles from './FeaturedCategories.module.css';

interface Category {
    slug: string;
    name_key: string;
    color: string | null;
    icon: string | null;
}

interface CategoryWithProducts extends Category {
    products: Product[];
}

export default function FeaturedCategories() {
    const { t } = useLanguage();
    const [categories, setCategories] = useState<Category[]>([]);
    const [categoriesWithProducts, setCategoriesWithProducts] = useState<CategoryWithProducts[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCategoriesAndProducts();

        // Écouter les mises à jour de catégories
        const handleCategoriesUpdate = () => {
            fetchCategoriesAndProducts();
        };
        window.addEventListener('categories-updated', handleCategoriesUpdate);

        return () => {
            window.removeEventListener('categories-updated', handleCategoriesUpdate);
        };
    }, []);

    const fetchCategoriesAndProducts = async () => {
        try {
            // Récupérer les catégories
            const categoriesResponse = await fetch('/api/categories');
            const categoriesData = await categoriesResponse.json();
            
            if (categoriesData.success && categoriesData.categories) {
                const activeCategories = categoriesData.categories.slice(0, 4);
                setCategories(activeCategories);

                // Récupérer les produits pour chaque catégorie
                const categoriesWithProductsData = await Promise.all(
                    activeCategories.map(async (cat: Category) => {
                        try {
                            const productsResponse = await fetch(`/api/products?category=${cat.slug}&limit=4`);
                            const productsData = await productsResponse.json();
                            return {
                                ...cat,
                                products: productsData.success ? (productsData.products || []).slice(0, 4) : []
                            };
                        } catch (err) {
                            console.error(`Error fetching products for category ${cat.slug}:`, err);
                            return {
                                ...cat,
                                products: []
                            };
                        }
                    })
                );

                setCategoriesWithProducts(categoriesWithProductsData);
            }
        } catch (err) {
            console.error('Error fetching categories:', err);
        } finally {
            setLoading(false);
        }
    };
    
    if (loading) {
        return (
            <section className={styles.section}>
                <div className="container">
                    <div className={styles.loading}>Chargement des catégories...</div>
                </div>
            </section>
        );
    }

    if (categories.length === 0) {
        return null;
    }
    
    return (
        <section className={styles.section}>
            <div className="container">
                <AnimatedSection direction="up">
                    <h2 className={styles.title}>{t('categoriesTitle')}</h2>
                </AnimatedSection>
                
                {categoriesWithProducts.map((category, categoryIndex) => (
                    <div key={category.slug} className={styles.categorySection}>
                        <AnimatedSection delay={categoryIndex * 100} direction="up">
                            <div className={styles.categoryHeader}>
                                <Link 
                                    href={`/catalog?category=${category.slug}`} 
                                    prefetch={true}
                                    className={styles.categoryCard}
                                >
                                    <div 
                                        className={styles.cardBackground}
                                        style={{ 
                                            background: `linear-gradient(135deg, ${category.color || '#3B82F6'} 0%, ${category.color || '#3B82F6'}dd 100%)`
                                        }}
                                    ></div>
                                    <div className={styles.cardOverlay}></div>
                                    <span className={styles.cardTitle}>{t(category.name_key)}</span>
                                    <div className={styles.cardHoverEffect}></div>
                                    {category.products.length > 0 && (
                                        <div className={styles.productCount}>
                                            {category.products.length} {category.products.length === 1 ? 'produit' : 'produits'}
                                        </div>
                                    )}
                                </Link>
                            </div>
                        </AnimatedSection>

                        {/* Afficher les produits de cette catégorie */}
                        {category.products.length > 0 && (
                            <div className={styles.productsContainer}>
                                <div className={styles.productsGrid}>
                                    {category.products.map((product, productIndex) => (
                                        <AnimatedSection 
                                            key={product.id} 
                                            delay={(categoryIndex * 100) + (productIndex * 50)} 
                                            direction="up"
                                        >
                                            <ProductCard product={product} />
                                        </AnimatedSection>
                                    ))}
                                </div>
                                <div className={styles.viewAllContainer}>
                                    <Link 
                                        href={`/catalog?category=${category.slug}`}
                                        className={styles.viewAllBtn}
                                    >
                                        Voir tous les produits {t(category.name_key)} →
                                    </Link>
                                </div>
                            </div>
                        )}

                        {category.products.length === 0 && (
                            <div className={styles.noProducts}>
                                <p>Aucun produit disponible dans cette catégorie pour le moment.</p>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </section>
    );
}
