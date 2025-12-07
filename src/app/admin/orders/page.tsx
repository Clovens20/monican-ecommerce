'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './page.module.css';

interface Order {
    id: string;
    orderNumber: string;
    customerName: string;
    customerEmail: string;
    date: string;
    status: string;
    total: number;
    currency: string;
    shippingAddress?: {
        country: string;
    };
    trackingNumber?: string;
}

export default function OrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<string>('all');

    useEffect(() => {
        async function fetchOrders() {
            try {
                const url = statusFilter === 'all' 
                    ? '/api/admin/orders'
                    : `/api/admin/orders?status=${statusFilter}`;
                
                const response = await fetch(url);
                const data = await response.json();
                
                if (data.success) {
                    setOrders(data.orders);
                } else {
                    setError(data.error || 'Erreur lors du chargement des commandes');
                }
            } catch (err) {
                console.error('Error fetching orders:', err);
                setError('Erreur de connexion au serveur');
            } finally {
                setLoading(false);
            }
        }
        
        fetchOrders();
    }, [statusFilter]);

    const getStatusText = (status: string) => {
        const statusMap: { [key: string]: string } = {
            'pending': 'En Attente',
            'processing': 'En Traitement',
            'shipped': 'Expédié',
            'delivered': 'Livré',
            'cancelled': 'Annulé',
            'returned': 'Retourné'
        };
        return statusMap[status] || status;
    };

    if (loading) {
        return (
            <div className={styles.container}>
                <div style={{ textAlign: 'center', padding: '3rem' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
                    <p>Chargement des commandes...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.container}>
                <div style={{ textAlign: 'center', padding: '3rem' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⚠️</div>
                    <p>{error}</p>
                    <button 
                        onClick={() => window.location.reload()} 
                        style={{ marginTop: '1rem', padding: '0.5rem 1rem', background: '#10b981', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer' }}
                    >
                        Réessayer
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Gestion des Commandes</h1>
                <div className={styles.filters}>
                    <select 
                        className={styles.filterSelect}
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="all">Tous les statuts</option>
                        <option value="pending">En attente</option>
                        <option value="processing">En traitement</option>
                        <option value="shipped">Expédiées</option>
                        <option value="delivered">Livrées</option>
                        <option value="cancelled">Annulées</option>
                    </select>
                </div>
            </div>

            {orders.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📦</div>
                    <h3 style={{ marginBottom: '0.5rem' }}>Aucune commande</h3>
                    <p>Aucune commande trouvée avec ce filtre.</p>
                </div>
            ) : (
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th className={styles.th}>ID</th>
                            <th className={styles.th}>Client</th>
                            <th className={styles.th}>Date</th>
                            <th className={styles.th}>Pays</th>
                            <th className={styles.th}>Total</th>
                            <th className={styles.th}>Statut</th>
                            <th className={styles.th}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.map((order) => (
                            <tr key={order.id}>
                                <td className={styles.td}>{order.orderNumber || order.id.substring(0, 8)}...</td>
                                <td className={styles.td}>
                                    <div style={{ fontWeight: 500 }}>{order.customerName}</div>
                                    <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>{order.customerEmail}</div>
                                </td>
                                <td className={styles.td}>{new Date(order.date).toLocaleDateString('fr-FR')}</td>
                                <td className={styles.td}>{order.shippingAddress?.country || 'N/A'}</td>
                                <td className={styles.td}>
                                    {new Intl.NumberFormat('fr-FR', {
                                        style: 'currency',
                                        currency: order.currency || 'USD'
                                    }).format(order.total)}
                                </td>
                                <td className={styles.td}>
                                    <span className={`${styles.status} ${styles[`status-${order.status}`]}`}>
                                        {getStatusText(order.status)}
                                    </span>
                                </td>
                                <td className={styles.td}>
                                    <Link href={`/admin/orders/${order.id}`} className={styles.actionBtn}>
                                        Gérer
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}
