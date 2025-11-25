'use client';

import { useState, use } from 'react';
import { mockOrders, OrderStatus } from '@/lib/orders';
import styles from './page.module.css';
import { notFound } from 'next/navigation';

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const order = mockOrders.find((o) => o.id === id);

    const [status, setStatus] = useState<OrderStatus>(order?.status || 'pending');
    const [tracking, setTracking] = useState(order?.trackingNumber || '');

    if (!order) return notFound();

    const handleStatusChange = (newStatus: OrderStatus) => {
        setStatus(newStatus);
        alert(`Statut mis à jour: ${newStatus}`);
        // Here we would call Supabase update
    };

    const handleGenerateLabel = () => {
        alert('Étiquette d\'expédition générée (PDF)');
        // Simulate label generation
    };

    const handleSaveTracking = () => {
        if (!tracking) return alert('Veuillez entrer un numéro de suivi');
        handleStatusChange('shipped');
        alert('Numéro de suivi enregistré et client notifié');
    };

    return (
        <div>
            <div className={styles.header}>
                <h1 className={styles.title}>Commande #{order.id}</h1>
                <span style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '999px',
                    background: status === 'shipped' ? '#d1fae5' : '#fef3c7',
                    color: status === 'shipped' ? '#065f46' : '#92400e',
                    fontWeight: 'bold'
                }}>
                    {status.toUpperCase()}
                </span>
            </div>

            <div className={styles.container}>
                {/* Left Column: Order Details */}
                <div>
                    <div className={styles.card}>
                        <h2 className={styles.subtitle}>Articles</h2>
                        <div className={styles.itemList}>
                            {order.items.map((item) => (
                                <div key={item.id} className={styles.item}>
                                    <div className={styles.itemInfo}>
                                        <div className={styles.itemImage}></div>
                                        <div>
                                            <div style={{ fontWeight: 600 }}>{item.name}</div>
                                            <div style={{ fontSize: '0.9rem', color: '#6b7280' }}>
                                                Taille: {item.size} | Qté: {item.quantity}
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ fontWeight: 600 }}>${item.price.toFixed(2)}</div>
                                </div>
                            ))}
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e5e7eb', fontWeight: 'bold' }}>
                                <span>Total</span>
                                <span>${order.total.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    <div className={styles.card}>
                        <h2 className={styles.subtitle}>Détails de Livraison</h2>
                        <div className={styles.infoGrid}>
                            <div className={styles.infoGroup}>
                                <span className={styles.label}>Nom du client</span>
                                <span className={styles.value}>{order.customerName}</span>
                            </div>
                            <div className={styles.infoGroup}>
                                <span className={styles.label}>Email</span>
                                <span className={styles.value}>{order.customerEmail}</span>
                            </div>
                            <div className={styles.infoGroup}>
                                <span className={styles.label}>Téléphone</span>
                                <span className={styles.value}>{order.customerPhone}</span>
                            </div>
                            <div className={styles.infoGroup}>
                                <span className={styles.label}>Adresse</span>
                                <span className={styles.value}>
                                    {order.shippingAddress.street}<br />
                                    {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zip}<br />
                                    {order.shippingAddress.country}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Actions */}
                <div className={styles.actions}>
                    <div className={styles.card}>
                        <h2 className={styles.subtitle}>Actions</h2>

                        {status === 'pending' && (
                            <button
                                className={`${styles.btn} ${styles.btnPrimary}`}
                                onClick={() => handleStatusChange('processing')}
                                style={{ marginBottom: '1rem' }}
                            >
                                Marquer en Traitement
                            </button>
                        )}

                        {status === 'processing' && (
                            <>
                                <button
                                    className={`${styles.btn} ${styles.btnSecondary}`}
                                    onClick={handleGenerateLabel}
                                    style={{ marginBottom: '1rem' }}
                                >
                                    🖨️ Générer Étiquette
                                </button>

                                <div style={{ marginTop: '1rem', borderTop: '1px solid #e5e7eb', paddingTop: '1rem' }}>
                                    <label className={styles.label}>Numéro de Suivi</label>
                                    <input
                                        type="text"
                                        className={styles.trackingInput}
                                        placeholder="ex: USPS123456789"
                                        value={tracking}
                                        onChange={(e) => setTracking(e.target.value)}
                                    />
                                    <button
                                        className={`${styles.btn} ${styles.btnPrimary}`}
                                        onClick={handleSaveTracking}
                                    >
                                        Expédier la Commande
                                    </button>
                                </div>
                            </>
                        )}

                        {status === 'shipped' && (
                            <div style={{ textAlign: 'center', color: '#059669', fontWeight: 600 }}>
                                ✅ Commande Expédiée<br />
                                <span style={{ fontSize: '0.9rem', color: '#6b7280' }}>Suivi: {tracking}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
