'use client';

import { useState } from 'react';
import { Order, OrderStatus } from '@/lib/types';
import OrderProcessingWorkflow from './OrderProcessingWorkflow';
import ShippingLabel from './ShippingLabel';
import Invoice from './Invoice';
import styles from './OrderDetails.module.css';

interface OrderDetailsProps {
    order: Order;
    subAdminCode?: string;
    onClose: () => void;
    onStatusUpdate?: (orderId: string, newStatus: OrderStatus, trackingNumber?: string) => void;
}

export default function OrderDetails({ order, subAdminCode = '', onClose, onStatusUpdate }: OrderDetailsProps) {
    const [showWorkflow, setShowWorkflow] = useState(false);
    const [showShippingLabel, setShowShippingLabel] = useState(false);
    const [showInvoice, setShowInvoice] = useState(false);

    const handleStatusUpdate = (orderId: string, newStatus: OrderStatus, trackingNumber?: string) => {
        if (onStatusUpdate) {
            onStatusUpdate(orderId, newStatus, trackingNumber);
        }
    };
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

    const handlePrintLabel = () => {
        // S'assurer que seule l'étiquette est affichée
        setShowInvoice(false);
        setShowShippingLabel(true);
        setTimeout(() => {
            window.print();
            setTimeout(() => {
                setShowShippingLabel(false);
            }, 100);
        }, 100);
    };

    const handlePrintInvoice = () => {
        // S'assurer que seule la facture est affichée
        setShowShippingLabel(false);
        setShowInvoice(true);
        setTimeout(() => {
            window.print();
            setTimeout(() => {
                setShowInvoice(false);
            }, 100);
        }, 100);
    };

    const handleMarkAsProcessed = () => {
        alert(`Commande ${order.id} marquée comme traitée`);
        onClose();
    };

    return (
        <>
            {showShippingLabel && (
                <div className={styles.printContainer}>
                    <ShippingLabel order={order} />
                </div>
            )}
            {showInvoice && (
                <div className={styles.printContainer}>
                    <Invoice order={order} />
                </div>
            )}
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
                    <div className={styles.printActions}>
                        <button className={`${styles.actionBtn} ${styles.secondaryBtn}`} onClick={handlePrintLabel}>
                            📦 Imprimer Étiquette
                        </button>
                        <button className={`${styles.actionBtn} ${styles.secondaryBtn}`} onClick={handlePrintInvoice}>
                            🧾 Imprimer Facture
                        </button>
                    </div>
                    {(order.status === 'pending' || order.status === 'processing') && (
                        <button 
                            className={`${styles.actionBtn} ${styles.primaryBtn}`} 
                            onClick={() => setShowWorkflow(true)}
                        >
                            {order.status === 'pending' ? '▶️ Traiter la Commande' : '📦 Finaliser l\'Expédition'}
                        </button>
                    )}
                </div>
            </div>

            {/* Workflow Modal */}
            {showWorkflow && (
                <OrderProcessingWorkflow
                    order={order}
                    subAdminCode={subAdminCode}
                    onStatusUpdate={handleStatusUpdate}
                    onClose={() => setShowWorkflow(false)}
                />
            )}
            </div>
        </>
    );
}
