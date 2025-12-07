'use client';

import AnimatedSection from './AnimatedSection';
import { useLanguage } from '@/contexts/LanguageContext';
import styles from './StatsSection.module.css';

export default function StatsSection() {
    const { t } = useLanguage();
    
    const stats = [
        { number: '3k+', labelKey: 'satisfiedCustomers' },
        { number: '3', labelKey: 'countriesServed' },
        { number: '96%', labelKey: 'satisfactionRate' },
        { number: '24/7', labelKey: 'customerSupport' },
    ];

    return (
        <section className={styles.statsSection}>
            <div className="container">
                <div className={styles.statsGrid}>
                    {stats.map((stat, index) => (
                        <AnimatedSection key={index} delay={index * 100} direction="up">
                            <div className={styles.statCard}>
                                <div className={styles.statNumber}>{stat.number}</div>
                                <div className={styles.statLabel}>{t(stat.labelKey)}</div>
                            </div>
                        </AnimatedSection>
                    ))}
                </div>
            </div>
        </section>
    );
}

