'use client';

import { useState, use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { mockProducts, getProductsByCategory } from '@/lib/products';
import ProductCard from '@/components/product/ProductCard';
import ProductReviews from '@/components/product/ProductReviews';
import ProductRecommendations from '@/components/product/ProductRecommendations';
import PaymentSecurityModal from '@/components/product/PaymentSecurityModal';
import FreeShippingModal from '@/components/product/FreeShippingModal';
import FreeReturnsModal from '@/components/product/FreeReturnsModal';
import SizeGuideModal from '@/components/product/SizeGuideModal';
import { useProductViewers } from '@/hooks/useProductViewers';
import styles from './page.module.css';
import { notFound } from 'next/navigation';
import { useCart } from '@/lib/cart';
import { useCountry } from '@/lib/country';
import { useWishlist } from '@/lib/wishlist';
import { useLanguage } from '@/contexts/LanguageContext';

type TabType = 'description' | 'features' | 'shipping';

export default function ProductPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const product = mockProducts.find((p) => p.id === id);

    const { addItem } = useCart();
    const { formatPrice } = useCountry();
    const { isInWishlist, toggleItem } = useWishlist();
    const { t } = useLanguage();
    const [selectedSize, setSelectedSize] = useState<string | null>(null);
    const [quantity, setQuantity] = useState(1);
    const [activeTab, setActiveTab] = useState<TabType>('description');
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    
    // Modal states
    const [paymentModalOpen, setPaymentModalOpen] = useState(false);
    const [shippingModalOpen, setShippingModalOpen] = useState(false);
    const [returnsModalOpen, setReturnsModalOpen] = useState(false);
    const [sizeGuideModalOpen, setSizeGuideModalOpen] = useState(false);
    
    // Real-time viewer count (hook must be called before conditional return)
    const viewerCount = useProductViewers({ productId: product?.id || '' });

    if (!product) {
        return notFound();
    }
    
    const isWishlisted = isInWishlist(product.id);

    // Get similar products from the same category
    const similarProducts = getProductsByCategory(product.category)
        .filter(p => p.id !== product.id)
        .slice(0, 4);

    // Calculate total stock for selected size
    const selectedVariant = product.variants.find(v => v.size === selectedSize);
    const totalStock = product.variants.reduce((sum, v) => sum + v.stock, 0);
    const maxQuantity = selectedVariant ? selectedVariant.stock : 1;

    const handleAddToCart = () => {
        if (!selectedSize) {
            alert(t('pleaseSelectSize'));
            return;
        }

        // Add to cart with the selected quantity
        for (let i = 0; i < quantity; i++) {
            addItem(product, selectedSize);
        }

        alert(`${quantity} ${t('addedToCart')}`);
    };

    const getStockStatus = () => {
        if (totalStock === 0) return { text: t('outOfStock'), class: 'outOfStock' };
        if (totalStock < 10) return { text: `${t('onlyLeft')} ${totalStock} ${t('leftInStock')}`, class: 'lowStock' };
        return { text: t('inStock'), class: '' };
    };

    const stockStatus = getStockStatus();

    return (
        <div className={styles.container}>
            {/* Breadcrumb */}
            <div className={styles.breadcrumb}>
                <Link href="/">{t('home')}</Link>
                <span>/</span>
                <Link href="/catalog">{t('catalog')}</Link>
                <span>/</span>
                <Link href={`/catalog?category=${product.category}`}>{product.category}</Link>
                <span>/</span>
                <span>{product.name}</span>
            </div>

            <div className={styles.mainLayout}>
                <div className={styles.grid}>
                    {/* Gallery */}
                    <div className={styles.gallery}>
                        <div className={styles.mainImageWrapper}>
                            {product.isNew && <div className={styles.newBadge}>{t('new')}</div>}
                            <div className={styles.mainImageContainer}>
                                <div style={{
                                    width: '100%',
                                    height: '100%',
                                    background: `linear-gradient(135deg, ${selectedImageIndex % 2 === 0 ? '#3B82F6' : '#10B981'} 0%, ${selectedImageIndex % 2 === 0 ? '#1E40AF' : '#059669'} 100%)`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'white',
                                    fontSize: '1.5rem',
                                    fontWeight: 'bold',
                                    borderRadius: '1rem',
                                    transition: 'transform 0.3s ease'
                                }}>
                                    {product.name}
                                </div>
                            </div>
                        </div>
                        <div className={styles.thumbnails}>
                            {product.images.map((img, index) => (
                                <div
                                    key={img.id}
                                    className={`${styles.thumbnail} ${selectedImageIndex === index ? styles.active : ''}`}
                                    onClick={() => setSelectedImageIndex(index)}
                                >
                                    <div style={{
                                        width: '100%',
                                        height: '100%',
                                        background: `linear-gradient(135deg, ${index % 2 === 0 ? '#3B82F6' : '#10B981'} ${index * 20}%, ${index % 2 === 0 ? '#1E40AF' : '#059669'} 100%)`,
                                        borderRadius: '0.5rem',
                                        transition: 'all 0.2s'
                                    }} />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Info */}
                    <div className={styles.info}>
                    <span className={styles.category}>{product.category}</span>
                    <h1 className={styles.title}>{product.name}</h1>
                    <div className={styles.price}>{formatPrice(product.price)}</div>

                    {/* Stock Status */}
                    <div className={`${styles.stockInfo} ${styles[stockStatus.class]}`}>
                        <span className={styles.stockDot}></span>
                        {stockStatus.text}
                    </div>

                    {/* Size Selection */}
                    <div className={styles.section}>
                        <span className={styles.sectionTitle}>Taille</span>
                        <div className={styles.sizeGrid}>
                            {product.variants.map((variant) => (
                                <button
                                    key={variant.size}
                                    className={`${styles.sizeBtn} ${selectedSize === variant.size ? styles.selected : ''}`}
                                    onClick={() => setSelectedSize(variant.size)}
                                    disabled={variant.stock === 0}
                                >
                                    {variant.size}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Quantity Selector */}
                    {selectedSize && (
                        <div className={styles.section}>
                            <span className={styles.sectionTitle}>Quantité</span>
                            <div className={styles.quantitySelector}>
                                <button
                                    className={styles.quantityBtn}
                                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                    disabled={quantity <= 1}
                                >
                                    −
                                </button>
                                <span className={styles.quantityValue}>{quantity}</span>
                                <button
                                    className={styles.quantityBtn}
                                    onClick={() => setQuantity(Math.min(maxQuantity, quantity + 1))}
                                    disabled={quantity >= maxQuantity}
                                >
                                    +
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Tabs for Description, Features, Shipping */}
                    <div className={styles.section}>
                        <div className={styles.tabs}>
                            <button
                                className={`${styles.tab} ${activeTab === 'description' ? styles.active : ''}`}
                                onClick={() => setActiveTab('description')}
                            >
                                Description
                            </button>
                            <button
                                className={`${styles.tab} ${activeTab === 'features' ? styles.active : ''}`}
                                onClick={() => setActiveTab('features')}
                            >
                                Caractéristiques
                            </button>
                            <button
                                className={`${styles.tab} ${activeTab === 'shipping' ? styles.active : ''}`}
                                onClick={() => setActiveTab('shipping')}
                            >
                                Livraison
                            </button>
                        </div>

                        <div className={styles.tabContent}>
                            {activeTab === 'description' && (
                                <p className={styles.description}>{product.detailedDescription}</p>
                            )}
                            {activeTab === 'features' && (
                                <div className={styles.features}>
                                    {product.features.map((feature, index) => (
                                        <div key={index} className={styles.feature}>
                                            <span className={styles.featureName}>{feature.name}</span>
                                            <span className={styles.featureValue}>{feature.value}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {activeTab === 'shipping' && (
                                <div className={styles.description}>
                                    <p><strong>Livraison Rapide</strong></p>
                                    <p>Nous livrons dans toute l'Amérique du Nord :</p>
                                    <ul style={{ marginLeft: '1.5rem', marginTop: '0.5rem' }}>
                                        <li>🇺🇸 États-Unis : 3-7 jours ouvrables</li>
                                        <li>🇨🇦 Canada : 4-10 jours ouvrables</li>
                                        <li>🇲🇽 Mexique : 5-14 jours ouvrables</li>
                                    </ul>
                                    <p style={{ marginTop: '1rem' }}>
                                        <strong>Retours gratuits</strong> sous 30 jours
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className={styles.actionButtons}>
                        <button
                            className={styles.addToCartBtn}
                            onClick={handleAddToCart}
                            disabled={totalStock === 0}
                        >
                            {totalStock === 0 ? 'Rupture de stock' : 'Ajouter au Panier'}
                        </button>
                        <button
                            className={styles.wishlistBtn}
                            onClick={() => toggleItem(product)}
                            aria-label={t('addToWishlist')}
                        >
                            <svg 
                                width="24" 
                                height="24" 
                                viewBox="0 0 24 24" 
                                fill={isWishlisted ? "currentColor" : "none"} 
                                stroke="currentColor" 
                                strokeWidth="2"
                            >
                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                            </svg>
                        </button>
                    </div>

                    {viewerCount !== null && viewerCount > 0 && (
                        <div className={styles.engagementInfo}>
                            <span className={styles.engagementText}>
                                {viewerCount} {viewerCount === 1 ? 'personne regarde' : 'personnes regardent'} ce produit
                            </span>
                        </div>
                    )}

                    <div className={styles.serviceIcons}>
                        <button 
                            onClick={() => setPaymentModalOpen(true)}
                            className={styles.serviceIcon}
                            style={{ border: 'none', background: 'none', cursor: 'pointer', width: '100%' }}
                        >
                            <span className={styles.icon}>🔒</span>
                            <span>Paiement Sécurisé</span>
                        </button>
                        <button 
                            onClick={() => setShippingModalOpen(true)}
                            className={styles.serviceIcon}
                            style={{ border: 'none', background: 'none', cursor: 'pointer', width: '100%' }}
                        >
                            <span className={styles.icon}>🚚</span>
                            <span>Options de Livraison</span>
                        </button>
                        <button 
                            onClick={() => setReturnsModalOpen(true)}
                            className={styles.serviceIcon}
                            style={{ border: 'none', background: 'none', cursor: 'pointer', width: '100%' }}
                        >
                            <span className={styles.icon}>↩️</span>
                            <span>Retours Gratuits</span>
                        </button>
                        <button 
                            onClick={() => setSizeGuideModalOpen(true)}
                            className={styles.serviceIcon}
                            style={{ border: 'none', background: 'none', cursor: 'pointer', width: '100%' }}
                        >
                            <span className={styles.icon}>📏</span>
                            <span>Taille & Ajustement</span>
                        </button>
                    </div>
                    </div>
                </div>
            </div>

            {/* Recommendations Sidebar */}
            <div className={styles.sidebar}>
                <ProductRecommendations products={similarProducts.slice(0, 4)} />
            </div>

            {/* Reviews Section */}
            <ProductReviews />

            {/* Modals */}
            <PaymentSecurityModal 
                isOpen={paymentModalOpen} 
                onClose={() => setPaymentModalOpen(false)} 
            />
            <FreeShippingModal 
                isOpen={shippingModalOpen} 
                onClose={() => setShippingModalOpen(false)}
                productPrice={product.price}
            />
            <FreeReturnsModal 
                isOpen={returnsModalOpen} 
                onClose={() => setReturnsModalOpen(false)} 
            />
            <SizeGuideModal 
                isOpen={sizeGuideModalOpen} 
                onClose={() => setSizeGuideModalOpen(false)} 
            />
        </div>
    );
}
