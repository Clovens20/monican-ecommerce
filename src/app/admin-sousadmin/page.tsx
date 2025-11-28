'use client';

import { useState } from 'react';
import { mockOrders, getPendingOrders } from '@/lib/orders';
import { getSubAdminByCode } from '@/lib/mockData';
import OrderDetails from '@/components/subadmin/OrderDetails';
import { Order } from '@/lib/types';
import styles from './page.module.css';

export default function SubAdminPage() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [code, setCode] = useState('');
    const [subAdminName, setSubAdminName] = useState('');
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'processing'>('all');

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        const subAdmin = getSubAdminByCode(code);
        if (subAdmin) {
            setIsLoggedIn(true);
            setSubAdminName(subAdmin.name);
        } else {
            alert('Code invalide ou sous-admin inactif. Essayez: SA-001, SA-002, ou SA-003');
        }
    };

    if (!isLoggedIn) {
        return (
            <div className={styles.page}>
                <div className={styles.loginContainer}>
                    <form onSubmit={handleLogin} className={styles.loginForm}>
                        <div className={styles.loginHeader}>
                            <h1 className={styles.loginTitle}>
                                Monican <span style={{ color: 'var(--primary)' }}>Logistics</span>
                            </h1>
                            <p className={styles.loginSubtitle}>Accès Sous-admin</p>
                        </div>
                        <div className={styles.loginFormGroup}>
                            <label className={styles.loginLabel}>Code Unique</label>
                            <input
                                type="text"
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                placeholder="SA-XXX"
                                className={styles.loginInput}
                                required
                            />
                            <p className={styles.loginHelp}>
                                💡 Codes de test: SA-001, SA-002, SA-003
                            </p>
                        </div>
                        <button type="submit" className={styles.loginButton}>
                            Connexion
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    const pendingOrders = getPendingOrders();
    const filteredOrders = filterStatus === 'all'
        ? pendingOrders
        : pendingOrders.filter(o => o.status === filterStatus);

    return (
        <div className={styles.page}>
            {/* Header */}
            <header className={styles.dashboardHeader}>
                <div className={styles.dashboardTitle}>
                    Monican <span>Logistics</span>
                </div>
                <div className={styles.userInfo}>
                    <div className={styles.userDetails}>
                        <div className={styles.userLabel}>Connecté en tant que</div>
                        <div className={styles.userName}>{subAdminName} ({code})</div>
                    </div>
                    <button
                        onClick={() => setIsLoggedIn(false)}
                        className={styles.logoutButton}
                    >
                        Déconnexion
                    </button>
                </div>
            </header>

            {/* Stats Cards */}
            <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <div className={styles.statLabel}>En Attente</div>
                    <div className={`${styles.statValue} ${styles.pending}`}>
                        {pendingOrders.filter(o => o.status === 'pending').length}
                    </div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statLabel}>En Traitement</div>
                    <div className={`${styles.statValue} ${styles.processing}`}>
                        {pendingOrders.filter(o => o.status === 'processing').length}
                    </div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statLabel}>Total à Traiter</div>
                    <div className={`${styles.statValue} ${styles.total}`}>
                        {pendingOrders.length}
                    </div>
                </div>
            </div>

            <main className={styles.content}>
                {/* Filters and Title */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', margin: 0 }}>Commandes à Traiter</h1>
                    <div className={styles.filters}>
                        <button
                            onClick={() => setFilterStatus('all')}
                            className={`${styles.filterButton} ${filterStatus === 'all' ? styles.active : ''}`}
                        >
                            Toutes
                        </button>
                        <button
                            onClick={() => setFilterStatus('pending')}
                            className={`${styles.filterButton} ${filterStatus === 'pending' ? styles.active : ''}`}
                        >
                            En Attente
                        </button>
                        <button
                            onClick={() => setFilterStatus('processing')}
                            className={`${styles.filterButton} ${filterStatus === 'processing' ? styles.active : ''}`}
                        >
                            En Traitement
                        </button>
                    </div>
                </div>

                {/* Orders Table */}
                <div className={styles.ordersTable}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>ID Commande</th>
                                <th>Client</th>
                                <th>Pays</th>
                                <th>Articles</th>
                                <th>Total</th>
                                <th>Statut</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredOrders.map(order => (
                                <tr key={order.id}>
                                    <td style={{ fontWeight: 600 }}>{order.id}</td>
                                    <td>{order.customerName}</td>
                                    <td>
                                        {order.shippingAddress.country === 'US' ? '🇺🇸 USA' :
                                            order.shippingAddress.country === 'CA' ? '🇨🇦 Canada' : '🇲🇽 Mexique'}
                                    </td>
                                    <td>{order.items.length} produit(s)</td>
                                    <td style={{ fontWeight: 600 }}>
                                        {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: order.currency }).format(order.total)}
                                    </td>
                                    <td>
                                        <span className={`${styles.statusBadge} ${order.status === 'pending' ? styles.pending : styles.processing}`}>
                                            {order.status === 'pending' ? 'En Attente' : 'En Traitement'}
                                        </span>
                                    </td>
                                    <td>
                                        <button
                                            className={styles.actionButton}
                                            onClick={() => setSelectedOrder(order)}
                                        >
                                            Voir Détails
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filteredOrders.length === 0 && (
                        <div className={styles.emptyState}>
                            Aucune commande à afficher
                        </div>
                    )}
                </div>
            </main>

            {/* Order Details Modal */}
            {selectedOrder && (
                <OrderDetails
                    order={selectedOrder}
                    subAdminCode={code}
                    onClose={() => setSelectedOrder(null)}
                    onStatusUpdate={(orderId, newStatus, trackingNumber) => {
                        // Update order status in the list
                        setSelectedOrder({
                            ...selectedOrder,
                            status: newStatus,
                            trackingNumber: trackingNumber || selectedOrder.trackingNumber,
                            statusHistory: [
                                ...selectedOrder.statusHistory,
                                {
                                    status: newStatus,
                                    timestamp: new Date().toISOString(),
                                    note: newStatus === 'shipped' ? `Expédié avec suivi: ${trackingNumber}` : 'Statut mis à jour',
                                    updatedBy: code
                                }
                            ]
                        });
                    }}
                />
            )}
        </div>
    );
}
