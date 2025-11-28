'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import styles from './page.module.css';

export default function ReturnsPage() {
    const { t } = useLanguage();
    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>{t('returnsTitle')}</h1>
            </div>

            <div className={styles.content}>
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>{t('freeReturns30Days')}</h2>
                    <p className={styles.text}>
                        {t('freeReturns30DaysDesc')}
                    </p>
                </section>

                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>{t('howToReturn')}</h2>
                    <ol className={styles.steps}>
                        <li>{t('step1')}</li>
                        <li>{t('step2')}</li>
                        <li>{t('step3')}</li>
                        <li>{t('step4')}</li>
                        <li>{t('step5')}</li>
                        <li>{t('step6')}</li>
                    </ol>
                </section>

                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>{t('refunds')}</h2>
                    <p className={styles.text}>
                        {t('refundsDesc')}
                    </p>
                </section>

                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>{t('nonReturnableItems')}</h2>
                    <ul className={styles.list}>
                        <li>{t('nonReturnable1')}</li>
                        <li>{t('nonReturnable2')}</li>
                        <li>{t('nonReturnable3')}</li>
                        <li>{t('nonReturnable4')}</li>
                    </ul>
                </section>

                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>{t('needHelp')}</h2>
                    <p className={styles.text}>
                        {t('needHelpDesc')} <a href="/contact" className={styles.link}>{t('contactUs')}</a>.
                    </p>
                </section>
            </div>
        </div>
    );
}

