'use client';

import Link from 'next/link';
import Image from 'next/image';
import AnimatedSection from './AnimatedSection';
import { useLanguage } from '@/contexts/LanguageContext';
import styles from './FeaturedCategories.module.css';

const categories = [
    { nameKey: 'tennis', slug: 'tennis', color: '#3B82F6' },
    { nameKey: 'shirts', slug: 'chemises', color: '#10B981' },
    { nameKey: 'jeans', slug: 'jeans', color: '#8B5CF6' },
    { nameKey: 'jerseys', slug: 'maillots', color: '#F59E0B' },
];

export default function FeaturedCategories() {
    const { t } = useLanguage();
    
    return (
        <section className={styles.section}>
            <div className="container">
                <AnimatedSection direction="up">
                    <h2 className={styles.title}>{t('categoriesTitle')}</h2>
                </AnimatedSection>
                <div className={styles.grid}>
                    {categories.map((cat, index) => (
                        <AnimatedSection key={cat.slug} delay={index * 100} direction="up">
                            <Link href={`/catalog?category=${cat.slug}`} className={styles.card}>
                                <div 
                                    className={styles.cardBackground}
                                    style={{ 
                                        background: `linear-gradient(135deg, ${cat.color} 0%, ${cat.color}dd 100%)`
                                    }}
                                ></div>
                                <div className={styles.cardOverlay}></div>
                                <span className={styles.cardTitle}>{t(cat.nameKey)}</span>
                                <div className={styles.cardHoverEffect}></div>
                            </Link>
                        </AnimatedSection>
                    ))}
                </div>
            </div>
        </section>
    );
}
