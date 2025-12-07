'use client';

import { useState, useEffect } from 'react';
import StatCard from '@/components/admin/StatCard';
import Link from 'next/link';
import styles from './page.module.css';

interface DashboardStats {
    totalRevenue: number;
    totalOrders: number;
    totalProducts: number;
    totalCustomers: number;
    pendingOrders: number;
    processingOrders: number;
    shippedOrders: number;
    deliveredOrders: number;
    revenueByCountry: Array<{
        country: string;
        revenue: number;
        currency: string;
        orderCount: number;
    }>;
    recentOrders: Array<{
        id: string;
        customerName: string;
        date: string;
        status: string;
        total: number;
        currency: string;
    }>;
}

export default function AdminDashboard() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchStats() {
            try {
                const response = await fetch('/api/admin/dashboard/stats');
                const data = await response.json();
                
                if (data.success) {
                    setStats(data.stats);
                } else {
                    setError(data.error || 'Erreur lors du chargement des statistiques');
                }
            } catch (err) {
                console.error('Error fetching dashboard stats:', err);
                setError('Erreur de connexion au serveur');
            } finally {
                setLoading(false);
            }
        }
        
        fetchStats();
    }, []);

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

    if (loading) {
        return (
            <div className={styles.container}>
                <div style={{ textAlign: 'center', padding: '3rem' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
                    <p>Chargement des statistiques...</p>
                </div>
            </div>
        );
    }

    if (error || !stats) {
        return (
            <div className={styles.container}>
                <div style={{ textAlign: 'center', padding: '3rem' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⚠️</div>
                    <p>{error || 'Erreur lors du chargement des données'}</p>
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
                <h1 className={styles.title}>Dashboard Administrateur</h1>
                <p className={styles.subtitle}>
                    Vue d'ensemble complète de votre boutique e-commerce
                </p>
            </div>

            {/* Stats Grid */}
            <div className={styles.statsGrid}>
                <StatCard
                    label="Revenus Totaux"
                    value={`$${stats.totalRevenue.toFixed(2)}`}
                    icon="💰"
                    iconColor="green"
                />
                <StatCard
                    label="Commandes"
                    value={stats.totalOrders}
                    icon="📦"
                    iconColor="blue"
                    trend={{ value: `${stats.pendingOrders} en attente`, isPositive: false }}
                />
                <StatCard
                    label="Produits"
                    value={stats.totalProducts}
                    icon="🛍️"
                    iconColor="purple"
                />
                <StatCard
                    label="Clients"
                    value={stats.totalCustomers}
                    icon="👥"
                    iconColor="orange"
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
            {stats.revenueByCountry.length > 0 && (
                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>Revenus par Pays</h2>
                    <div className={styles.countryGrid}>
                        {stats.revenueByCountry.map((country) => (
                            <div key={country.country} className={styles.countryCard}>
                                <div className={styles.countryFlag}>
                                    {country.country === 'US' ? '🇺🇸' : country.country === 'CA' ? '🇨🇦' : country.country === 'MX' ? '🇲🇽' : '🌍'}
                                </div>
                                <div className={styles.countryName}>
                                    {country.country === 'US' ? 'États-Unis' : country.country === 'CA' ? 'Canada' : country.country === 'MX' ? 'Mexique' : country.country}
                                </div>
                                <div className={styles.countryRevenue}>
                                    {new Intl.NumberFormat('fr-FR', {
                                        style: 'currency',
                                        currency: country.currency || 'USD'
                                    }).format(country.revenue)}
                                </div>
                                <div className={styles.countryOrders}>
                                    {country.orderCount} commande{country.orderCount > 1 ? 's' : ''}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Recent Orders */}
            <div className={styles.section}>
                <div className={styles.sectionTitle}>
                    <h2>Dernières Commandes</h2>
                    <Link href="/admin/orders" className={styles.viewAllLink}>
                        Voir toutes →
                    </Link>
                </div>
                {stats.recentOrders.length > 0 ? (
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
                            {stats.recentOrders.map((order) => (
                                <tr key={order.id}>
                                    <td style={{ fontWeight: 600 }}>{order.id.substring(0, 8)}...</td>
                                    <td>{order.customerName}</td>
                                    <td style={{ color: 'var(--color-gray-600)' }}>
                                        {new Date(order.date).toLocaleDateString('fr-FR')}
                                    </td>
                                    <td>{getStatusBadge(order.status)}</td>
                                    <td style={{ fontWeight: 600 }}>
                                        {new Intl.NumberFormat('fr-FR', {
                                            style: 'currency',
                                            currency: order.currency || 'USD'
                                        }).format(order.total)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                        <p>Aucune commande récente</p>
                    </div>
                )}
            </div>
        </div>
    );
}
