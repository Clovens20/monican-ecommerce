'use client';

import { mockOrders } from '@/lib/orders';
import { mockProducts } from '@/lib/products';
import { mockCustomers, mockFinancialStats } from '@/lib/mockData';
import StatCard from '@/components/admin/StatCard';
import Link from 'next/link';

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
        <div>
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                    Dashboard
                </h1>
                <p style={{ color: '#6b7280' }}>
                    Vue d'ensemble de votre boutique e-commerce
                </p>
            </div>

            {/* Stats Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '1.5rem',
                marginBottom: '2.5rem'
            }}>
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
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem',
                marginBottom: '2.5rem'
            }}>
                <Link href="/admin/orders" style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    padding: '1.25rem',
                    borderRadius: '0.75rem',
                    textDecoration: 'none',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    transition: 'transform 0.2s, box-shadow 0.2s'
                }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 10px 20px rgba(102, 126, 234, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                    }}>
                    <span style={{ fontSize: '1.5rem' }}>📋</span>
                    <span>Gérer les Commandes</span>
                </Link>
                <Link href="/admin/products" style={{
                    background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                    color: 'white',
                    padding: '1.25rem',
                    borderRadius: '0.75rem',
                    textDecoration: 'none',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    transition: 'transform 0.2s, box-shadow 0.2s'
                }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 10px 20px rgba(245, 87, 108, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                    }}>
                    <span style={{ fontSize: '1.5rem' }}>🛍️</span>
                    <span>Gérer les Produits</span>
                </Link>
                <Link href="/admin/finances" style={{
                    background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                    color: 'white',
                    padding: '1.25rem',
                    borderRadius: '0.75rem',
                    textDecoration: 'none',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    transition: 'transform 0.2s, box-shadow 0.2s'
                }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 10px 20px rgba(79, 172, 254, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                    }}>
                    <span style={{ fontSize: '1.5rem' }}>💵</span>
                    <span>Finances</span>
                </Link>
                <Link href="/admin/users" style={{
                    background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                    color: 'white',
                    padding: '1.25rem',
                    borderRadius: '0.75rem',
                    textDecoration: 'none',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    transition: 'transform 0.2s, box-shadow 0.2s'
                }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 10px 20px rgba(250, 112, 154, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                    }}>
                    <span style={{ fontSize: '1.5rem' }}>👥</span>
                    <span>Utilisateurs</span>
                </Link>
            </div>

            {/* Revenue by Country */}
            <div style={{
                background: 'white',
                padding: '1.5rem',
                borderRadius: '1rem',
                border: '1px solid #e5e7eb',
                marginBottom: '2.5rem'
            }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
                    Revenus par Pays
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
                    {mockFinancialStats.revenueByCountry.map((country) => (
                        <div key={country.country} style={{
                            padding: '1.25rem',
                            background: '#f9fafb',
                            borderRadius: '0.75rem',
                            border: '1px solid #e5e7eb'
                        }}>
                            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
                                {country.country === 'US' ? '🇺🇸' : country.country === 'CA' ? '🇨🇦' : '🇲🇽'}
                            </div>
                            <div style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                                {country.country === 'US' ? 'États-Unis' : country.country === 'CA' ? 'Canada' : 'Mexique'}
                            </div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981' }}>
                                {new Intl.NumberFormat('fr-FR', {
                                    style: 'currency',
                                    currency: country.currency
                                }).format(country.revenue)}
                            </div>
                            <div style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '0.25rem' }}>
                                {country.orderCount} commandes
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Recent Orders */}
            <div style={{ background: 'white', padding: '1.5rem', borderRadius: '1rem', border: '1px solid #e5e7eb' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0 }}>
                        Dernières Commandes
                    </h2>
                    <Link href="/admin/orders" style={{
                        color: '#667eea',
                        textDecoration: 'none',
                        fontWeight: 600,
                        fontSize: '0.9rem'
                    }}>
                        Voir toutes →
                    </Link>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                            <th style={{ padding: '1rem 0', color: '#6b7280', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase' }}>ID Commande</th>
                            <th style={{ padding: '1rem 0', color: '#6b7280', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase' }}>Client</th>
                            <th style={{ padding: '1rem 0', color: '#6b7280', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase' }}>Date</th>
                            <th style={{ padding: '1rem 0', color: '#6b7280', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase' }}>Statut</th>
                            <th style={{ padding: '1rem 0', color: '#6b7280', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase' }}>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {recentOrders.map((order) => (
                            <tr key={order.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                <td style={{ padding: '1rem 0', fontWeight: 600 }}>{order.id}</td>
                                <td style={{ padding: '1rem 0' }}>{order.customerName}</td>
                                <td style={{ padding: '1rem 0', color: '#6b7280' }}>
                                    {new Date(order.date).toLocaleDateString('fr-FR')}
                                </td>
                                <td style={{ padding: '1rem 0' }}>{getStatusBadge(order.status)}</td>
                                <td style={{ padding: '1rem 0', fontWeight: 600 }}>
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
