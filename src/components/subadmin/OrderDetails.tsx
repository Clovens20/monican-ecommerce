'use client';

import { Order } from '@/lib/types';
import styles from './OrderDetails.module.css';

interface OrderDetailsProps {
    order: Order;
    onClose: () => void;
}

export default function OrderDetails({ order, onClose }: OrderDetailsProps) {
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('fr-FR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatCurrency = (amount: number, currency: string) => {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: currency
        }).format(amount);
    };

    const getStatusClass = (status: string) => {
        const statusMap: { [key: string]: string } = {
            'pending': styles.statusPending,
            'processing': styles.statusProcessing,
            'shipped': styles.statusShipped,
            'delivered': styles.statusDelivered,
            'cancelled': styles.statusCancelled,
        };
        return statusMap[status] || styles.statusPending;
    };

    const handlePrint = () => {
        window.print();
    };

    const handleMarkAsProcessed = () => {
        alert(`Commande ${order.id} marquée comme traitée`);
        onClose();
    };

    return (
        <div className={styles.modal} onClick={onClose}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className={styles.header}>
                    <div className={styles.headerInfo}>
                        <h2>Commande {order.id}</h2>
                        <div className={styles.orderMeta}>
                            <span>📅 {formatDate(order.date)}</span>
                            <span className={`${styles.statusBadge} ${getStatusClass(order.status)}`}>
                                {order.status}
                            </span>
                        </div>
                    </div>
                    <button className={styles.closeBtn} onClick={onClose}>×</button>
                </div>

                {/* Body */}
                <div className={styles.body}>
                    {/* Customer & Shipping Info */}
                    <div className={styles.section}>
                        <h3 className={styles.sectionTitle}>📋 Informations Client</h3>
                        <div className={styles.infoGrid}>
                            <div className={styles.infoCard}>
                                <h4>Client</h4>
                                <p><strong>{order.customerName}</strong></p>
                                <p>📧 {order.customerEmail}</p>
                                <p>📞 {order.customerPhone}</p>
                            </div>
                            <div className={styles.infoCard}>
                                <h4>Adresse de Livraison</h4>
                                <p>{order.shippingAddress.street}</p>
                                <p>{order.shippingAddress.city}, {order.shippingAddress.state}</p>
                                <p>{order.shippingAddress.zip}</p>
                                <p><strong>{order.shippingAddress.country === 'US' ? '🇺🇸 États-Unis' : order.shippingAddress.country === 'CA' ? '🇨🇦 Canada' : '🇲🇽 Mexique'}</strong></p>
                            </div>
                        </div>
                    </div>

                    {/* Products */}
                    <div className={styles.section}>
                        <h3 className={styles.sectionTitle}>📦 Produits Commandés</h3>
                        <table className={styles.productsTable}>
                            <thead>
                                <tr>
                                    <th>Produit</th>
                                    <th>Taille</th>
                                    <th>Quantité</th>
                                    <th>Prix Unitaire</th>
                                    <th>Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {order.items.map((item) => (
                                    <tr key={item.id}>
                                        <td>
                                            <div className={styles.productRow}>
                                                <div className={styles.productImage}>
                                                    {item.name.substring(0, 10)}
                                                </div>
                                                <div className={styles.productInfo}>
                                                    <div className={styles.productName}>{item.name}</div>
                                                    <div className={styles.productMeta}>SKU: {item.productId}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td><strong>{item.size}</strong></td>
                                        <td>×{item.quantity}</td>
                                        <td>{formatCurrency(item.price, order.currency)}</td>
                                        <td><strong>{formatCurrency(item.price * item.quantity, order.currency)}</strong></td>
                                    </tr>
                                ))}
                                <tr>
                                    <td colSpan={4} style={{ textAlign: 'right', paddingRight: '1rem' }}>Sous-total</td>
                                    <td><strong>{formatCurrency(order.subtotal, order.currency)}</strong></td>
                                </tr>
                                <tr>
                                    <td colSpan={4} style={{ textAlign: 'right', paddingRight: '1rem' }}>Livraison</td>
                                    <td><strong>{formatCurrency(order.shippingCost, order.currency)}</strong></td>
                                </tr>
                                <tr>
                                    <td colSpan={4} style={{ textAlign: 'right', paddingRight: '1rem' }}>Taxes</td>
                                    <td><strong>{formatCurrency(order.tax, order.currency)}</strong></td>
                                </tr>
                                <tr className={styles.totalRow}>
                                    <td colSpan={4} style={{ textAlign: 'right', paddingRight: '1rem' }}>TOTAL</td>
                                    <td><strong style={{ fontSize: '1.1rem' }}>{formatCurrency(order.total, order.currency)}</strong></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Payment Info */}
                    <div className={styles.section}>
                        <h3 className={styles.sectionTitle}>💳 Paiement</h3>
                        <div className={styles.infoCard}>
                            <p><strong>Méthode:</strong> {order.paymentMethod}</p>
                            {order.trackingNumber && (
                                <p><strong>Numéro de suivi:</strong> {order.trackingNumber}</p>
                            )}
                        </div>
                    </div>

                    {/* Status History */}
                    <div className={styles.section}>
                        <h3 className={styles.sectionTitle}>📊 Historique de Statut</h3>
                        <div className={styles.statusHistory}>
                            {order.statusHistory.map((history, index) => (
                                <div key={index} className={styles.historyItem}>
                                    <div className={styles.historyDot}>✓</div>
                                    <div className={styles.historyContent}>
                                        <div className={styles.historyStatus}>{history.status}</div>
                                        <div className={styles.historyTime}>{formatDate(history.timestamp)}</div>
                                        {history.note && <div className={styles.historyNote}>"{history.note}"</div>}
                                        {history.updatedBy && (
                                            <div className={styles.historyTime}>Par: {history.updatedBy}</div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Internal Notes */}
                    {order.internalNotes && (
                        <div className={styles.notes}>
                            <strong>📝 Notes Internes</strong>
                            <p>{order.internalNotes}</p>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className={styles.actions}>
                    <button className={`${styles.actionBtn} ${styles.secondaryBtn}`} onClick={handlePrint}>
                        🖨️ Imprimer Bon de Préparation
                    </button>
                    {order.status === 'pending' && (
                        <button className={`${styles.actionBtn} ${styles.primaryBtn}`} onClick={handleMarkAsProcessed}>
                            ✓ Marquer comme Traitée
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
