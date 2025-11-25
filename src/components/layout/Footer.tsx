import Link from 'next/link';
import Image from 'next/image';
import styles from './Footer.module.css';

export default function Footer() {
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
                        Votre destination mode multi-pays. Qualité, style et service exceptionnel pour USA, Canada et Mexique.
                    </p>
                </div>

                <div className={styles.linksGrid}>
                    <div>
                        <h4 className={styles.colTitle}>Boutique</h4>
                        <ul className={styles.linkList}>
                            <li><Link href="/catalog?category=tennis" className={styles.link}>Tennis</Link></li>
                            <li><Link href="/catalog?category=chemises" className={styles.link}>Chemises</Link></li>
                            <li><Link href="/catalog?category=jeans" className={styles.link}>Jeans</Link></li>
                            <li><Link href="/catalog?category=maillots" className={styles.link}>Maillots</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className={styles.colTitle}>Aide</h4>
                        <ul className={styles.linkList}>
                            <li><Link href="/track-order" className={styles.link}>Suivre ma commande</Link></li>
                            <li><Link href="/shipping" className={styles.link}>Livraison</Link></li>
                            <li><Link href="/returns" className={styles.link}>Retours</Link></li>
                            <li><Link href="/faq" className={styles.link}>FAQ</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className={styles.colTitle}>Légal</h4>
                        <ul className={styles.linkList}>
                            <li><Link href="/terms" className={styles.link}>Conditions générales</Link></li>
                            <li><Link href="/privacy" className={styles.link}>Confidentialité</Link></li>
                            <li><Link href="/contact" className={styles.link}>Contact</Link></li>
                        </ul>
                    </div>
                </div>
            </div>

            <div className={styles.bottom}>
                <p>&copy; {new Date().getFullYear()} Monican. Tous droits réservés.</p>
            </div>
        </footer>
    );
}
