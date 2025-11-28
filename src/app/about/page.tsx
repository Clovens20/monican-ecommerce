'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import styles from './page.module.css';

export default function AboutPage() {
    const { t } = useLanguage();
    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>{t('aboutTitle')}</h1>
            </div>

            <div className={styles.content}>
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>{t('ourMission')}</h2>
                    <p className={styles.text}>
                        {t('aboutMission')}
                    </p>
                </section>

                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>{t('ourHistory')}</h2>
                    <p className={styles.text}>
                        {t('aboutHistory')}
                    </p>
                </section>

                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>{t('whyChooseUs')}</h2>
                    <div className={styles.features}>
                        <div className={styles.feature}>
                            <div className={styles.featureIcon}>🌍</div>
                            <h3>{t('multiCountryDelivery')}</h3>
                            <p>{t('multiCountryDeliveryDesc')}</p>
                        </div>
                        <div className={styles.feature}>
                            <div className={styles.featureIcon}>✨</div>
                            <h3>{t('premiumQuality')}</h3>
                            <p>{t('premiumQualityDesc')}</p>
                        </div>
                        <div className={styles.feature}>
                            <div className={styles.featureIcon}>💳</div>
                            <h3>{t('securePayment')}</h3>
                            <p>{t('securePaymentDesc')}</p>
                        </div>
                        <div className={styles.feature}>
                            <div className={styles.featureIcon}>↩️</div>
                            <h3>{t('easyReturns')}</h3>
                            <p>{t('easyReturnsDesc')}</p>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}

