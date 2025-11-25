'use client';

import Link from 'next/link';
import { mockProducts } from '@/lib/products';
import styles from '../orders/page.module.css'; // Reuse styles for consistency

export default function ProductsPage() {
    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Gestion des Produits</h1>
                <Link href="/admin/products/new" className={styles.actionBtn} style={{ background: 'var(--primary)', color: 'white', border: 'none' }}>
                    + Nouveau Produit
                </Link>
            </div>

            <table className={styles.table}>
                <thead>
                    <tr>
                        <th className={styles.th}>Image</th>
                        <th className={styles.th}>Nom</th>
                        <th className={styles.th}>Catégorie</th>
                        <th className={styles.th}>Prix</th>
                        <th className={styles.th}>Tailles</th>
                        <th className={styles.th}>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {mockProducts.map((product) => (
                        <tr key={product.id}>
                            <td className={styles.td}>
                                <div style={{ width: '40px', height: '40px', background: '#f3f4f6', borderRadius: '4px' }}></div>
                            </td>
                            <td className={styles.td}>
                                <div style={{ fontWeight: 500 }}>{product.name}</div>
                            </td>
                            <td className={styles.td} style={{ textTransform: 'capitalize' }}>{product.category}</td>
                            <td className={styles.td}>${product.price.toFixed(2)}</td>
                            <td className={styles.td}>{product.sizes.join(', ')}</td>
                            <td className={styles.td}>
                                <Link href={`/admin/products/${product.id}`} className={styles.actionBtn}>
                                    Modifier
                                </Link>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
