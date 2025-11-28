'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { mockProducts } from '@/lib/products';
import { useCountry } from '@/lib/country';
import styles from './SearchModal.module.css';

interface SearchModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const { formatPrice } = useCountry();

    const filteredProducts = searchQuery.trim()
        ? mockProducts.filter(product =>
            product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            product.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
            product.description.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : [];

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) {
            window.addEventListener('keydown', handleEscape);
        }
        return () => window.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.header}>
                    <input
                        type="text"
                        className={styles.searchInput}
                        placeholder="Rechercher un produit..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        autoFocus
                    />
                    <button className={styles.closeButton} onClick={onClose}>
                        ✕
                    </button>
                </div>

                <div className={styles.results}>
                    {searchQuery.trim() ? (
                        filteredProducts.length > 0 ? (
                            <div className={styles.productsList}>
                                {filteredProducts.map(product => (
                                    <Link
                                        key={product.id}
                                        href={`/product/${product.id}`}
                                        className={styles.productItem}
                                        onClick={onClose}
                                    >
                                        <div className={styles.productImage}>
                                            <div style={{
                                                width: '100%',
                                                height: '100%',
                                                background: `linear-gradient(135deg, #3B82F6 0%, #10B981 100%)`,
                                                borderRadius: '0.5rem'
                                            }} />
                                        </div>
                                        <div className={styles.productInfo}>
                                            <h3 className={styles.productName}>{product.name}</h3>
                                            <p className={styles.productCategory}>{product.category}</p>
                                            <p className={styles.productPrice}>{formatPrice(product.price)}</p>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className={styles.noResults}>
                                <p>Aucun produit trouvé pour "{searchQuery}"</p>
                            </div>
                        )
                    ) : (
                        <div className={styles.placeholder}>
                            <p>Commencez à taper pour rechercher...</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

