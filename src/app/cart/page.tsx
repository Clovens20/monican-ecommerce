'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/lib/cart';
import { useCountry } from '@/lib/country';
import styles from './page.module.css';

export default function CartPage() {
    const { items, removeItem, updateQuantity, total } = useCart();
    const { formatPrice, shippingCost, settings } = useCountry();

    if (items.length === 0) {
        return (
            <div className={`container ${styles.page}`} style={{ textAlign: 'center', padding: '4rem 0' }}>
                <h1 className={styles.title}>Votre Panier est vide</h1>
                <Link href="/catalog" className="btn btn-primary">
                    Continuer vos achats
                </Link>
            </div>
        );
    }

    const shipping = shippingCost(total);
    const totalWithShipping = total + (shipping / settings.exchangeRate); // Approximate for display, real calc in checkout

    return (
        <div className={`container ${styles.page}`}>
            <h1 className={styles.title}>Votre Panier</h1>

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
                                    Taille: {item.selectedSize} | Prix: {formatPrice(item.price)}
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
                                        Supprimer
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
                    <h2 className={styles.summaryTitle}>Résumé</h2>
                    <div className={styles.summaryRow}>
                        <span>Sous-total</span>
                        <span>{formatPrice(total)}</span>
                    </div>
                    <div className={styles.summaryRow}>
                        <span>Livraison estimée ({settings.code})</span>
                        <span>{shipping === 0 ? 'Gratuit' : formatPrice(shipping / settings.exchangeRate)}</span>
                    </div>
                    <div className={styles.totalRow}>
                        <span>Total estimé</span>
                        <span>{formatPrice(total + (shipping / settings.exchangeRate))}</span>
                    </div>
                    <Link href="/checkout" className={styles.checkoutBtn}>
                        Passer la commande
                    </Link>
                </div>
            </div>
        </div>
    );
}
