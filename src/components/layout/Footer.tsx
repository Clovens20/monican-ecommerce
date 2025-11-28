'use client';

import Link from 'next/link';
import Image from 'next/image';
import styles from './Footer.module.css';
import { useLanguage } from '@/contexts/LanguageContext';

export default function Footer() {
    const { t } = useLanguage();
    return (
        <footer className={styles.footer}>
            <div className={styles.container}>
                <div className={styles.brandCol}>
                    <Image
                        src="/logo.png"
                        alt="Monican Logo"
                        width={100}
                        height={33}
                        style={{ objectFit: 'contain', opacity: 0.8 }}
                    />
                    <p className={styles.brandDesc}>
                        {t('brandDescription')}
                    </p>
                </div>

                <div className={styles.linksGrid}>
                    <div>
                        <h4 className={styles.colTitle}>{t('shopTitle')}</h4>
                        <ul className={styles.linkList}>
                            <li><Link href="/catalog?category=tennis" className={styles.link}>Tennis</Link></li>
                            <li><Link href="/catalog?category=chemises" className={styles.link}>Chemises</Link></li>
                            <li><Link href="/catalog?category=jeans" className={styles.link}>Jeans</Link></li>
                            <li><Link href="/catalog?category=maillots" className={styles.link}>Maillots</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className={styles.colTitle}>{t('helpTitle')}</h4>
                        <ul className={styles.linkList}>
                            <li><Link href="/track-order" className={styles.link}>{t('trackOrder')}</Link></li>
                            <li><Link href="/shipping" className={styles.link}>{t('delivery')}</Link></li>
                            <li><Link href="/returns" className={styles.link}>{t('returns')}</Link></li>
                            <li><Link href="/faq" className={styles.link}>{t('faq')}</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className={styles.colTitle}>{t('legalTitle')}</h4>
                        <ul className={styles.linkList}>
                            <li><Link href="/terms" className={styles.link}>{t('terms')}</Link></li>
                            <li><Link href="/privacy" className={styles.link}>{t('privacy')}</Link></li>
                            <li><Link href="/contact" className={styles.link}>{t('contact')}</Link></li>
                        </ul>
                    </div>
                </div>
            </div>

            <div className={styles.bottom}>
                <p>&copy; {new Date().getFullYear()} Monican. {t('allRightsReserved')}</p>
            </div>
        </footer>
    );
}
