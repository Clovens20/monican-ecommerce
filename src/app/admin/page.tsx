'use client';

import { mockOrders } from '@/lib/orders';
import { mockProducts } from '@/lib/products';
import { mockCustomers, mockFinancialStats } from '@/lib/mockData';
import StatCard from '@/components/admin/StatCard';
import Link from 'next/link';
import styles from './page.module.css';

export default function AdminDashboard() {
    // Calculate stats
    const totalRevenue = mockFinancialStats.totalRevenue;
    const totalOrders = mockOrders.length;
    const totalProducts = mockProducts.length;
    const totalCustomers = mockCustomers.length;

    const pendingOrders = mockOrders.filter(o => o.status === 'pending').length;
    const processingOrders = mockOrders.filter(o => o.status === 'processing').length;

    // Recent orders (last 5)
    const recentOrders = [...mockOrders]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5);

    const getStatusBadge = (status: string) => {
        const statusStyles: { [key: string]: { bg: string; color: string; text: string } } = {
            'pending': { bg: '#fef3c7', color: '#92400e', text: 'En Attente' },
            'processing': { bg: '#dbeafe', color: '#1e40af', text: 'En Traitement' },
            'shipped': { bg: '#e0e7ff', color: '#3730a3', text: 'Expédié' },
            'delivered': { bg: '#d1fae5', color: '#065f46', text: 'Livré' },
            'cancelled': { bg: '#fee2e2', color: '#991b1b', text: 'Annulé' },
        };
        const style = statusStyles[status] || statusStyles['pending'];
        return (
            <span style={{
                background: style.bg,
                color: style.color,
                padding: '0.25rem 0.75rem',
                borderRadius: '9999px',
                fontSize: '0.8rem',
                fontWeight: 600
            }}>
                {style.text}
            </span>
        );
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Dashboard Administrateur</h1>
                <p className={styles.subtitle}>
                    Vue d'ensemble complète de votre boutique e-commerce
                </p>
            </div>

            {/* Stats Grid */}
            <div className={styles.statsGrid}>
                <StatCard
                    label="Revenus Totaux"
                    value={`$${totalRevenue.toFixed(2)}`}
                    icon="💰"
                    iconColor="green"
                    trend={{ value: '+12.5% ce mois', isPositive: true }}
                />
                <StatCard
                    label="Commandes"
                    value={totalOrders}
                    icon="📦"
                    iconColor="blue"
                    trend={{ value: `${pendingOrders} en attente`, isPositive: false }}
                />
                <StatCard
                    label="Produits"
                    value={totalProducts}
                    icon="🛍️"
                    iconColor="purple"
                />
                <StatCard
                    label="Clients"
                    value={totalCustomers}
                    icon="👥"
                    iconColor="orange"
                    trend={{ value: '+3 cette semaine', isPositive: true }}
                />
            </div>

            {/* Quick Actions */}
            <div className={styles.quickActions}>
                <Link href="/admin/orders" className={styles.actionCard}>
                    <span className={styles.actionIcon}>📋</span>
                    <span>Gérer les Commandes</span>
                </Link>
                <Link href="/admin/products" className={styles.actionCard}>
                    <span className={styles.actionIcon}>🛍️</span>
                    <span>Gérer les Produits</span>
                </Link>
                <Link href="/admin/finances" className={styles.actionCard}>
                    <span className={styles.actionIcon}>💵</span>
                    <span>Finances</span>
                </Link>
                <Link href="/admin/users" className={styles.actionCard}>
                    <span className={styles.actionIcon}>👥</span>
                    <span>Utilisateurs</span>
                </Link>
            </div>

            {/* Revenue by Country */}
            <div className={styles.section}>
                <h2 className={styles.sectionTitle}>Revenus par Pays</h2>
                <div className={styles.countryGrid}>
                    {mockFinancialStats.revenueByCountry.map((country) => (
                        <div key={country.country} className={styles.countryCard}>
                            <div className={styles.countryFlag}>
                                {country.country === 'US' ? '🇺🇸' : country.country === 'CA' ? '🇨🇦' : '🇲🇽'}
                            </div>
                            <div className={styles.countryName}>
                                {country.country === 'US' ? 'États-Unis' : country.country === 'CA' ? 'Canada' : 'Mexique'}
                            </div>
                            <div className={styles.countryRevenue}>
                                {new Intl.NumberFormat('fr-FR', {
                                    style: 'currency',
                                    currency: country.currency
                                }).format(country.revenue)}
                            </div>
                            <div className={styles.countryOrders}>
                                {country.orderCount} commandes
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Recent Orders */}
            <div className={styles.section}>
                <div className={styles.sectionTitle}>
                    <h2>Dernières Commandes</h2>
                    <Link href="/admin/orders" className={styles.viewAllLink}>
                        Voir toutes →
                    </Link>
                </div>
                <table className={styles.ordersTable}>
                    <thead>
                        <tr>
                            <th>ID Commande</th>
                            <th>Client</th>
                            <th>Date</th>
                            <th>Statut</th>
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {recentOrders.map((order) => (
                            <tr key={order.id}>
                                <td style={{ fontWeight: 600 }}>{order.id}</td>
                                <td>{order.customerName}</td>
                                <td style={{ color: 'var(--color-gray-600)' }}>
                                    {new Date(order.date).toLocaleDateString('fr-FR')}
                                </td>
                                <td>{getStatusBadge(order.status)}</td>
                                <td style={{ fontWeight: 600 }}>
                                    {new Intl.NumberFormat('fr-FR', {
                                        style: 'currency',
                                        currency: order.currency
                                    }).format(order.total)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
