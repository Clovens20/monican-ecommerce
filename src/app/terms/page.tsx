'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import styles from './page.module.css';

export default function TermsPage() {
    const { t } = useLanguage();
    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>{t('termsTitle')}</h1>
                <p className={styles.lastUpdated}>{t('lastUpdated')}: {new Date().toLocaleDateString()}</p>
            </div>

            <div className={styles.content}>
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>1. {t('acceptance')}</h2>
                    <p className={styles.text}>
                        {t('acceptanceDesc')}
                    </p>
                </section>

                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>2. {t('siteUsage')}</h2>
                    <p className={styles.text}>
                        {t('siteUsageDesc')}
                    </p>
                </section>

                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>3. {t('ordersPayments')}</h2>
                    <p className={styles.text}>
                        {t('ordersPaymentsDesc')}
                    </p>
                </section>

                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>4. {t('intellectualProperty')}</h2>
                    <p className={styles.text}>
                        {t('intellectualPropertyDesc')}
                    </p>
                </section>

                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>5. {t('liability')}</h2>
                    <p className={styles.text}>
                        {t('liabilityDesc')}
                    </p>
                </section>
            </div>
        </div>
    );
}

