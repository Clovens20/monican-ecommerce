'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './Header.module.css';
import { useCart } from '@/lib/cart';
import { useCountry, CountryCode } from '@/lib/country';
import { useLanguage } from '@/contexts/LanguageContext';
import LanguageSelector from '@/components/LanguageSelector';
import SearchModal from '@/components/ui/SearchModal';

export default function Header() {
    const { itemCount } = useCart();
    const { country, setCountry } = useCountry();
    const { t } = useLanguage();
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    const closeMobileMenu = () => {
        setIsMobileMenuOpen(false);
    };

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
                        style={{ objectFit: 'contain', height: 'auto' }}
                    />
                </Link>

                {/* Mobile Menu Button */}
                <button 
                    className={styles.mobileMenuBtn}
                    onClick={toggleMobileMenu}
                    aria-label="Menu"
                    aria-expanded={isMobileMenuOpen}
                >
                    <span className={`${styles.hamburger} ${isMobileMenuOpen ? styles.hamburgerOpen : ''}`}>
                        <span></span>
                        <span></span>
                        <span></span>
                    </span>
                </button>

                {/* Desktop Navigation */}
                <nav className={styles.nav}>
                    <ul className={styles.navLinks}>
                        <li><Link href="/" className={styles.navLink} prefetch={true} suppressHydrationWarning>{t('home')}</Link></li>
                        <li><Link href="/catalog" className={styles.navLink} prefetch={true} suppressHydrationWarning>{t('catalog')}</Link></li>
                        <li><Link href="/wholesale" className={`${styles.navLink} ${styles.wholesaleLink}`} prefetch={true} suppressHydrationWarning>{t('wholesale')}</Link></li>
                        <li><Link href="/about" className={styles.navLink} prefetch={true} suppressHydrationWarning>{t('about')}</Link></li>
                        <li><Link href="/contact" className={styles.navLink} prefetch={true} suppressHydrationWarning>{t('contact')}</Link></li>
                    </ul>
                </nav>

                {/* Actions (Language, Country, Search, Cart) */}
                <div className={styles.actions}>
                    <LanguageSelector />

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

                    <button 
                        className={styles.iconBtn} 
                        aria-label="Recherche"
                        onClick={() => setIsSearchOpen(true)}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="8"></circle>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                        </svg>
                    </button>

                    <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

                    <Link href="/cart" className={`${styles.iconBtn} ${styles.cartBtn}`} aria-label={t('cart')}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="9" cy="21" r="1"></circle>
                            <circle cx="20" cy="21" r="1"></circle>
                            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                        </svg>
                        {itemCount > 0 && <span className={styles.cartCount}>{itemCount}</span>}
                    </Link>
                </div>
            </div>

            {/* Mobile Menu Overlay */}
            <div 
                className={`${styles.mobileMenuOverlay} ${isMobileMenuOpen ? styles.mobileMenuOpen : ''}`}
                onClick={closeMobileMenu}
            >
                <nav 
                    className={styles.mobileNav}
                    onClick={(e) => e.stopPropagation()}
                >
                    <ul className={styles.mobileNavLinks}>
                        <li>
                            <Link href="/" className={styles.mobileNavLink} prefetch={true} onClick={closeMobileMenu} suppressHydrationWarning>
                                {t('home')}
                            </Link>
                        </li>
                        <li>
                            <Link href="/catalog" className={styles.mobileNavLink} prefetch={true} onClick={closeMobileMenu} suppressHydrationWarning>
                                {t('catalog')}
                            </Link>
                        </li>
                        <li>
                            <Link href="/wholesale" className={`${styles.mobileNavLink} ${styles.wholesaleLink}`} prefetch={true} onClick={closeMobileMenu} suppressHydrationWarning>
                                {t('wholesale')} 💰
                            </Link>
                        </li>
                        <li>
                            <Link href="/about" className={styles.mobileNavLink} prefetch={true} onClick={closeMobileMenu} suppressHydrationWarning>
                                {t('about')}
                            </Link>
                        </li>
                        <li>
                            <Link href="/contact" className={styles.mobileNavLink} prefetch={true} onClick={closeMobileMenu} suppressHydrationWarning>
                                {t('contact')}
                            </Link>
                        </li>
                    </ul>
                </nav>
            </div>
        </header>
    );
}
