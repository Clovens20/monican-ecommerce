'use client';

import { useState, use } from 'react';
import Link from 'next/link';
import { mockProducts, getProductsByCategory } from '@/lib/products';
import ProductCard from '@/components/product/ProductCard';
import styles from './page.module.css';
import { notFound } from 'next/navigation';
import { useCart } from '@/lib/cart';
import { useCountry } from '@/lib/country';

type TabType = 'description' | 'features' | 'shipping';

export default function ProductPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const product = mockProducts.find((p) => p.id === id);

    const { addItem } = useCart();
    const { formatPrice } = useCountry();
    const [selectedSize, setSelectedSize] = useState<string | null>(null);
    const [quantity, setQuantity] = useState(1);
    const [activeTab, setActiveTab] = useState<TabType>('description');
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);

    if (!product) {
        return notFound();
    }

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
            alert('Veuillez sélectionner une taille');
            return;
        }

        // Add to cart with the selected quantity
        for (let i = 0; i < quantity; i++) {
            addItem(product, selectedSize);
        }

        alert(`${quantity} produit(s) ajouté(s) au panier !`);
    };

    const getStockStatus = () => {
        if (totalStock === 0) return { text: 'Rupture de stock', class: 'outOfStock' };
        if (totalStock < 10) return { text: `Plus que ${totalStock} en stock`, class: 'lowStock' };
        return { text: 'En stock', class: '' };
    };

    const stockStatus = getStockStatus();

    return (
        <div className={styles.container}>
            {/* Breadcrumb */}
            <div className={styles.breadcrumb}>
                <Link href="/">Accueil</Link>
                <span>/</span>
                <Link href="/catalog">Catalogue</Link>
                <span>/</span>
                <Link href={`/catalog?category=${product.category}`}>{product.category}</Link>
                <span>/</span>
                <span>{product.name}</span>
            </div>

            <div className={styles.grid}>
                {/* Gallery */}
                <div className={styles.gallery}>
                    <div className={styles.mainImageWrapper}>
                        {product.isNew && <div className={styles.newBadge}>Nouveau</div>}
                        {/* Placeholder for main image */}
                        <div style={{
                            width: '100%',
                            height: '100%',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontSize: '1.5rem',
                            fontWeight: 'bold'
                        }}>
                            {product.name}
                        </div>
                    </div>
                    <div className={styles.thumbnails}>
                        {product.images.map((img, index) => (
                            <div
                                key={img.id}
                                className={`${styles.thumbnail} ${selectedImageIndex === index ? styles.active : ''}`}
                                onClick={() => setSelectedImageIndex(index)}
                            >
                                {/* Placeholder thumbnails */}
                                <div style={{
                                    width: '100%',
                                    height: '100%',
                                    background: `linear-gradient(135deg, #667eea ${index * 20}%, #764ba2 100%)`
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
                                        <strong>Livraison gratuite</strong> pour les commandes de plus de 100 USD / 150 CAD / 200 MXN
                                    </p>
                                    <p style={{ marginTop: '1rem' }}>
                                        <strong>Retours gratuits</strong> sous 30 jours
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    <button
                        className={styles.addToCartBtn}
                        onClick={handleAddToCart}
                        disabled={totalStock === 0}
                    >
                        {totalStock === 0 ? 'Rupture de stock' : 'Ajouter au Panier'}
                    </button>

                    <div className={styles.shippingInfo}>
                        <strong>🚚 Livraison Rapide</strong>
                        Calculée à l'étape suivante pour USA, Canada et Mexique.
                        <br />
                        <strong>↩️ Retours Faciles</strong>
                        Retours gratuits sous 30 jours.
                    </div>
                </div>
            </div>

            {/* Similar Products */}
            {similarProducts.length > 0 && (
                <div className={styles.similarProducts}>
                    <h2>Produits Similaires</h2>
                    <div className={styles.productsGrid}>
                        {similarProducts.map((p) => (
                            <ProductCard key={p.id} product={p} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
