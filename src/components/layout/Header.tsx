'use client';

import Link from 'next/link';
import Image from 'next/image';
import styles from './Header.module.css';
import { useCart } from '@/lib/cart';
import { useCountry, CountryCode } from '@/lib/country';

export default function Header() {
    const { itemCount } = useCart();
    const { country, setCountry } = useCountry();

    return (
        <header className={styles.header}>
            <div className={styles.container}>
                {/* Logo */}
                <Link href="/" className={styles.logoLink}>
                    <Image
                        src="/logo.png"
                        alt="Monican Logo"
                        width={120}
                        height={40}
                        priority
                        style={{ objectFit: 'contain' }}
                    />
                </Link>

                {/* Desktop Navigation */}
                <nav className={styles.nav}>
                    <ul className={styles.navLinks}>
                        <li><Link href="/" className={styles.navLink}>Accueil</Link></li>
                        <li><Link href="/catalog" className={styles.navLink}>Catalogue</Link></li>
                        <li><Link href="/about" className={styles.navLink}>À propos</Link></li>
                        <li><Link href="/contact" className={styles.navLink}>Contact</Link></li>
                    </ul>
                </nav>

                {/* Actions (Search, User, Cart) */}
                <div className={styles.actions}>
                    <select
                        value={country}
                        onChange={(e) => setCountry(e.target.value as CountryCode)}
                        className={styles.countrySelect}
                        style={{
                            padding: '0.25rem',
                            borderRadius: '4px',
                            border: '1px solid #e5e7eb',
                            marginRight: '1rem',
                            cursor: 'pointer',
                            fontSize: '0.9rem'
                        }}
                    >
                        <option value="US">🇺🇸 USD</option>
                        <option value="CA">🇨🇦 CAD</option>
                        <option value="MX">🇲🇽 MXN</option>
                    </select>

                    <button className={styles.iconBtn} aria-label="Recherche">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="8"></circle>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                        </svg>
                    </button>

                    <Link href="/cart" className={`${styles.iconBtn} ${styles.cartBtn}`} aria-label="Panier">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="9" cy="21" r="1"></circle>
                            <circle cx="20" cy="21" r="1"></circle>
                            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                        </svg>
                        {itemCount > 0 && <span className={styles.cartCount}>{itemCount}</span>}
                    </Link>
                </div>
            </div>
        </header>
    );
}
