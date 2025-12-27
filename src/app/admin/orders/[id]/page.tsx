'use client';

import { useState, useEffect, use } from 'react';
import { OrderStatus } from '@/lib/types';
import styles from './page.module.css';
import { notFound } from 'next/navigation';

interface Order {
    id: string;
    orderNumber: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    date: string;
    status: string;
    total: number;
    currency: string;
    items: Array<{
        id: string;
        name: string;
        size?: string;
        quantity: number;
        price: number;
    }>;
    shippingAddress: {
        street: string;
        city: string;
        state: string;
        zip: string;
        country: string;
    };
    trackingNumber?: string;
    subtotal: number;
    shippingCost: number;
    tax: number;
}

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState<OrderStatus>('pending');
    const [tracking, setTracking] = useState('');
    const [cancelling, setCancelling] = useState(false);

    useEffect(() => {
        async function fetchOrder() {
            try {
                const response = await fetch(`/api/admin/orders/${id}`);
                const data = await response.json();
                
                if (data.success && data.order) {
                    setOrder(data.order);
                    setStatus(data.order.status as OrderStatus);
                    setTracking(data.order.trackingNumber || '');
                } else {
                    setOrder(null);
                }
            } catch (err) {
                console.error('Error fetching order:', err);
                setOrder(null);
            } finally {
                setLoading(false);
            }
        }
        
        fetchOrder();
    }, [id]);

    if (loading) {
        return (
            <div style={{ padding: '3rem', textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
                <p>Chargement de la commande...</p>
            </div>
        );
    }

    if (!order) return notFound();

    const handleStatusChange = async (newStatus: OrderStatus) => {
        try {
            const response = await fetch(`/api/admin/orders/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status: newStatus }),
            });
            
            const data = await response.json();
            
            if (data.success) {
                setStatus(newStatus);
                if (order) {
                    setOrder({ ...order, status: newStatus });
                }
            } else {
                alert(`Erreur: ${data.error || 'Impossible de mettre à jour le statut'}`);
            }
        } catch (err) {
            console.error('Error updating status:', err);
            alert('Erreur lors de la mise à jour du statut');
        }
    };

    const handleGenerateLabel = () => {
        alert('Étiquette d\'expédition générée (PDF)');
        // Simulate label generation
    };

    const handleSaveTracking = async () => {
        if (!tracking) return alert('Veuillez entrer un numéro de suivi');
        
        try {
            const response = await fetch(`/api/admin/orders/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    status: 'shipped',
                    trackingNumber: tracking 
                }),
            });
            
            const data = await response.json();
            
            if (data.success) {
                setStatus('shipped');
                if (order) {
                    setOrder({ ...order, status: 'shipped', trackingNumber: tracking });
                }
                alert('Numéro de suivi enregistré et statut mis à jour');
            } else {
                alert(`Erreur: ${data.error || 'Impossible de sauvegarder le numéro de suivi'}`);
            }
        } catch (err) {
            console.error('Error saving tracking:', err);
            alert('Erreur lors de la sauvegarde du numéro de suivi');
        }
    };

    const handleCancelOrder = async () => {
        // Demander confirmation
        const reason = prompt(
            'Êtes-vous sûr de vouloir annuler cette commande ?\n\n' +
            'Cette action libérera le stock réservé.\n\n' +
            'Raison de l\'annulation (optionnel):'
        );

        if (reason === null) {
            return; // L'utilisateur a annulé
        }

        setCancelling(true);
        
        try {
            const response = await fetch(`/api/admin/orders/${id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ reason: reason || undefined }),
            });
            
            const data = await response.json();
            
            if (data.success) {
                setStatus('cancelled');
                if (order) {
                    setOrder({ ...order, status: 'cancelled' });
                }
                
                // Construire le message de succès détaillé
                let successMessage = '✅ Commande annulée avec succès.\n\n';
                successMessage += '• Le stock a été libéré\n';
                if (data.refundId) {
                    successMessage += `• Remboursement effectué (ID: ${data.refundId})\n`;
                    successMessage += '  Le remboursement apparaîtra sur le compte du client dans 5-10 jours ouvrables\n';
                }
                if (data.emailSent) {
                    successMessage += '• Email de notification envoyé au client\n';
                }
                
                alert(successMessage);
                // Recharger la page pour mettre à jour l'affichage
                window.location.reload();
            } else {
                alert(`❌ Erreur: ${data.error || 'Impossible d\'annuler la commande'}`);
            }
        } catch (err) {
            console.error('Error cancelling order:', err);
            alert('❌ Erreur lors de l\'annulation de la commande');
        } finally {
            setCancelling(false);
        }
    };

    return (
        <div>
            <div className={styles.header}>
                <h1 className={styles.title}>Commande #{order.orderNumber || order.id}</h1>
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
                                    <div style={{ fontWeight: 600 }}>
                                        {new Intl.NumberFormat('fr-FR', {
                                            style: 'currency',
                                            currency: order.currency || 'USD'
                                        }).format(item.price)}
                                    </div>
                                </div>
                            ))}
                            <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e5e7eb' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <span>Sous-total</span>
                                    <span>
                                        {new Intl.NumberFormat('fr-FR', {
                                            style: 'currency',
                                            currency: order.currency || 'USD'
                                        }).format(order.subtotal)}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <span>Livraison</span>
                                    <span>
                                        {new Intl.NumberFormat('fr-FR', {
                                            style: 'currency',
                                            currency: order.currency || 'USD'
                                        }).format(order.shippingCost)}
                                    </span>
                                </div>
                                {order.tax > 0 && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                        <span>Taxes</span>
                                        <span>
                                            {new Intl.NumberFormat('fr-FR', {
                                                style: 'currency',
                                                currency: order.currency || 'USD'
                                            }).format(order.tax)}
                                        </span>
                                    </div>
                                )}
                                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.5rem', borderTop: '1px solid #e5e7eb', fontWeight: 'bold' }}>
                                    <span>Total</span>
                                    <span>
                                        {new Intl.NumberFormat('fr-FR', {
                                            style: 'currency',
                                            currency: order.currency || 'USD'
                                        }).format(order.total)}
                                    </span>
                                </div>
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

                        {status === 'cancelled' && (
                            <div style={{ textAlign: 'center', color: '#dc2626', fontWeight: 600 }}>
                                ❌ Commande Annulée
                            </div>
                        )}

                        {/* Bouton d'annulation - disponible pour les commandes en attente ou en traitement */}
                        {(status === 'pending' || status === 'processing') && (
                            <div style={{ marginTop: '1rem', borderTop: '1px solid #e5e7eb', paddingTop: '1rem' }}>
                                <button
                                    className={`${styles.btn} ${styles.btnDanger || ''}`}
                                    onClick={handleCancelOrder}
                                    disabled={cancelling}
                                    style={{
                                        width: '100%',
                                        background: '#dc2626',
                                        color: 'white',
                                        border: 'none',
                                        padding: '0.75rem',
                                        borderRadius: '0.5rem',
                                        cursor: cancelling ? 'not-allowed' : 'pointer',
                                        opacity: cancelling ? 0.6 : 1
                                    }}
                                >
                                    {cancelling ? '⏳ Annulation...' : '🗑️ Annuler la Commande'}
                                </button>
                                <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.5rem', textAlign: 'center' }}>
                                    Cette action libérera le stock réservé
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
