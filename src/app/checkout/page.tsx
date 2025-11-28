'use client';

import { useState, useEffect } from 'react';
import { useCart } from '@/lib/cart';
import { useCountry, CountryCode } from '@/lib/country';
import { useLanguage } from '@/contexts/LanguageContext';
import { ShippingOption } from '@/lib/shipping-calculator';
import styles from './page.module.css';

interface ShippingAddress {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: CountryCode;
}

export default function CheckoutPage() {
    const { t } = useLanguage();
    const { items, total, clearCart } = useCart();
    const { country, setCountry, formatPrice, settings } = useCountry();

    const [step, setStep] = useState<'shipping' | 'payment'>('shipping');
    const [loading, setLoading] = useState(false);
    const [calculatingShipping, setCalculatingShipping] = useState(false);
    
    // Shipping address form
    const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
        street: '',
        city: '',
        state: '',
        zip: '',
        country: country,
    });

    // Shipping options and selected option
    const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
    const [selectedShippingOption, setSelectedShippingOption] = useState<ShippingOption | null>(null);
    const [shippingError, setShippingError] = useState<string | null>(null);

    // Calculate shipping when address is complete
    useEffect(() => {
        const hasCompleteAddress = 
            shippingAddress.street && 
            shippingAddress.city && 
            shippingAddress.state && 
            shippingAddress.zip &&
            shippingAddress.country;

        if (hasCompleteAddress && items.length > 0) {
            const timeoutId = setTimeout(() => {
                calculateShippingRates();
            }, 500); // Debounce 500ms

            return () => clearTimeout(timeoutId);
        } else {
            setShippingOptions([]);
            setSelectedShippingOption(null);
        }
    }, [shippingAddress, items]);

    const calculateShippingRates = async () => {
        setCalculatingShipping(true);
        setShippingError(null);

        try {
            const response = await fetch('/api/shipping/calculate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    shippingAddress: {
                        ...shippingAddress,
                        country: shippingAddress.country,
                    },
                    items: items.map(item => ({
                        quantity: item.quantity,
                        weight: 1, // Default weight per item, can be customized
                    })),
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Erreur lors du calcul des frais de livraison');
            }

            setShippingOptions(data.options || []);
            
            // Auto-select cheapest option
            if (data.options && data.options.length > 0) {
                setSelectedShippingOption(data.options[0]);
            }
        } catch (error: any) {
            console.error('Error calculating shipping:', error);
            setShippingError(error.message || 'Impossible de calculer les frais de livraison');
            setShippingOptions([]);
        } finally {
            setCalculatingShipping(false);
        }
    };

    const handleShippingSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!selectedShippingOption) {
            alert('Veuillez sélectionner une option de livraison');
            return;
        }

        setStep('payment');
    };

    const handlePaymentSubmit = () => {
        setLoading(true);
        // Simulate Square payment processing
        setTimeout(() => {
            setLoading(false);
            alert(t('orderConfirmed'));
            clearCart();
            window.location.href = '/';
        }, 2000);
    };

    // Tax calculation state
    const [taxAmount, setTaxAmount] = useState(0);
    const [taxRate, setTaxRate] = useState<{ rate: number; name: string } | null>(null);
    const [calculatingTax, setCalculatingTax] = useState(false);

    // Calculate shipping
    const shippingCostUSD = selectedShippingOption ? selectedShippingOption.cost / (settings.exchangeRate || 1) : 0;

    // Calculate tax when address is complete
    useEffect(() => {
        const hasCompleteAddress = 
            shippingAddress.street && 
            shippingAddress.city && 
            shippingAddress.state && 
            shippingAddress.zip &&
            shippingAddress.country &&
            items.length > 0;

        if (hasCompleteAddress && total > 0) {
            setCalculatingTax(true);
            const timeoutId = setTimeout(() => {
                calculateTaxAmount();
            }, 300); // Debounce 300ms

            return () => clearTimeout(timeoutId);
        } else {
            setTaxAmount(0);
            setTaxRate(null);
        }
    }, [shippingAddress, total, shippingCostUSD, items]);

    const calculateTaxAmount = async () => {
        try {
            const currency = shippingAddress.country === 'US' ? 'USD' : 
                            shippingAddress.country === 'CA' ? 'CAD' : 'MXN';

            const response = await fetch('/api/tax/calculate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    subtotal: total,
                    shipping: shippingCostUSD,
                    country: shippingAddress.country,
                    state: shippingAddress.state,
                    currency,
                }),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                setTaxAmount(data.tax);
                setTaxRate({
                    rate: data.taxRate.rate,
                    name: data.taxRate.name,
                });
            } else {
                setTaxAmount(0);
                setTaxRate(null);
            }
        } catch (error) {
            console.error('Error calculating tax:', error);
            setTaxAmount(0);
            setTaxRate(null);
        } finally {
            setCalculatingTax(false);
        }
    };

    // Calculate total with tax
    const totalUSD = total + shippingCostUSD + (taxAmount / settings.exchangeRate);

    if (items.length === 0) {
        return (
            <div className="container" style={{ textAlign: 'center', padding: '4rem 0' }}>
                <h1>{t('cartEmptyCheckout')}</h1>
            </div>
        );
    }

    return (
        <div className={`container ${styles.container}`}>
            <div className={styles.layout}>
                <div className={styles.formSection}>
                    <h2 className={styles.sectionTitle}>
                        {step === 'shipping' ? t('shippingAddress') : t('securePayment')}
                    </h2>

                    {step === 'shipping' ? (
                        <form onSubmit={handleShippingSubmit} className={styles.formGrid}>
                            <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                                <label className={styles.label}>{t('country')}</label>
                                <select
                                    className={styles.select}
                                    required
                                    value={shippingAddress.country}
                                    onChange={(e) => {
                                        const newCountry = e.target.value as CountryCode;
                                        setCountry(newCountry);
                                        setShippingAddress(prev => ({ ...prev, country: newCountry }));
                                    }}
                                >
                                    <option value="US">🇺🇸 États-Unis (USA)</option>
                                    <option value="CA">🇨🇦 Canada (CA)</option>
                                    <option value="MX">🇲🇽 Mexique (MX)</option>
                                </select>
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.label}>{t('firstName')}</label>
                                <input type="text" className={styles.input} required />
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.label}>{t('lastName')}</label>
                                <input type="text" className={styles.input} required />
                            </div>

                            <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                                <label className={styles.label}>{t('street')}</label>
                                <input 
                                    type="text" 
                                    className={styles.input} 
                                    required 
                                    value={shippingAddress.street}
                                    onChange={(e) => setShippingAddress(prev => ({ ...prev, street: e.target.value }))}
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.label}>{t('city')}</label>
                                <input 
                                    type="text" 
                                    className={styles.input} 
                                    required 
                                    value={shippingAddress.city}
                                    onChange={(e) => setShippingAddress(prev => ({ ...prev, city: e.target.value }))}
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.label}>{t('state')}</label>
                                <input 
                                    type="text" 
                                    className={styles.input} 
                                    required 
                                    value={shippingAddress.state}
                                    onChange={(e) => setShippingAddress(prev => ({ ...prev, state: e.target.value }))}
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.label}>{t('postalCode')}</label>
                                <input 
                                    type="text" 
                                    className={styles.input} 
                                    required 
                                    value={shippingAddress.zip}
                                    onChange={(e) => setShippingAddress(prev => ({ ...prev, zip: e.target.value }))}
                                />
                            </div>

                            <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                                <label className={styles.label}>{t('phone')}</label>
                                <input type="tel" className={styles.input} required />
                            </div>

                            {/* Shipping Options */}
                            {calculatingShipping && (
                                <div className={`${styles.formGroup} ${styles.fullWidth}`} style={{ padding: '1rem', background: '#f9fafb', borderRadius: '0.5rem', textAlign: 'center' }}>
                                    <div style={{ fontSize: '0.9rem', color: '#6b7280' }}>
                                        🔄 Calcul des frais de livraison...
                                    </div>
                                </div>
                            )}

                            {shippingError && (
                                <div className={`${styles.formGroup} ${styles.fullWidth}`} style={{ padding: '1rem', background: '#fee2e2', borderRadius: '0.5rem', color: '#991b1b' }}>
                                    ⚠️ {shippingError}
                                </div>
                            )}

                            {shippingOptions.length > 0 && (
                                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                                    <label className={styles.label} style={{ marginBottom: '0.75rem', display: 'block' }}>
                                        Choisissez votre option de livraison
                                    </label>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                        {shippingOptions.map((option, index) => (
                                            <label
                                                key={`${option.carrier}-${option.service}`}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    padding: '1rem',
                                                    border: `2px solid ${selectedShippingOption?.carrier === option.carrier && selectedShippingOption?.service === option.service ? '#111827' : '#e5e7eb'}`,
                                                    borderRadius: '0.5rem',
                                                    cursor: 'pointer',
                                                    background: selectedShippingOption?.carrier === option.carrier && selectedShippingOption?.service === option.service ? '#f9fafb' : 'white',
                                                    transition: 'all 0.2s'
                                                }}
                                            >
                                                <input
                                                    type="radio"
                                                    name="shippingOption"
                                                    value={index}
                                                    checked={selectedShippingOption?.carrier === option.carrier && selectedShippingOption?.service === option.service}
                                                    onChange={() => setSelectedShippingOption(option)}
                                                    style={{ marginRight: '0.75rem' }}
                                                />
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                                                        <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>
                                                            {option.carrier === 'USPS' ? '📮' : '🚚'} {option.serviceName}
                                                        </div>
                                                        <div style={{ fontWeight: 700, fontSize: '1rem', color: '#111827' }}>
                                                            {formatPrice(option.cost / settings.exchangeRate)}
                                                        </div>
                                                    </div>
                                                    <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                                                        {option.estimatedDays.min === option.estimatedDays.max 
                                                            ? `${option.estimatedDays.min} jour${option.estimatedDays.min > 1 ? 's' : ''}`
                                                            : `${option.estimatedDays.min}-${option.estimatedDays.max} jours ouvrables`}
                                                    </div>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <button 
                                type="submit" 
                                className={`${styles.submitBtn} ${styles.fullWidth}`} 
                                disabled={loading || calculatingShipping || !selectedShippingOption}
                            >
                                {loading ? t('calculating') : t('continueToPayment')}
                            </button>
                        </form>
                    ) : (
                        <div>
                            <div className={styles.paymentPlaceholder}>
                                <h3>Square Payment Integration</h3>
                                <p>{t('creditCardForm')}</p>
                                <div style={{ margin: '20px 0', fontSize: '2rem' }}>💳 🔒</div>
                            </div>
                            <button onClick={handlePaymentSubmit} className={styles.submitBtn} disabled={loading}>
                                {loading ? t('processing') : `${t('pay')} ${formatPrice(totalUSD)}`}
                            </button>
                            <button
                                onClick={() => setStep('shipping')}
                                style={{ marginTop: '1rem', textDecoration: 'underline', width: '100%', textAlign: 'center', cursor: 'pointer' }}
                            >
                                {t('back')}
                            </button>
                        </div>
                    )}
                </div>

                <div className={styles.summary}>
                    <h3 className={styles.sectionTitle}>{t('summary')}</h3>
                    {items.map((item) => (
                        <div key={item.cartId} className={styles.summaryRow}>
                            <span>{item.name} x {item.quantity}</span>
                            <span>{formatPrice(item.price * item.quantity)}</span>
                        </div>
                    ))}
                    <div className={styles.summaryRow} style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e5e7eb' }}>
                        <span>{t('subtotal')}</span>
                        <span>{formatPrice(total)}</span>
                    </div>
                    <div className={styles.summaryRow}>
                        <span>{t('shipping')}</span>
                        <span>
                            {selectedShippingOption 
                                ? formatPrice(selectedShippingOption.cost / settings.exchangeRate)
                                : calculatingShipping 
                                    ? t('calculating') 
                                    : shippingError 
                                        ? 'N/A' 
                                        : '—'}
                        </span>
                    </div>
                    {selectedShippingOption && (
                        <div style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '0.25rem', paddingLeft: '0.5rem' }}>
                            {selectedShippingOption.carrier} - {selectedShippingOption.serviceName}
                        </div>
                    )}
                    <div className={styles.summaryRow}>
                        <span>
                            {taxRate ? `${t('tax')} (${taxRate.name} ${taxRate.rate}%)` : t('tax')}
                        </span>
                        <span>
                            {calculatingTax 
                                ? t('calculating') 
                                : taxAmount > 0 
                                    ? formatPrice(taxAmount / settings.exchangeRate)
                                    : '—'}
                        </span>
                    </div>
                    <div className={styles.totalRow}>
                        <span>{t('total')}</span>
                        <span>{formatPrice(totalUSD)}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
