'use client';

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
                                {/* Placeholder image */}
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
                </div>
            </div>
        </div>
    );
}
