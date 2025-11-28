'use client';

import Link from 'next/link';
import Image from 'next/image';
import styles from './Hero.module.css';
import { useLanguage } from '@/contexts/LanguageContext';

export default function Hero() {
    const { t } = useLanguage();

    return (
        <section className={styles.hero}>
            <div className={styles.imageWrapper}>
                <Image
                    src="/hero-banner.png"
                    alt={t('heroTitle')}
                    fill
                    className={styles.image}
                    priority
                />
            </div>
            <div className={styles.overlay}></div>

            <div className={styles.content}>
                <div className={styles.textContent}>
                    <h1 className={styles.title}>
                        {t('heroTitle')}
                    </h1>
                    <p className={styles.subtitle}>
                        {t('heroSubtitle2')}
                    </p>
                    <div className={styles.buttons}>
                        <Link href="/catalog" className="btn btn-primary">
                            {t('buyNow')}
                        </Link>
                        <Link href="/catalog?category=new" className="btn btn-secondary">
                            {t('newArrivals')}
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}
