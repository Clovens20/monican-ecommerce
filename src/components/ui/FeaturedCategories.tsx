'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import AnimatedSection from './AnimatedSection';
import { useLanguage } from '@/contexts/LanguageContext';
import styles from './FeaturedCategories.module.css';

interface Category {
    slug: string;
    name_key: string;
    color: string | null;
    icon: string | null;
}

export default function FeaturedCategories() {
    const { t } = useLanguage();
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCategories();

        // Écouter les mises à jour de catégories
        const handleCategoriesUpdate = () => {
            fetchCategories();
        };
        window.addEventListener('categories-updated', handleCategoriesUpdate);

        return () => {
            window.removeEventListener('categories-updated', handleCategoriesUpdate);
        };
    }, []);

    const fetchCategories = async () => {
        try {
            const response = await fetch('/api/categories');
            const data = await response.json();
            
            if (data.success && data.categories) {
                // Prendre seulement les 4 premières catégories actives
                setCategories(data.categories.slice(0, 4));
            }
        } catch (err) {
            console.error('Error fetching categories:', err);
        } finally {
            setLoading(false);
        }
    };
    
    if (loading) {
        return null; // Ou un skeleton loader
    }

    if (categories.length === 0) {
        return null; // Pas de catégories actives à afficher
    }
    
    return (
        <section className={styles.section}>
            <div className="container">
                <AnimatedSection direction="up">
                    <h2 className={styles.title}>{t('categoriesTitle')}</h2>
                </AnimatedSection>
                <div className={styles.grid}>
                    {categories.map((cat, index) => (
                        <AnimatedSection key={cat.slug} delay={index * 100} direction="up">
                            <Link href={`/catalog?category=${cat.slug}`} prefetch={true} className={styles.card}>
                                <div 
                                    className={styles.cardBackground}
                                    style={{ 
                                        background: `linear-gradient(135deg, ${cat.color || '#3B82F6'} 0%, ${cat.color || '#3B82F6'}dd 100%)`
                                    }}
                                ></div>
                                <div className={styles.cardOverlay}></div>
                                <span className={styles.cardTitle}>{t(cat.name_key)}</span>
                                <div className={styles.cardHoverEffect}></div>
                            </Link>
                        </AnimatedSection>
                    ))}
                </div>
            </div>
        </section>
    );
}
