'use client';

import { useState, useEffect } from 'react';
import { useCart } from '@/lib/cart';
import { useCountry, CountryCode } from '@/lib/country';
import styles from './page.module.css';

export default function CheckoutPage() {
    const { items, total, clearCart } = useCart();
    const { country, setCountry, formatPrice, shippingCost, settings } = useCountry();

    const [step, setStep] = useState<'shipping' | 'payment'>('shipping');
    const [loading, setLoading] = useState(false);

    const shipping = shippingCost(total);
    // Calculate total in USD for logic, but display formatted
    const totalUSD = total + (shipping / settings.exchangeRate);

    const handleShippingSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        // Simulate API call for shipping calc
        setTimeout(() => {
            setLoading(false);
            setStep('payment');
        }, 1000);
    };

    const handlePaymentSubmit = () => {
        setLoading(true);
        // Simulate Square payment processing
        setTimeout(() => {
            setLoading(false);
            alert('Commande confirmée ! Merci pour votre achat.');
            clearCart();
            window.location.href = '/';
        }, 2000);
    };

    if (items.length === 0) {
        return (
            <div className="container" style={{ textAlign: 'center', padding: '4rem 0' }}>
                <h1>Votre panier est vide</h1>
            </div>
        );
    }

    return (
        <div className={`container ${styles.container}`}>
            <div className={styles.layout}>
                <div className={styles.formSection}>
                    <h2 className={styles.sectionTitle}>
                        {step === 'shipping' ? 'Adresse de Livraison' : 'Paiement Sécurisé'}
                    </h2>

                    {step === 'shipping' ? (
                        <form onSubmit={handleShippingSubmit} className={styles.formGrid}>
                            <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                                <label className={styles.label}>Pays</label>
                                <select
                                    className={styles.select}
                                    required
                                    value={country}
                                    onChange={(e) => setCountry(e.target.value as CountryCode)}
                                >
                                    <option value="US">États-Unis (USA)</option>
                                    <option value="CA">Canada</option>
                                    <option value="MX">Mexique</option>
                                </select>
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.label}>Prénom</label>
                                <input type="text" className={styles.input} required />
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.label}>Nom</label>
                                <input type="text" className={styles.input} required />
                            </div>

                            <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                                <label className={styles.label}>Adresse</label>
                                <input type="text" className={styles.input} required />
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.label}>Ville</label>
                                <input type="text" className={styles.input} required />
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.label}>Code Postal</label>
                                <input type="text" className={styles.input} required />
                            </div>

                            <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                                <label className={styles.label}>Téléphone</label>
                                <input type="tel" className={styles.input} required />
                            </div>

                            <button type="submit" className={`${styles.submitBtn} ${styles.fullWidth}`} disabled={loading}>
                                {loading ? 'Calcul...' : 'Continuer vers le paiement'}
                            </button>
                        </form>
                    ) : (
                        <div>
                            <div className={styles.paymentPlaceholder}>
                                <h3>Square Payment Integration</h3>
                                <p>Formulaire de carte de crédit sécurisé apparaîtra ici.</p>
                                <div style={{ margin: '20px 0', fontSize: '2rem' }}>💳 🔒</div>
                            </div>
                            <button onClick={handlePaymentSubmit} className={styles.submitBtn} disabled={loading}>
                                {loading ? 'Traitement...' : `Payer ${formatPrice(totalUSD)}`}
                            </button>
                            <button
                                onClick={() => setStep('shipping')}
                                style={{ marginTop: '1rem', textDecoration: 'underline', width: '100%', textAlign: 'center', cursor: 'pointer' }}
                            >
                                Retour
                            </button>
                        </div>
                    )}
                </div>

                <div className={styles.summary}>
                    <h3 className={styles.sectionTitle}>Récapitulatif</h3>
                    {items.map((item) => (
                        <div key={item.cartId} className={styles.summaryRow}>
                            <span>{item.name} x {item.quantity}</span>
                            <span>{formatPrice(item.price * item.quantity)}</span>
                        </div>
                    ))}
                    <div className={styles.summaryRow} style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e5e7eb' }}>
                        <span>Sous-total</span>
                        <span>{formatPrice(total)}</span>
                    </div>
                    <div className={styles.summaryRow}>
                        <span>Livraison</span>
                        <span>{shipping === 0 ? 'Gratuit' : formatPrice(shipping / settings.exchangeRate)}</span>
                    </div>
                    <div className={styles.totalRow}>
                        <span>Total</span>
                        <span>{formatPrice(totalUSD)}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
