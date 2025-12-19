'use client';

import { useState, useEffect } from 'react';
import OrderDetails from '@/components/subadmin/OrderDetails';
import { Order, ShippingAddress, OrderItem } from '@/lib/types';
import styles from './page.module.css';

interface SubAdmin {
    id: string;
    name: string;
    email: string;
    code: string;
}

interface SubAdminOrder {
    id: string;
    orderNumber: string;
    customerName: string;
    customerEmail: string;
    customerPhone?: string;
    date: string;
    status: string;
    total: number;
    currency: string;
    items: Array<{
        id: string;
        productId?: string;
        name: string;
        quantity: number;
        price: number;
        size?: string;
        image?: string;
    }>;
    shippingAddress: {
        street: string;
        city: string;
        state: string;
        zip: string;
        country: string;
    };
    trackingNumber?: string;
    subtotal?: number;
    shippingCost?: number;
    tax?: number;
    paymentMethod?: string;
    statusHistory?: Array<{
        status: string;
        timestamp: string;
        note?: string;
        updatedBy?: string;
    }>;
}

export default function SubAdminPage() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [code, setCode] = useState('');
    const [subAdmin, setSubAdmin] = useState<SubAdmin | null>(null);
    const [orders, setOrders] = useState<SubAdminOrder[]>([]);
    const [loading, setLoading] = useState(false);
    const [ordersLoading, setOrdersLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'processing'>('all');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        
        try {
            const response = await fetch('/api/admin/subadmin/auth', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ code }),
            });
            
            const data = await response.json();
            
            if (data.success && data.subAdmin) {
                setSubAdmin(data.subAdmin);
                setIsLoggedIn(true);
                fetchOrders();
            } else {
                let errorMsg = data.error || 'Code invalide ou sous-admin inactif';
                
                // Ajouter les codes disponibles si disponibles en debug
                if (data.debug && data.debug.activeCodes && data.debug.activeCodes.length > 0) {
                    errorMsg += `\n\nCodes disponibles : ${data.debug.activeCodes.join(', ')}`;
                }
                
                setError(errorMsg);
            }
        } catch (err) {
            console.error('Error logging in subadmin:', err);
            setError('Erreur de connexion au serveur');
        } finally {
            setLoading(false);
        }
    };

    const fetchOrders = async () => {
        setOrdersLoading(true);
        try {
            const url = filterStatus === 'all' 
                ? '/api/admin/subadmin/orders'
                : `/api/admin/subadmin/orders?status=${filterStatus}`;
            
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
            setOrdersLoading(false);
        }
    };

    useEffect(() => {
        if (isLoggedIn) {
            fetchOrders();
        }
    }, [filterStatus, isLoggedIn]);

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
                                onChange={(e) => setCode(e.target.value.toUpperCase())}
                                placeholder="MON-001"
                                className={styles.loginInput}
                                required
                            />
                            {error && (
                                <div style={{ 
                                    padding: '0.75rem', 
                                    background: '#fee2e2', 
                                    border: '1px solid #fecaca', 
                                    borderRadius: '0.5rem', 
                                    color: '#991b1b',
                                    fontSize: '0.9rem',
                                    marginTop: '0.5rem',
                                    whiteSpace: 'pre-line'
                                }}>
                                    {error}
                                </div>
                            )}
                            <p style={{ 
                                fontSize: '0.85rem', 
                                color: '#6b7280', 
                                marginTop: '0.5rem',
                                fontStyle: 'italic'
                            }}>
                                💡 Le format du code est MON-XXX (ex: MON-001)
                            </p>
                        </div>
                        <button 
                            type="submit" 
                            className={styles.loginButton}
                            disabled={loading}
                        >
                            {loading ? 'Connexion...' : 'Connexion'}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    // Filtrer les commandes selon le statut sélectionné
    const filteredOrders = filterStatus === 'all' 
        ? orders 
        : orders.filter(o => o.status === filterStatus);

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
                        <div className={styles.userName}>{subAdmin?.name} ({subAdmin?.code})</div>
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
                        {orders.filter(o => o.status === 'pending').length}
                    </div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statLabel}>En Traitement</div>
                    <div className={`${styles.statValue} ${styles.processing}`}>
                        {orders.filter(o => o.status === 'processing').length}
                    </div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statLabel}>Total à Traiter</div>
                    <div className={`${styles.statValue} ${styles.total}`}>
                        {orders.length}
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
                            {ordersLoading ? (
                                <tr>
                                    <td colSpan={7} style={{ textAlign: 'center', padding: '2rem' }}>
                                        <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>⏳</div>
                                        Chargement des commandes...
                                    </td>
                                </tr>
                            ) : filteredOrders.length === 0 ? (
                                <tr>
                                    <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                                        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📦</div>
                                        Aucune commande à traiter pour le moment.
                                    </td>
                                </tr>
                            ) : (
                                filteredOrders.map(order => {
                                    // Convertir SubAdminOrder en Order pour OrderDetails en utilisant les données réelles
                                    const orderForDetails: Order = {
                                        id: order.id,
                                        orderNumber: order.orderNumber || order.id,
                                        customerName: order.customerName,
                                        customerEmail: order.customerEmail,
                                        customerPhone: order.customerPhone || '',
                                        shippingAddress: (order.shippingAddress || {
                                            street: '',
                                            city: '',
                                            state: '',
                                            zip: '',
                                            country: 'US'
                                        }) as ShippingAddress,
                                        items: (order.items?.map(item => ({
                                            id: item.id,
                                            name: item.name,
                                            quantity: item.quantity,
                                            price: item.price,
                                            size: item.size || '',
                                            productId: item.productId || item.id,
                                            image: item.image || ''
                                        })) || []) as OrderItem[],
                                        status: order.status as any,
                                        // ✅ FIX: Cast explicite de statusHistory avec mapping proper
                                        statusHistory: (order.statusHistory || []).map(sh => ({
                                            status: sh.status as any,
                                            timestamp: sh.timestamp,
                                            note: sh.note,
                                            updatedBy: sh.updatedBy
                                        })),
                                        subtotal: order.subtotal || order.total,
                                        shippingCost: order.shippingCost || 0,
                                        tax: order.tax || 0,
                                        total: order.total,
                                        currency: order.currency as 'USD' | 'CAD' | 'MXN',
                                        date: order.date,
                                        trackingNumber: order.trackingNumber,
                                        paymentMethod: order.paymentMethod || 'Non spécifié'
                                    };
                                    
                                    return (
                                        <tr key={order.id}>
                                            <td style={{ fontWeight: 600 }}>{order.orderNumber || order.id.substring(0, 8)}...</td>
                                            <td>
                                                <div style={{ fontWeight: 500 }}>{order.customerName}</div>
                                                <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>{order.customerEmail}</div>
                                            </td>
                                            <td>
                                                {order.shippingAddress?.country === 'US' ? '🇺🇸 USA' :
                                                    order.shippingAddress?.country === 'CA' ? '🇨🇦 Canada' : 
                                                    order.shippingAddress?.country === 'MX' ? '🇲🇽 Mexique' :
                                                    order.shippingAddress?.country || 'N/A'}
                                            </td>
                                            <td>{order.items?.length || 0} produit(s)</td>
                                            <td style={{ fontWeight: 600 }}>
                                                {new Intl.NumberFormat('fr-FR', { 
                                                    style: 'currency', 
                                                    currency: order.currency || 'USD' 
                                                }).format(order.total)}
                                            </td>
                                            <td>
                                                <span className={`${styles.statusBadge} ${order.status === 'pending' ? styles.pending : styles.processing}`}>
                                                    {order.status === 'pending' ? 'En Attente' : order.status === 'processing' ? 'En Traitement' : order.status}
                                                </span>
                                            </td>
                                            <td>
                                                <button
                                                    className={styles.actionButton}
                                                    onClick={async () => {
                                                        // Récupérer les détails complets depuis la base de données
                                                        try {
                                                            const response = await fetch(`/api/admin/subadmin/orders/${order.id}`);
                                                            const data = await response.json();
                                                            
                                                            if (data.success && data.order) {
                                                                // Convertir en format Order
                                                                const fullOrder: Order = {
                                                                    id: data.order.id,
                                                                    orderNumber: data.order.orderNumber || data.order.id,
                                                                    customerName: data.order.customerName,
                                                                    customerEmail: data.order.customerEmail,
                                                                    customerPhone: data.order.customerPhone || '',
                                                                    shippingAddress: data.order.shippingAddress as ShippingAddress,
                                                                    items: data.order.items as OrderItem[],
                                                                    status: data.order.status as any,
                                                                    // ✅ FIX: Cast explicite de statusHistory
                                                                    statusHistory: (data.order.statusHistory || []).map((sh: any) => ({
                                                                        status: sh.status as any,
                                                                        timestamp: sh.timestamp,
                                                                        note: sh.note,
                                                                        updatedBy: sh.updatedBy
                                                                    })),
                                                                    subtotal: data.order.subtotal || data.order.total,
                                                                    shippingCost: data.order.shippingCost || 0,
                                                                    tax: data.order.tax || 0,
                                                                    total: data.order.total,
                                                                    currency: data.order.currency as 'USD' | 'CAD' | 'MXN',
                                                                    date: data.order.date,
                                                                    trackingNumber: data.order.trackingNumber,
                                                                    paymentMethod: data.order.paymentMethod || 'Non spécifié'
                                                                };
                                                                setSelectedOrder(fullOrder);
                                                            } else {
                                                                alert('Erreur lors du chargement des détails de la commande');
                                                            }
                                                        } catch (err) {
                                                            console.error('Error fetching order details:', err);
                                                            alert('Erreur de connexion au serveur');
                                                        }
                                                    }}
                                                >
                                                    Voir Détails
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </main>

            {/* Order Details Modal */}
            {selectedOrder && (
                <OrderDetails
                    order={selectedOrder}
                    subAdminCode={code}
                    onClose={() => setSelectedOrder(null)}
                    onStatusUpdate={async (orderId, newStatus, trackingNumber) => {
                        // Rafraîchir les données depuis la base de données
                        await fetchOrders();
                        // Fermer le modal
                        setSelectedOrder(null);
                    }}
                />
            )}
        </div>
    );
}