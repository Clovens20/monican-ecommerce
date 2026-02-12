'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/lib/cart';
import { useCountry } from '@/lib/country';
import { useLanguage } from '@/contexts/LanguageContext';
import styles from './page.module.css';

export default function CartPage() {
    const { t } = useLanguage();
    const { items, removeItem, updateQuantity, total } = useCart();
    const { formatPrice, shippingCost, settings } = useCountry();
    const [email, setEmail] = useState('');
    const [emailSaved, setEmailSaved] = useState(false);
    const [savingEmail, setSavingEmail] = useState(false);
    
    // Charger l'email depuis localStorage si disponible
    useEffect(() => {
        const savedEmail = localStorage.getItem('customer_email');
        if (savedEmail) {
            setEmail(savedEmail);
            setEmailSaved(true);
        }
    }, []);
    
    // Sauvegarder l'email dans abandoned_carts avec debounce
    useEffect(() => {
        // Ne pas sauvegarder si l'email n'est pas valide ou si le panier est vide
        if (!email || !email.includes('@') || items.length === 0) {
            return;
        }
        
        // Debounce : attendre 1 seconde après la dernière modification
        const timeoutId = setTimeout(async () => {
            setSavingEmail(true);
            try {
                // Sauvegarder dans localStorage immédiatement
                localStorage.setItem('customer_email', email);
                
                // Sauvegarder dans abandoned_carts pour le suivi
                const response = await fetch('/api/cart/abandoned', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        email,
                        cartData: {
                            items,
                            total,
                            itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
                        },
                    }),
                });
                
                if (response.ok) {
                    setEmailSaved(true);
                }
            } catch (error) {
                console.error('Error saving email:', error);
            } finally {
                setSavingEmail(false);
            }
        }, 1000); // Debounce de 1 seconde
        
        return () => clearTimeout(timeoutId);
    }, [email, items, total]);
    
    // Gestion du changement d'email (sans debounce pour l'affichage)
    const handleEmailChange = (newEmail: string) => {
        setEmail(newEmail);
        setEmailSaved(false); // Reset le statut car l'email change
    };

    if (items.length === 0) {
        return (
            <div className={`container ${styles.page}`} style={{ textAlign: 'center', padding: '4rem 0' }}>
                <h1 className={styles.title}>{t('cartEmpty')}</h1>
                <Link href="/catalog" className="btn btn-primary">
                    {t('continueShopping')}
                </Link>
            </div>
        );
    }

    const shipping = shippingCost(total);
    const totalWithShipping = total + (shipping / settings.exchangeRate); // Approximate for display, real calc in checkout

    return (
        <div className={`container ${styles.page}`}>
            <h1 className={styles.title}>{t('yourCart')}</h1>

            <div className={styles.layout}>
                <div className={styles.cartItems}>
                    {items.map((item) => (
                        <div key={item.cartId} className={styles.item}>
                            <div className={styles.itemImage}>
                                {item.images && item.images.length > 0 ? (
                                    <Image
                                        src={
                                            typeof item.images[0] === 'string'
                                                ? item.images[0]
                                                : (item.images[0] as { url?: string }).url || '/logo.png'
                                        }
                                        alt={item.name}
                                        width={100}
                                        height={100}
                                        className={styles.itemImageImg}
                                    />
                                ) : (
                                    <div className={styles.itemImagePlaceholder}>📦</div>
                                )}
                            </div>
                            <div className={styles.itemInfo}>
                                <h3 className={styles.itemName}>{item.name}</h3>
                                <div className={styles.itemMeta}>
                                    {t('size')}: {item.selectedSize} | {t('price')}: {formatPrice(item.price)}
                                </div>
                                <div className={styles.itemActions}>
                                    <div className={styles.quantityControls}>
                                        <button
                                            className={styles.qtyBtn}
                                            onClick={() => updateQuantity(item.cartId, item.quantity - 1)}
                                        >
                                            -
                                        </button>
                                        <span className={styles.qtyValue}>{item.quantity}</span>
                                        <button
                                            className={styles.qtyBtn}
                                            onClick={() => updateQuantity(item.cartId, item.quantity + 1)}
                                        >
                                            +
                                        </button>
                                    </div>
                                    <button
                                        className={styles.removeBtn}
                                        onClick={() => removeItem(item.cartId)}
                                    >
                                        {t('remove')}
                                    </button>
                                </div>
                            </div>
                            <div style={{ fontWeight: 600 }}>
                                {formatPrice(item.price * item.quantity)}
                            </div>
                        </div>
                    ))}
                </div>

                <div className={styles.summary}>
                    <h2 className={styles.summaryTitle}>{t('orderSummary')}</h2>
                    
                    {/* Champ email pour suivi */}
                    <div className={styles.emailSection}>
                        <label htmlFor="customer-email" className={styles.emailLabel}>
                            📧 {emailSaved ? 'Email enregistré' : 'Votre email (pour recevoir les mises à jour)'}
                        </label>
                        <input
                            id="customer-email"
                            type="email"
                            value={email}
                            onChange={(e) => handleEmailChange(e.target.value)}
                            placeholder="votre@email.com"
                            className={styles.emailInput}
                            disabled={savingEmail}
                        />
                        {emailSaved && (
                            <div className={styles.emailSuccess}>
                                ✓ Email sauvegardé - Nous vous tiendrons informé
                            </div>
                        )}
                    </div>
                    
                    <div className={styles.summaryRow}>
                        <span>{t('subtotal')}</span>
                        <span>{formatPrice(total)}</span>
                    </div>
                    <div className={styles.summaryRow}>
                        <span>{t('shipping')} ({settings.code})</span>
                        <span>{shipping === 0 ? t('free') : formatPrice(shipping / settings.exchangeRate)}</span>
                    </div>
                    <div className={styles.totalRow}>
                        <span>{t('total')}</span>
                        <span>{formatPrice(total + (shipping / settings.exchangeRate))}</span>
                    </div>
                    <Link href="/checkout" className={styles.checkoutBtn}>
                        {t('proceedToCheckout')}
                    </Link>
                    <Link href="/catalog" className={styles.continueShoppingBtn}>
                        ← {t('continueShopping')}
                    </Link>
                </div>
            </div>
        </div>
    );
}
