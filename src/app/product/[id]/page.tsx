'use client';

import { useState, use, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Product } from '@/lib/types';
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
import { findBestPromotion, calculateDiscountedPrice, Promotion } from '@/lib/promotions';
import { filterVariantsByCategory } from '@/lib/product-utils';

type TabType = 'description' | 'features' | 'shipping';

export default function ProductPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [product, setProduct] = useState<Product | null>(null);
    const [similarProducts, setSimilarProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const { addItem } = useCart();
    const { formatPrice } = useCountry();
    const { isInWishlist, toggleItem } = useWishlist();
    const { t } = useLanguage();
    const [selectedSize, setSelectedSize] = useState<string | null>(null);
    const [quantity, setQuantity] = useState(1);
    const [activeTab, setActiveTab] = useState<TabType>('description');
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [isZoomed, setIsZoomed] = useState(false);
    const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });
    const imageContainerRef = useRef<HTMLDivElement>(null);
    const [showLightbox, setShowLightbox] = useState(false);
    
    // Modal states
    const [paymentModalOpen, setPaymentModalOpen] = useState(false);
    const [shippingModalOpen, setShippingModalOpen] = useState(false);
    const [returnsModalOpen, setReturnsModalOpen] = useState(false);
    const [sizeGuideModalOpen, setSizeGuideModalOpen] = useState(false);
    const [promotion, setPromotion] = useState<Promotion | null>(null);
    
    // Touch handlers states
    const [pinchDistance, setPinchDistance] = useState(1);
    const [lastTouchDistance, setLastTouchDistance] = useState(0);
    
    // Real-time viewer count
    const viewerCount = useProductViewers({ productId: product?.id || '' });

    // Filtrer les variants selon la catégorie (DOIT être avant les returns conditionnels)
    const filteredVariants = useMemo(() => {
        if (!product) return [];
        return filterVariantsByCategory(product.variants, product.category);
    }, [product?.variants, product?.category]);

    // Charger le produit depuis l'API
    useEffect(() => {
        async function fetchProduct() {
            try {
                setLoading(true);
                setError(null);
                
                const response = await fetch(`/api/products/${id}`);
                
                if (!response.ok) {
                    if (response.status === 404) {
                        setError('Produit non trouvé');
                        return;
                    }
                    throw new Error('Erreur lors du chargement du produit');
                }
                
                const data = await response.json();
                setProduct(data.product);
                
                // Charger les produits similaires de la même catégorie
                if (data.product?.category) {
                    const similarResponse = await fetch(`/api/products?category=${data.product.category}`);
                    if (similarResponse.ok) {
                        const similarData = await similarResponse.json();
                        const similar = (similarData.products || [])
                            .filter((p: Product) => p.id !== data.product.id)
                            .slice(0, 4);
                        setSimilarProducts(similar);
                    }
                }
            } catch (err) {
                console.error('Error fetching product:', err);
                setError(err instanceof Error ? err.message : 'Erreur inconnue');
            } finally {
                setLoading(false);
            }
        }

        if (id) {
            fetchProduct();
        }
    }, [id]);

    // Charger les promotions pour ce produit
    useEffect(() => {
        async function fetchPromotion() {
            if (!product) return;
            try {
                const response = await fetch(`/api/promotions?productId=${product.id}&category=${product.category}`);
                if (response.ok) {
                    const data = await response.json();
                    const bestPromo = findBestPromotion(data.promotions || [], product.id, product.category);
                    setPromotion(bestPromo);
                }
            } catch (err) {
                console.error('Error fetching promotion:', err);
            }
        }
        if (product) {
            fetchPromotion();
        }
    }, [product]);

    // Fonction pour gérer le zoom au survol
    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!imageContainerRef.current || !isZoomed) return;
        
        const rect = imageContainerRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        
        setZoomPosition({ x, y });
    };

    const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
        if (e.touches.length === 2) {
            const touch1 = e.touches[0];
            const touch2 = e.touches[1];
            const distance = Math.hypot(
                touch2.clientX - touch1.clientX,
                touch2.clientY - touch1.clientY
            );
            setLastTouchDistance(distance);
        }
    };

    const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
        if (e.touches.length === 2 && lastTouchDistance > 0) {
            const touch1 = e.touches[0];
            const touch2 = e.touches[1];
            const distance = Math.hypot(
                touch2.clientX - touch1.clientX,
                touch2.clientY - touch1.clientY
            );
            const scale = Math.min(Math.max(distance / lastTouchDistance, 1), 3);
            setPinchDistance(scale);
        }
    };

    const handleTouchEnd = () => {
        if (pinchDistance > 1.5) {
            setShowLightbox(true);
        }
        setPinchDistance(1);
        setLastTouchDistance(0);
    };

    // Calculs qui dépendent de product (après les hooks mais avant les returns)
    const isWishlisted = product ? isInWishlist(product.id) : false;
    const selectedVariant = product ? product.variants.find(v => v.size === selectedSize) : null;
    const totalStock = product ? product.variants.reduce((sum, v) => sum + v.stock, 0) : 0;
    const maxQuantity = selectedVariant ? selectedVariant.stock : 1;

    const getStockStatus = () => {
        if (totalStock === 0) return { text: t('outOfStock'), class: 'outOfStock' };
        if (totalStock < 10) return { text: `${t('onlyLeft')} ${totalStock} ${t('leftInStock')}`, class: 'lowStock' };
        return { text: t('inStock'), class: '' };
    };

    const stockStatus = getStockStatus();

    const handleAddToCart = () => {
        if (!product) return;
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

    // MAINTENANT les returns conditionnels peuvent être utilisés
    if (loading) {
        return (
            <div className={styles.container}>
                <div style={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center', 
                    minHeight: '50vh',
                    flexDirection: 'column',
                    gap: '1rem'
                }}>
                    <div className={styles.loadingSpinner}></div>
                    <p>{t('loading')}...</p>
                </div>
            </div>
        );
    }

    if (error || !product) {
        return (
            <div className={styles.container}>
                <div style={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center', 
                    minHeight: '50vh',
                    flexDirection: 'column',
                    gap: '1rem'
                }}>
                    <div style={{ fontSize: '3rem' }}>⚠️</div>
                    <h2>{error || 'Produit non trouvé'}</h2>
                    <Link href="/catalog" style={{ 
                        padding: '0.75rem 1.5rem',
                        background: '#3B82F6',
                        color: 'white',
                        borderRadius: '0.5rem',
                        textDecoration: 'none'
                    }}>
                        Retour au catalogue
                    </Link>
                </div>
            </div>
        );
    }
    
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
                            <div 
                                className={styles.mainImageContainer}
                                ref={imageContainerRef}
                                onMouseEnter={() => {
                                    if (product.images?.[selectedImageIndex]?.type !== 'video') {
                                        setIsZoomed(true);
                                    }
                                }}
                                onMouseLeave={() => setIsZoomed(false)}
                                onMouseMove={handleMouseMove}
                                onClick={() => {
                                    if (product.images?.[selectedImageIndex]?.type !== 'video') {
                                        setShowLightbox(true);
                                    }
                                }}
                                onTouchStart={handleTouchStart}
                                onTouchMove={handleTouchMove}
                                onTouchEnd={handleTouchEnd}
                                style={{
                                    transform: pinchDistance > 1 ? `scale(${pinchDistance})` : 'none',
                                }}
                            >
                                {product.images && product.images.length > 0 && product.images[selectedImageIndex] ? (
                                    product.images[selectedImageIndex].type === 'video' ? (
                                        <video
                                            src={product.images[selectedImageIndex].url}
                                            className={styles.mainImage}
                                            controls
                                            autoPlay
                                            loop
                                            playsInline
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        />
                                    ) : (
                                        <>
                                            <Image
                                                src={product.images[selectedImageIndex].url}
                                                alt={product.images[selectedImageIndex].alt || product.name}
                                                fill
                                                className={styles.mainImage}
                                                priority
                                                style={{
                                                    transform: isZoomed 
                                                        ? `scale(2) translate(${-zoomPosition.x + 50}%, ${-zoomPosition.y + 50}%)`
                                                        : 'scale(1)',
                                                    transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`,
                                                }}
                                            />
                                            {isZoomed && (
                                                <div className={styles.zoomIndicator}>
                                                    🔍 {t('zoom') || 'Zoom actif'} - {t('clickToFullscreen') || 'Cliquez pour plein écran'}
                                                </div>
                                            )}
                                        </>
                                    )
                                ) : (
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
                                )}
                            </div>
                        </div>
                        {product.images && product.images.length > 0 && (
                            <div className={styles.thumbnails}>
                                {product.images.map((img, index) => (
                                    <div
                                        key={img.id}
                                        className={`${styles.thumbnail} ${selectedImageIndex === index ? styles.active : ''}`}
                                        onClick={() => setSelectedImageIndex(index)}
                                    >
                                        {img.type === 'video' ? (
                                            <video
                                                src={img.url}
                                                className={styles.thumbnailImage}
                                                muted
                                                playsInline
                                                onMouseEnter={(e) => e.currentTarget.play()}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.pause();
                                                    e.currentTarget.currentTime = 0;
                                                }}
                                            />
                                        ) : (
                                            <Image
                                                src={img.url}
                                                alt={img.alt || `${product.name} - Vue ${index + 1}`}
                                                fill
                                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                                className={styles.thumbnailImage}
                                            />
                                        )}
                                        {img.type === 'video' && (
                                            <div className={styles.videoIndicator}>▶️</div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Info */}
                    <div className={styles.info}>
                    <span className={styles.category}>{product.category}</span>
                    <h1 className={styles.title}>{product.name}</h1>
                    <div className={styles.priceSection}>
                        {promotion ? (() => {
                            const { discountedPrice, discountAmount } = calculateDiscountedPrice(product.price, promotion);
                            return (
                                <>
                                    <div className={styles.priceWithDiscount}>
                                        <span className={styles.originalPrice}>{formatPrice(product.price)}</span>
                                        <span className={styles.discountedPrice}>{formatPrice(discountedPrice)}</span>
                                        <span className={styles.discountBadge}>
                                            -{promotion.discount_type === 'percentage' ? `${promotion.discount_value}%` : formatPrice(discountAmount)}
                                        </span>
                                    </div>
                                    {promotion.name && (
                                        <div className={styles.promotionLabel}>
                                            🎁 {promotion.name}
                                        </div>
                                    )}
                                </>
                            );
                        })() : (
                            <div className={styles.price}>{formatPrice(product.price)}</div>
                        )}
                    </div>

                    {/* Stock Status */}
                    <div className={`${styles.stockInfo} ${styles[stockStatus.class]}`}>
                        <span className={styles.stockDot}></span>
                        {stockStatus.text}
                    </div>

                    {/* Size Selection */}
                    <div className={styles.section}>
                        <span className={styles.sectionTitle}>Taille</span>
                        <div className={styles.sizeGrid}>
                            {filteredVariants.map((variant) => (
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
                                <p className={styles.description}>{product.detailedDescription || product.description}</p>
                            )}
                            {activeTab === 'features' && (
                                <div className={styles.features}>
                                    {product.features && product.features.length > 0 ? (
                                        product.features.map((feature, index) => (
                                            <div key={`feature-${index}-${feature.name}`} className={styles.feature}>
                                                <span className={styles.featureName}>{feature.name}</span>
                                                <span className={styles.featureValue}>{feature.value}</span>
                                            </div>
                                        ))
                                    ) : (
                                        <p className={styles.noFeatures}>Aucune caractéristique disponible.</p>
                                    )}
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
            {similarProducts.length > 0 && (
                <div className={styles.sidebar}>
                    <ProductRecommendations products={similarProducts} />
                </div>
            )}

            {/* Reviews Section */}
            <ProductReviews productId={product.id} />

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

            {/* Lightbox Modal */}
            {showLightbox && product.images && product.images[selectedImageIndex] && (
                <div 
                    className={styles.lightbox}
                    onClick={() => setShowLightbox(false)}
                >
                    <div className={styles.lightboxContent} onClick={(e) => e.stopPropagation()}>
                        <button 
                            className={styles.lightboxClose}
                            onClick={() => setShowLightbox(false)}
                            aria-label="Fermer"
                        >
                            ✕
                        </button>
                        {product.images[selectedImageIndex].type === 'video' ? (
                            <video
                                src={product.images[selectedImageIndex].url}
                                controls
                                autoPlay
                                loop
                                className={styles.lightboxImage}
                            />
                        ) : (
                            <Image
                                src={product.images[selectedImageIndex].url}
                                alt={product.images[selectedImageIndex].alt || product.name}
                                width={1920}
                                height={1920}
                                className={styles.lightboxImage}
                                quality={100}
                            />
                        )}
                        {product.images.length > 1 && (
                            <>
                                <button
                                    className={styles.lightboxPrev}
                                    onClick={() => setSelectedImageIndex((prev) => 
                                        prev > 0 ? prev - 1 : product.images.length - 1
                                    )}
                                    aria-label="Image précédente"
                                >
                                    ‹
                                </button>
                                <button
                                    className={styles.lightboxNext}
                                    onClick={() => setSelectedImageIndex((prev) => 
                                        prev < product.images.length - 1 ? prev + 1 : 0
                                    )}
                                    aria-label="Image suivante"
                                >
                                    ›
                                </button>
                            </>
                        )}
                        <div className={styles.lightboxCounter}>
                            {selectedImageIndex + 1} / {product.images.length}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
