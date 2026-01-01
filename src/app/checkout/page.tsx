'use client';

import { useState, useEffect, useRef } from 'react';
import { useCart } from '@/lib/cart';
import { useCountry, CountryCode } from '@/lib/country';
import { useLanguage } from '@/contexts/LanguageContext';
import { ShippingOption } from '@/lib/shipping-calculator';
import StripePaymentForm from '@/components/payment/StripePaymentForm';
import styles from './page.module.css';

interface ShippingAddress {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: CountryCode;
}

interface CustomerInfo {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
}

export default function CheckoutPage() {
    const { t } = useLanguage();
    const { items, total, clearCart } = useCart();
    const { country, setCountry, formatPrice, settings } = useCountry();

    const [step, setStep] = useState<'shipping' | 'payment'>('shipping');
    const [loading, setLoading] = useState(false);
    const [calculatingShipping, setCalculatingShipping] = useState(false);
    const [paymentError, setPaymentError] = useState<string | null>(null);
    const [paymentToken, setPaymentToken] = useState<string | null>(null);
    const paymentFormRef = useRef<{ submit: () => void } | null>(null);
    
    // Customer information
    const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
    });
    
    // Charger l'email depuis localStorage si disponible
    useEffect(() => {
        const savedEmail = localStorage.getItem('customer_email');
        if (savedEmail) {
            setCustomerInfo(prev => ({ ...prev, email: savedEmail }));
        }
    }, []);
    
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

    const handlePaymentTokenReceived = async (token: string) => {
        setPaymentToken(token);
        setPaymentError(null);
        
        // Procéder au checkout avec le token
        await processCheckout(token);
    };

    const handlePaymentError = (error: string) => {
        console.error('Payment Error:', error);
        setPaymentError(error);
        setLoading(false);
    };

    const processCheckout = async (token: string) => {
        setLoading(true);
        setPaymentError(null);

        try {
            // Vérifier que toutes les informations sont présentes
            if (!customerInfo.firstName || !customerInfo.lastName || !customerInfo.email || !customerInfo.phone) {
                throw new Error('Veuillez remplir tous les champs du formulaire de livraison');
            }

            if (!selectedShippingOption) {
                throw new Error('Veuillez sélectionner une option de livraison');
            }

            const currency = shippingAddress.country === 'US' ? 'USD' : 
                            shippingAddress.country === 'CA' ? 'CAD' : 'MXN';

            // Préparer les données pour l'API checkout
            const checkoutData = {
                customerName: String(`${customerInfo.firstName} ${customerInfo.lastName}`).trim(),
                customerEmail: String(customerInfo.email).trim(),
                customerPhone: String(customerInfo.phone || '').trim(),
                shippingAddress: {
                    street: String(shippingAddress.street).trim(),
                    city: String(shippingAddress.city).trim(),
                    state: String(shippingAddress.state).trim(),
                    zip: String(shippingAddress.zip).trim(),
                    country: String(shippingAddress.country).trim(),
                },
                items: items.map(item => {
                    // Extraire l'URL de l'image (ProductImage est un objet avec url, alt, etc.)
                    let imageUrl = '';
                    if (item.images && Array.isArray(item.images) && item.images.length > 0) {
                        const firstImage = item.images[0];
                        // Si c'est un objet ProductImage, extraire l'URL
                        if (typeof firstImage === 'string') {
                            imageUrl = firstImage;
                        } else if (firstImage && typeof firstImage === 'object') {
                            imageUrl = firstImage.url || firstImage.id || '';
                        }
                    }
                    
                    // Validation et conversion des valeurs
                    const quantity = Math.max(1, Math.floor(Number(item.quantity)) || 1);
                    const price = Math.max(0, Number(item.price) || 0);
                    
                    return {
                        productId: String(item.id || '').trim(),
                        name: String(item.name || '').trim(),
                        quantity: quantity,
                        price: price,
                        size: String(item.selectedSize || '').trim(),
                        image: String(imageUrl).trim(),
                    };
                }),
                paymentSourceId: String(token),
                currency: currency,
                subtotal: Math.max(0, Number(total) || 0),
                shippingCost: Math.max(0, Number(
                    selectedShippingOption.cost !== undefined 
                        ? selectedShippingOption.cost 
                        : ((selectedShippingOption as any).price / (settings.exchangeRate || 1))
                ) || 0),
                tax: Math.max(0, Number(taxAmount / settings.exchangeRate) || 0),
                total: Math.max(0, Number(totalUSD) || 0),
            };

            console.log('[Checkout] Données envoyées:', {
                ...checkoutData,
                paymentSourceId: token ? `${token.substring(0, 20)}...` : 'MANQUANT',
                itemsCount: checkoutData.items.length,
            });

            // Appeler l'API checkout
            const response = await fetch('/api/checkout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(checkoutData),
            });

            const data = await response.json();

            if (!response.ok) {
                // Afficher les détails de validation si disponibles
                let errorMessage = data.error || 'Erreur lors du traitement de la commande';
                if (data.details && Array.isArray(data.details)) {
                    const validationErrors = data.details.map((issue: any) => {
                        // path peut être une chaîne ou un tableau
                        const pathStr = Array.isArray(issue.path) 
                            ? issue.path.join('.') 
                            : (issue.path || 'Champ');
                        return `${pathStr}: ${issue.message}`;
                    }).join(', ');
                    errorMessage = `${errorMessage} - ${validationErrors}`;
                }
                console.error('Erreur checkout - détails:', data);
                throw new Error(errorMessage);
            }

            // Succès - rediriger vers la page de confirmation
            clearCart();
            window.location.href = `/order-confirmation?orderId=${data.order?.id || data.order?.orderNumber}`;
        } catch (error: any) {
            console.error('Erreur checkout:', error);
            const errorMessage = error.message || 'Erreur lors du traitement de la commande';
            setPaymentError(errorMessage);
            setLoading(false);
            
            // Rediriger vers la page d'échec si c'est une erreur de paiement
            if (errorMessage.includes('paiement') || errorMessage.includes('payment') || errorMessage.includes('carte')) {
                const errorCode = error.errorCode || 'processing_error';
                window.location.href = `/payment-failed?error=${encodeURIComponent(errorCode)}`;
            }
        }
    };

    const handlePaymentSubmit = () => {
        if (!paymentToken) {
            // Si pas de token, déclencher la soumission du formulaire Stripe
            if (typeof window !== 'undefined' && (window as any).__stripePaymentFormSubmit) {
                (window as any).__stripePaymentFormSubmit();
            } else {
                setPaymentError('Le formulaire de paiement n\'est pas encore prêt. Veuillez patienter.');
            }
        } else {
            // Si token déjà reçu, procéder directement
            processCheckout(paymentToken);
        }
    };

    // Tax calculation state
    const [taxAmount, setTaxAmount] = useState(0);
    const [taxRate, setTaxRate] = useState<{ rate: number; name: string } | null>(null);
    const [calculatingTax, setCalculatingTax] = useState(false);

    // Calculate shipping (utiliser cost si disponible, sinon price converti en USD)
    const shippingCostUSD = selectedShippingOption 
        ? (selectedShippingOption.cost !== undefined 
            ? selectedShippingOption.cost 
            : (selectedShippingOption as any).price / (settings.exchangeRate || 1))
        : 0;

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

    // Calculate total with tax (vérifier que shippingCostUSD n'est pas NaN)
    const validShippingCost = (isNaN(shippingCostUSD) || !isFinite(shippingCostUSD)) ? 0 : Math.max(0, shippingCostUSD);
    const validTaxAmount = (isNaN(taxAmount) || !isFinite(taxAmount)) ? 0 : Math.max(0, taxAmount);
    const totalUSD = Math.max(0, total + validShippingCost + (validTaxAmount / (settings.exchangeRate || 1)));

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
                                <input 
                                    type="text" 
                                    className={styles.input} 
                                    required 
                                    value={customerInfo.firstName}
                                    onChange={(e) => setCustomerInfo(prev => ({ ...prev, firstName: e.target.value }))}
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.label}>{t('lastName')}</label>
                                <input 
                                    type="text" 
                                    className={styles.input} 
                                    required 
                                    value={customerInfo.lastName}
                                    onChange={(e) => setCustomerInfo(prev => ({ ...prev, lastName: e.target.value }))}
                                />
                            </div>

                            <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                                <label className={styles.label}>Email</label>
                                <input 
                                    type="email" 
                                    className={styles.input} 
                                    required 
                                    value={customerInfo.email}
                                    onChange={(e) => setCustomerInfo(prev => ({ ...prev, email: e.target.value }))}
                                />
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
                                <input 
                                    type="tel" 
                                    className={styles.input} 
                                    required 
                                    value={customerInfo.phone}
                                    onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
                                />
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
                                                            {formatPrice(
                                                                option.cost !== undefined
                                                                    ? option.cost
                                                                    : ((option as any).price / settings.exchangeRate)
                                                            )}
                                                        </div>
                                                    </div>
                                                    {option.estimatedDays && (
                                                        <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                                                            {option.estimatedDays.min === option.estimatedDays.max 
                                                                ? `${option.estimatedDays.min} jour${option.estimatedDays.min > 1 ? 's' : ''}`
                                                                : `${option.estimatedDays.min}-${option.estimatedDays.max} jours ouvrables`}
                                                        </div>
                                                    )}
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
                            <div style={{ marginBottom: '1.5rem' }}>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.75rem' }}>
                                    Informations de paiement
                                </h3>
                                <p style={{ fontSize: '0.9rem', color: '#6b7280', marginBottom: '1rem' }}>
                                    Entrez les informations de votre carte de crédit. Le paiement est sécurisé par Stripe.
                                </p>
                                
                                {totalUSD > 0 && isFinite(totalUSD) ? (
                                    <StripePaymentForm
                                        onTokenReceived={handlePaymentTokenReceived}
                                        onError={handlePaymentError}
                                        amount={Math.round(totalUSD * 100)}
                                        currency={shippingAddress.country === 'US' ? 'USD' : 
                                                 shippingAddress.country === 'CA' ? 'CAD' : 'MXN'}
                                        disabled={loading}
                                    />
                                ) : (
                                    <div style={{
                                        padding: '1rem',
                                        background: '#fee2e2',
                                        borderRadius: '0.5rem',
                                        color: '#991b1b',
                                        fontSize: '0.9rem'
                                    }}>
                                        ⚠️ Impossible de calculer le montant total. Veuillez vérifier votre adresse de livraison et réessayer.
                                    </div>
                                )}

                                {paymentError && (
                                    <div style={{ 
                                        marginTop: '1rem',
                                        padding: '1rem', 
                                        background: '#fee2e2', 
                                        borderRadius: '0.5rem',
                                        color: '#991b1b',
                                        fontSize: '0.9rem'
                                    }}>
                                        ⚠️ {paymentError}
                                    </div>
                                )}
                            </div>

                            <button 
                                onClick={handlePaymentSubmit} 
                                className={styles.submitBtn} 
                                disabled={loading}
                                style={{ width: '100%' }}
                            >
                                {loading ? t('processing') : `${t('pay')} ${formatPrice(totalUSD)}`}
                            </button>
                            <button
                                onClick={() => {
                                    setStep('shipping');
                                    setPaymentError(null);
                                    setPaymentToken(null);
                                }}
                                style={{ marginTop: '1rem', textDecoration: 'underline', width: '100%', textAlign: 'center', cursor: 'pointer', background: 'none', border: 'none', color: '#6b7280' }}
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
                                ? formatPrice(
                                    selectedShippingOption.cost !== undefined
                                        ? selectedShippingOption.cost
                                        : ((selectedShippingOption as any).price / settings.exchangeRate)
                                )
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
