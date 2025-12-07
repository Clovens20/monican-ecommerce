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
                <div className={styles.overlay}></div>
            </div>
            
            <div className={styles.content}>
                <div className={styles.buttonContainer}>
                    <Link href="/catalog" className={styles.btnPrimary} prefetch={true}>
                        <span className={styles.btnText}>{t('buyNow')}</span>
                        <span className={styles.btnIcon}>→</span>
                    </Link>
                    <Link href="/catalog?category=new" className={styles.btnSecondary} prefetch={true}>
                        <span className={styles.btnText}>{t('newArrivals')}</span>
                        <span className={styles.btnIcon}>🆕</span>
                    </Link>
                </div>
            </div>
        </section>
    );
}
