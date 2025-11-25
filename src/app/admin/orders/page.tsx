'use client';

import Link from 'next/link';
import { mockOrders } from '@/lib/orders';
import styles from './page.module.css';

export default function OrdersPage() {
    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Gestion des Commandes</h1>
                <div className={styles.filters}>
                    <select className={styles.filterSelect}>
                        <option value="all">Tous les statuts</option>
                        <option value="pending">En attente</option>
                        <option value="processing">En traitement</option>
                        <option value="shipped">Expédiées</option>
                    </select>
                </div>
            </div>

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
                    {mockOrders.map((order) => (
                        <tr key={order.id}>
                            <td className={styles.td}>{order.id}</td>
                            <td className={styles.td}>
                                <div style={{ fontWeight: 500 }}>{order.customerName}</div>
                                <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>{order.customerEmail}</div>
                            </td>
                            <td className={styles.td}>{new Date(order.date).toLocaleDateString()}</td>
                            <td className={styles.td}>{order.shippingAddress.country}</td>
                            <td className={styles.td}>${order.total.toFixed(2)}</td>
                            <td className={styles.td}>
                                <span className={`${styles.status} ${styles[`status-${order.status}`]}`}>
                                    {order.status}
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
        </div>
    );
}
