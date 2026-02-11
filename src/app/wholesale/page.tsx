'use client';

import { useState, useEffect } from 'react';
import { useCountry } from '@/lib/country';
import { useLanguage } from '@/contexts/LanguageContext';
import { Product } from '@/lib/types';
import styles from './page.module.css';
import { filterVariantsByCategory } from '@/lib/product-utils';

interface WholesaleItem {
    productId: string;
    productName: string;
    size: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
}

export default function WholesalePage() {
    const { t } = useLanguage();
    const { formatPrice } = useCountry();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        companyName: '',
        contactName: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        zip: '',
        country: 'US' as 'US' | 'CA' | 'MX',
        taxId: '',
        notes: '',
    });

    const [items, setItems] = useState<WholesaleItem[]>([]);
    const [selectedProduct, setSelectedProduct] = useState('');
    const [selectedSize, setSelectedSize] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [submitting, setSubmitting] = useState(false);

    // Charger les produits depuis l'API
    useEffect(() => {
        async function fetchProducts() {
            try {
                setLoading(true);
                const response = await fetch('/api/products');
                if (response.ok) {
                    const data = await response.json();
                    setProducts(data.products || []);
                }
            } catch (err) {
                console.error('Error fetching products:', err);
            } finally {
                setLoading(false);
            }
        }
        fetchProducts();
    }, []);

    const getDiscount = (totalQuantity: number) => {
        if (totalQuantity >= 48) return 50;
        if (totalQuantity >= 24) return 40;
        if (totalQuantity >= 12) return 30;
        return 0;
    };

    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
    const discount = getDiscount(totalQuantity);
    const discountAmount = (subtotal * discount) / 100;
    const total = subtotal - discountAmount;

    // Stock déjà réservé dans le panier pour un produit+taille
    const getReservedQuantity = (productId: string, size: string) =>
        items
            .filter((i) => i.productId === productId && i.size === size)
            .reduce((sum, i) => sum + i.quantity, 0);

    const selectedProductData = products.find((p) => p.id === selectedProduct);

    // Produits avec au moins une variante en stock
    const productsWithStock = products.filter((product) => {
        const variants = filterVariantsByCategory(product.variants || [], product.category);
        return variants.some((v) => v.stock > 0);
    });

    // Variantes en stock pour le produit sélectionné
    const availableVariants = selectedProductData
        ? filterVariantsByCategory(
              selectedProductData.variants || [],
              selectedProductData.category
          ).filter((v) => v.stock > 0)
        : [];

    // Stock disponible pour la sélection actuelle
    const availableStock = selectedProductData && selectedSize
        ? (() => {
              const variant = filterVariantsByCategory(
                  selectedProductData.variants || [],
                  selectedProductData.category
              ).find((v) => v.size === selectedSize);
              if (!variant || variant.stock <= 0) return 0;
              const reserved = getReservedQuantity(selectedProduct, selectedSize);
              return Math.max(0, variant.stock - reserved);
          })()
        : 0;

    const handleAddItem = () => {
        if (!selectedProduct || !selectedSize || quantity < 1) {
            alert(t('pleaseSelectProduct'));
            return;
        }

        const product = products.find((p) => p.id === selectedProduct);
        if (!product) return;

        const variant = filterVariantsByCategory(product.variants || [], product.category).find(
            (v) => v.size === selectedSize
        );
        if (!variant || variant.stock <= 0) {
            alert(t('outOfStock') || 'Ce produit n\'est plus disponible.');
            return;
        }

        const reserved = getReservedQuantity(selectedProduct, selectedSize);
        const maxQty = Math.max(0, variant.stock - reserved);
        if (quantity > maxQty) {
            alert(
                `Stock disponible : ${maxQty} unité(s). Vous ne pouvez pas commander plus.` +
                    (maxQty === 0 ? '\nCe produit/taille est déjà en quantité maximale dans votre demande.' : '')
            );
            return;
        }

        const unitPrice = product.price;
        const totalPrice = unitPrice * quantity;

        const newItem: WholesaleItem = {
            productId: product.id,
            productName: product.name,
            size: selectedSize,
            quantity,
            unitPrice,
            totalPrice,
        };

        setItems([...items, newItem]);
        setSelectedProduct('');
        setSelectedSize('');
        setQuantity(1);
    };

    const handleRemoveItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (items.length === 0) {
            alert(t('pleaseAddItem'));
            return;
        }

        if (totalQuantity < 12) {
            alert(t('minimum12Items'));
            return;
        }

        setSubmitting(true);

        const orderData = {
            ...formData,
            items,
            totalQuantity,
            subtotal,
            discount,
            discountAmount,
            total,
        };

        try {
            const response = await fetch('/api/wholesale', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderData),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Erreur lors de l\'envoi de la demande');
            }

            alert(`${t('wholesaleSubmitted')}\n\n${t('total')}: ${formatPrice(total)}\n${t('items')}: ${totalQuantity}\n${t('discountLabel')}: ${discount}%`);
            
            setFormData({
                companyName: '',
                contactName: '',
                email: '',
                phone: '',
                address: '',
                city: '',
                state: '',
                zip: '',
                country: 'US',
                taxId: '',
                notes: '',
            });
            setItems([]);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Erreur lors de l\'envoi. Veuillez réessayer.';
            alert(`❌ ${message}`);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>{t('wholesaleTitle')}</h1>
                <p className={styles.subtitle}>
                    {t('wholesaleSubtitle2')}
                </p>
            </div>

            <div className={styles.discountBanner}>
                <div className={styles.discountCard}>
                    <div className={styles.discountAmount}>30%</div>
                    <div className={styles.discountLabel}>12-23 articles</div>
                </div>
                <div className={styles.discountCard}>
                    <div className={styles.discountAmount}>40%</div>
                    <div className={styles.discountLabel}>24-47 articles</div>
                </div>
                <div className={styles.discountCard}>
                    <div className={styles.discountAmount}>50%</div>
                    <div className={styles.discountLabel}>48+ articles</div>
                </div>
            </div>

            <div className={styles.layout}>
                <div className={styles.formSection}>
                    <h2 className={styles.sectionTitle}>{t('companyInfo')}</h2>
                    <form onSubmit={handleSubmit} className={styles.form}>
                        <div className={styles.formGrid}>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>{t('companyName')} *</label>
                                <input
                                    type="text"
                                    className={styles.input}
                                    value={formData.companyName}
                                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                                    required
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.label}>{t('contactName')} *</label>
                                <input
                                    type="text"
                                    className={styles.input}
                                    value={formData.contactName}
                                    onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                                    required
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.label}>Email *</label>
                                <input
                                    type="email"
                                    className={styles.input}
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    required
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.label}>Téléphone *</label>
                                <input
                                    type="tel"
                                    className={styles.input}
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    required
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.label}>Pays *</label>
                                <select
                                    className={styles.input}
                                    value={formData.country}
                                    onChange={(e) => setFormData({ ...formData, country: e.target.value as 'US' | 'CA' | 'MX' })}
                                    required
                                >
                                    <option value="US">États-Unis</option>
                                    <option value="CA">Canada</option>
                                    <option value="MX">Mexique</option>
                                </select>
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.label}>{t('taxId')}</label>
                                <input
                                    type="text"
                                    className={styles.input}
                                    value={formData.taxId}
                                    onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                                    placeholder="EIN, SIRET, RFC, etc."
                                />
                            </div>

                            <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                                <label className={styles.label}>{t('street')} *</label>
                                <input
                                    type="text"
                                    className={styles.input}
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    required
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.label}>{t('city')} *</label>
                                <input
                                    type="text"
                                    className={styles.input}
                                    value={formData.city}
                                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                    required
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.label}>{t('state')} *</label>
                                <input
                                    type="text"
                                    className={styles.input}
                                    value={formData.state}
                                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                                    required
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.label}>{t('postalCode')} *</label>
                                <input
                                    type="text"
                                    className={styles.input}
                                    value={formData.zip}
                                    onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
                                    required
                                />
                            </div>

                            <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                                <label className={styles.label}>{t('notes')}</label>
                                <textarea
                                    className={styles.textarea}
                                    rows={4}
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    placeholder="Instructions spéciales, délais de livraison, etc."
                                />
                            </div>
                        </div>

                        <h2 className={styles.sectionTitle} style={{ marginTop: '2rem' }}>{t('orderItems') || 'Articles de la Commande'}</h2>
                        
                        <div className={styles.addItemSection}>
                            <div className={styles.addItemForm}>
                                <select
                                    className={styles.select}
                                    value={selectedProduct}
                                    onChange={(e) => {
                                        setSelectedProduct(e.target.value);
                                        setSelectedSize('');
                                        setQuantity(1);
                                    }}
                                    disabled={loading}
                                >
                                    <option value="">{loading ? 'Chargement...' : (t('selectProduct') || 'Sélectionner un produit')}</option>
                                    {productsWithStock.map((product) => (
                                        <option key={product.id} value={product.id}>
                                            {product.name} - {formatPrice(product.price)}
                                        </option>
                                    ))}
                                    {productsWithStock.length === 0 && !loading && (
                                        <option value="" disabled>Aucun produit disponible en stock</option>
                                    )}
                                </select>

                                {selectedProductData && (
                                    <select
                                        className={styles.select}
                                        value={selectedSize}
                                        onChange={(e) => {
                                            setSelectedSize(e.target.value);
                                            setQuantity(1);
                                        }}
                                    >
                                        <option value="">{t('selectSize')}</option>
                                        {availableVariants.map((variant) => {
                                            const reserved = getReservedQuantity(selectedProduct, variant.size);
                                            const disp = Math.max(0, variant.stock - reserved);
                                            return (
                                                <option
                                                    key={variant.size}
                                                    value={variant.size}
                                                    disabled={disp <= 0}
                                                >
                                                    {variant.size} ({disp} disponible{disp !== 1 ? 's' : ''})
                                                </option>
                                            );
                                        })}
                                    </select>
                                )}

                                <input
                                    type="number"
                                    className={styles.select}
                                    min={1}
                                    max={availableStock}
                                    value={Math.min(quantity, Math.max(1, availableStock))}
                                    onChange={(e) => {
                                        const val = parseInt(e.target.value, 10) || 0;
                                        setQuantity(Math.min(Math.max(1, val), availableStock));
                                    }}
                                    placeholder={t('quantity')}
                                    disabled={availableStock <= 0}
                                />

                                <button
                                    type="button"
                                    className={styles.addButton}
                                    onClick={handleAddItem}
                                >
                                    Ajouter
                                </button>
                            </div>
                        </div>

                        {items.length > 0 && (
                            <div className={styles.itemsTable}>
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Produit</th>
                                            <th>Taille</th>
                                            <th>Quantité</th>
                                            <th>Prix unitaire</th>
                                            <th>Total</th>
                                            <th></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {items.map((item, index) => (
                                            <tr key={index}>
                                                <td>{item.productName}</td>
                                                <td>{item.size}</td>
                                                <td>{item.quantity}</td>
                                                <td>{formatPrice(item.unitPrice)}</td>
                                                <td>{formatPrice(item.totalPrice)}</td>
                                                <td>
                                                    <button
                                                        type="button"
                                                        className={styles.removeButton}
                                                        onClick={() => handleRemoveItem(index)}
                                                    >
                                                        ✕
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {items.length > 0 && (
                            <div className={styles.summary}>
                                <div className={styles.summaryRow}>
                                    <span>Total articles:</span>
                                    <span>{totalQuantity}</span>
                                </div>
                                <div className={styles.summaryRow}>
                                    <span>Sous-total:</span>
                                    <span>{formatPrice(subtotal)}</span>
                                </div>
                                {discount > 0 && (
                                    <>
                                        <div className={styles.summaryRow}>
                                            <span>Réduction ({discount}%):</span>
                                            <span className={styles.discountText}>-{formatPrice(discountAmount)}</span>
                                        </div>
                                        <div className={styles.summaryRowTotal}>
                                            <span>Total:</span>
                                            <span>{formatPrice(total)}</span>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                        <button
                            type="submit"
                            className={styles.submitButton}
                            disabled={items.length === 0 || totalQuantity < 12 || submitting}
                        >
                            {submitting 
                                ? 'Envoi en cours...' 
                                : totalQuantity < 12 
                                    ? `Ajoutez ${12 - totalQuantity} article(s) de plus (minimum 12)` 
                                    : t('submitRequest')}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

