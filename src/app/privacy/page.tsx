'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import styles from './page.module.css';

export default function PrivacyPage() {
    const { t } = useLanguage();
    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>{t('privacyTitle')}</h1>
                <p className={styles.lastUpdated}>{t('lastUpdated')}: {new Date().toLocaleDateString()}</p>
            </div>

            <div className={styles.content}>
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>1. {t('dataCollection')}</h2>
                    <p className={styles.text}>
                        {t('dataCollectionDesc')}
                    </p>
                </section>

                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>2. {t('dataUsage')}</h2>
                    <p className={styles.text}>
                        {t('dataUsageDesc')}
                    </p>
                </section>

                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>3. {t('dataProtection')}</h2>
                    <p className={styles.text}>
                        {t('dataProtectionDesc')}
                    </p>
                </section>

                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>4. {t('dataSharing')}</h2>
                    <p className={styles.text}>
                        {t('dataSharingDesc')}
                    </p>
                </section>

                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>5. {t('yourRights')}</h2>
                    <p className={styles.text}>
                        {t('yourRightsDesc')}
                    </p>
                </section>

                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>6. {t('cookies')}</h2>
                    <p className={styles.text}>
                        {t('cookiesDesc')}
                    </p>
                </section>
            </div>
        </div>
    );
}

