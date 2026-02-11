'use client';

import { useState, useEffect } from 'react';
import styles from '../orders/page.module.css';

interface WholesaleItem {
    productName: string;
    size: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
}

interface WholesaleOrder {
    id: string;
    company_name: string;
    contact_name: string;
    email: string;
    phone: string | null;
    address: string;
    city: string;
    state: string;
    zip: string;
    country: string;
    items: WholesaleItem[];
    total_quantity: number;
    subtotal: number;
    discount_percent: number;
    discount_amount: number;
    total: number;
    notes: string | null;
    status: string;
    created_at: string;
}

export default function WholesaleAdminPage() {
    const [orders, setOrders] = useState<WholesaleOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    useEffect(() => {
        async function fetchOrders() {
            try {
                const response = await fetch('/api/admin/wholesale');
                const data = await response.json();

                if (data.success) {
                    setOrders(data.orders);
                } else {
                    setError(data.error || 'Erreur lors du chargement');
                }
            } catch (err) {
                console.error('Error fetching wholesale orders:', err);
                setError('Erreur de connexion au serveur');
            } finally {
                setLoading(false);
            }
        }

        fetchOrders();
    }, []);

    const formatPrice = (amount: number) =>
        new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'USD' }).format(amount);

    const getStatusText = (status: string) => {
        const map: Record<string, string> = {
            pending: 'En attente',
            contacted: 'Contacté',
            processing: 'En cours',
            completed: 'Traité',
            cancelled: 'Annulé',
        };
        return map[status] || status;
    };

    if (loading) {
        return (
            <div className={styles.container}>
                <div style={{ textAlign: 'center', padding: '3rem' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
                    <p>Chargement des demandes wholesale...</p>
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
                        style={{
                            marginTop: '1rem',
                            padding: '0.5rem 1rem',
                            background: '#10b981',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.5rem',
                            cursor: 'pointer',
                        }}
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
                <h1 className={styles.title}>Demandes Vente en Gros</h1>
                <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>
                    Les demandes sont enregistrées ici et un email est envoyé à l&apos;admin à chaque soumission.
                </p>
            </div>

            {orders.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🛒</div>
                    <h3 style={{ marginBottom: '0.5rem' }}>Aucune demande</h3>
                    <p>Les demandes soumises via le formulaire wholesale apparaîtront ici.</p>
                </div>
            ) : (
                <div style={{ overflowX: 'auto' }}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th className={styles.th}>Date</th>
                                <th className={styles.th}>Société</th>
                                <th className={styles.th}>Contact</th>
                                <th className={styles.th}>Articles</th>
                                <th className={styles.th}>Total</th>
                                <th className={styles.th}>Statut</th>
                                <th className={styles.th}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map((order) => (
                                <>
                                    <tr key={order.id}>
                                        <td className={styles.td}>
                                            {new Date(order.created_at).toLocaleDateString('fr-FR', {
                                                day: '2-digit',
                                                month: 'short',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </td>
                                        <td className={styles.td}>
                                            <div style={{ fontWeight: 500 }}>{order.company_name}</div>
                                        </td>
                                        <td className={styles.td}>
                                            <div>{order.contact_name}</div>
                                            <a
                                                href={`mailto:${order.email}`}
                                                style={{ fontSize: '0.85rem', color: '#3b82f6' }}
                                            >
                                                {order.email}
                                            </a>
                                            {order.phone && (
                                                <div>
                                                    <a href={`tel:${order.phone}`}>{order.phone}</a>
                                                </div>
                                            )}
                                        </td>
                                        <td className={styles.td}>{order.total_quantity} art.</td>
                                        <td className={styles.td}>{formatPrice(order.total)}</td>
                                        <td className={styles.td}>
                                            <span
                                                className={`${styles.status} ${styles[`status-${order.status}`] || ''}`}
                                            >
                                                {getStatusText(order.status)}
                                            </span>
                                        </td>
                                        <td className={styles.td}>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setExpandedId(expandedId === order.id ? null : order.id)
                                                }
                                                style={{
                                                    background: 'none',
                                                    border: 'none',
                                                    color: '#3b82f6',
                                                    cursor: 'pointer',
                                                    fontSize: '0.9rem',
                                                }}
                                            >
                                                {expandedId === order.id ? 'Masquer' : 'Détails'}
                                            </button>
                                        </td>
                                    </tr>
                                    {expandedId === order.id && (
                                        <tr key={`${order.id}-details`}>
                                            <td colSpan={7} style={{ padding: 0, borderBottom: '1px solid #e5e7eb' }}>
                                                <div
                                                    style={{
                                                        padding: '1.5rem 2rem',
                                                        background: '#f9fafb',
                                                    }}
                                                >
                                                    <div style={{ marginBottom: '1rem' }}>
                                                        <strong>Adresse :</strong>{' '}
                                                        {order.address}, {order.city}, {order.state}{' '}
                                                        {order.zip}, {order.country}
                                                    </div>
                                                    {order.notes && (
                                                        <div style={{ marginBottom: '1rem' }}>
                                                            <strong>Notes :</strong> {order.notes}
                                                        </div>
                                                    )}
                                                    <table
                                                        style={{
                                                            width: '100%',
                                                            borderCollapse: 'collapse',
                                                            background: 'white',
                                                            borderRadius: '8px',
                                                            overflow: 'hidden',
                                                        }}
                                                    >
                                                        <thead>
                                                            <tr style={{ background: '#f3f4f6' }}>
                                                                <th style={{ padding: 10, textAlign: 'left' }}>
                                                                    Produit
                                                                </th>
                                                                <th style={{ padding: 10, textAlign: 'left' }}>
                                                                    Taille
                                                                </th>
                                                                <th style={{ padding: 10, textAlign: 'center' }}>
                                                                    Qté
                                                                </th>
                                                                <th style={{ padding: 10, textAlign: 'right' }}>
                                                                    Prix unit.
                                                                </th>
                                                                <th style={{ padding: 10, textAlign: 'right' }}>
                                                                    Total
                                                                </th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {order.items.map((item, i) => (
                                                                <tr key={i}>
                                                                    <td style={{ padding: 10 }}>
                                                                        {item.productName}
                                                                    </td>
                                                                    <td style={{ padding: 10 }}>
                                                                        {item.size}
                                                                    </td>
                                                                    <td
                                                                        style={{
                                                                            padding: 10,
                                                                            textAlign: 'center',
                                                                        }}
                                                                    >
                                                                        {item.quantity}
                                                                    </td>
                                                                    <td
                                                                        style={{
                                                                            padding: 10,
                                                                            textAlign: 'right',
                                                                        }}
                                                                    >
                                                                        {formatPrice(item.unitPrice)}
                                                                    </td>
                                                                    <td
                                                                        style={{
                                                                            padding: 10,
                                                                            textAlign: 'right',
                                                                        }}
                                                                    >
                                                                        {formatPrice(item.totalPrice)}
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                    <div
                                                        style={{
                                                            marginTop: '1rem',
                                                            display: 'flex',
                                                            gap: '2rem',
                                                            fontSize: '0.95rem',
                                                        }}
                                                    >
                                                        <span>
                                                            Sous-total : {formatPrice(order.subtotal)}
                                                        </span>
                                                        {order.discount_percent > 0 && (
                                                            <span>
                                                                Réduction ({order.discount_percent}
                                                                %) : -{formatPrice(order.discount_amount)}
                                                            </span>
                                                        )}
                                                        <span style={{ fontWeight: 700 }}>
                                                            Total : {formatPrice(order.total)}
                                                        </span>
                                                    </div>
                                                    <div style={{ marginTop: '1rem' }}>
                                                        <a
                                                            href={`mailto:${order.email}?subject=Réponse à votre demande wholesale - ${order.company_name}`}
                                                            style={{
                                                                display: 'inline-block',
                                                                padding: '0.5rem 1rem',
                                                                background: '#10b981',
                                                                color: 'white',
                                                                borderRadius: '6px',
                                                                textDecoration: 'none',
                                                                fontSize: '0.9rem',
                                                            }}
                                                        >
                                                            ✉️ Répondre par email
                                                        </a>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
