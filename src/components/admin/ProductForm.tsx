'use client';

import { useState } from 'react';
import { Product } from '@/lib/products';
import styles from '../orders/[id]/page.module.css'; // Reuse styles

interface ProductFormProps {
    initialData?: Product;
}

export default function ProductForm({ initialData }: ProductFormProps) {
    const [formData, setFormData] = useState<Partial<Product>>(initialData || {
        name: '',
        category: 'tennis',
        price: 0,
        description: '',
        sizes: [],
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        alert('Produit sauvegardé ! (Simulation)');
        window.location.href = '/admin/products';
    };

    return (
        <form onSubmit={handleSubmit} className={styles.card} style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div className={styles.infoGrid}>
                <div className={styles.infoGroup} style={{ gridColumn: 'span 2' }}>
                    <label className={styles.label}>Nom du produit</label>
                    <input
                        type="text"
                        className={styles.trackingInput}
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                    />
                </div>

                <div className={styles.infoGroup}>
                    <label className={styles.label}>Catégorie</label>
                    <select
                        className={styles.trackingInput}
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    >
                        <option value="tennis">Tennis</option>
                        <option value="chemises">Chemises</option>
                        <option value="jeans">Jeans</option>
                        <option value="maillots">Maillots</option>
                    </select>
                </div>

                <div className={styles.infoGroup}>
                    <label className={styles.label}>Prix ($)</label>
                    <input
                        type="number"
                        step="0.01"
                        className={styles.trackingInput}
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                        required
                    />
                </div>

                <div className={styles.infoGroup} style={{ gridColumn: 'span 2' }}>
                    <label className={styles.label}>Description</label>
                    <textarea
                        className={styles.trackingInput}
                        rows={4}
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        required
                    />
                </div>

                <div className={styles.infoGroup} style={{ gridColumn: 'span 2' }}>
                    <label className={styles.label}>Tailles (séparées par des virgules)</label>
                    <input
                        type="text"
                        className={styles.trackingInput}
                        placeholder="ex: S, M, L, XL"
                        value={formData.sizes?.join(', ')}
                        onChange={(e) => setFormData({ ...formData, sizes: e.target.value.split(',').map(s => s.trim()) })}
                    />
                </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <button type="button" className={`${styles.btn} ${styles.btnSecondary}`} onClick={() => window.history.back()}>
                    Annuler
                </button>
                <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`}>
                    Sauvegarder
                </button>
            </div>
        </form>
    );
}
