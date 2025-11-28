'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import styles from './page.module.css';

export default function ShippingPage() {
    const { t } = useLanguage();
    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>{t('shippingTitle')}</h1>
            </div>

            <div className={styles.content}>
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>{t('shippingOptions')}</h2>
                    <div className={styles.shippingOptions}>
                        <div className={styles.option}>
                            <h3>🇺🇸 {t('country')} (USA)</h3>
                            <p><strong>{t('deliveryTime')}:</strong> 3-7 {t('businessDays')}</p>
                            <p><strong>{t('fees')}:</strong> 8.99 USD</p>
                        </div>
                        <div className={styles.option}>
                            <h3>🇨🇦 {t('country')} (CA)</h3>
                            <p><strong>{t('deliveryTime')}:</strong> 4-10 {t('businessDays')}</p>
                            <p><strong>{t('fees')}:</strong> 12.50 CAD</p>
                        </div>
                        <div className={styles.option}>
                            <h3>🇲🇽 {t('country')} (MX)</h3>
                            <p><strong>{t('deliveryTime')}:</strong> 5-14 {t('businessDays')}</p>
                            <p><strong>{t('fees')}:</strong> 25.00 MXN</p>
                        </div>
                    </div>
                </section>

                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>{t('orderTracking')}</h2>
                    <p className={styles.text}>
                        {t('orderTrackingDesc')} <a href="/track-order" className={styles.link}>{t('trackingPage')}</a>.
                    </p>
                </section>

                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>{t('shippingFaq')}</h2>
                    <div className={styles.faq}>
                        <div className={styles.faqItem}>
                            <h3>{t('howLongShipping')}</h3>
                            <p>{t('howLongShippingDesc')}</p>
                        </div>
                        <div className={styles.faqItem}>
                            <h3>{t('canModifyAddress')}</h3>
                            <p>{t('canModifyAddressDesc')}</p>
                        </div>
                        <div className={styles.faqItem}>
                            <h3>{t('damagedPackage')}</h3>
                            <p>{t('damagedPackageDesc')}</p>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}

