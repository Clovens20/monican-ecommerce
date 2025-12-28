'use client';

import { useState, useEffect } from 'react';
import styles from './page.module.css';

interface FinancialStats {
    totalRevenue: number;
    totalOrders: number;
    averageOrderValue: number;
    revenueByCountry: Array<{
        country: string;
        revenue: number;
        currency: string;
        orderCount: number;
    }>;
    monthlyRevenue: Array<{
        month: string;
        value: number;
    }>;
}

export default function FinancesPage() {
    const [stats, setStats] = useState<FinancialStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchFinancialStats() {
            try {
                const response = await fetch('/api/admin/dashboard/stats');
                const data = await response.json();
                
                if (data.success) {
                    // Calculer le panier moyen (seulement pour les commandes non annulées/non remboursées)
                    const validOrdersCount = data.stats.validOrdersCount || 0;
                    const averageOrderValue = validOrdersCount > 0 
                        ? data.stats.totalRevenue / validOrdersCount 
                        : 0;
                    
                    // Générer les données mensuelles (pour l'instant, on utilise les données disponibles)
                    // TODO: Implémenter une vraie agrégation mensuelle
                    const monthlyRevenue = [
                        { month: 'Jan', value: 0 },
                        { month: 'Fév', value: 0 },
                        { month: 'Mar', value: 0 },
                        { month: 'Avr', value: 0 },
                        { month: 'Mai', value: 0 },
                        { month: 'Juin', value: 0 },
                        { month: 'Juil', value: 0 },
                        { month: 'Août', value: 0 },
                        { month: 'Sep', value: 0 },
                        { month: 'Oct', value: 0 },
                        { month: 'Nov', value: 0 },
                        { month: 'Déc', value: 0 },
                    ];
                    
                    setStats({
                        totalRevenue: data.stats.totalRevenue,
                        totalOrders: data.stats.totalOrders,
                        averageOrderValue,
                        revenueByCountry: data.stats.revenueByCountry || [],
                        monthlyRevenue
                    });
                } else {
                    setError(data.error || 'Erreur lors du chargement des statistiques');
                }
            } catch (err) {
                console.error('Error fetching financial stats:', err);
                setError('Erreur de connexion au serveur');
            } finally {
                setLoading(false);
            }
        }
        
        fetchFinancialStats();
        
        // Rafraîchir automatiquement toutes les 30 secondes pour mettre à jour le revenu total
        // après les annulations/remboursements
        const interval = setInterval(() => {
            fetchFinancialStats();
        }, 30000); // 30 secondes
        
        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return (
            <div className={styles.container}>
                <div style={{ textAlign: 'center', padding: '3rem' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
                    <p>Chargement des rapports financiers...</p>
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

    const maxVal = Math.max(...stats.monthlyRevenue.map(d => d.value), 1);

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>Rapports Financiers</h1>

            <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <div className={styles.statLabel}>Revenus Totaux</div>
                    <div className={styles.statValue}>
                        {new Intl.NumberFormat('fr-FR', {
                            style: 'currency',
                            currency: 'USD'
                        }).format(stats.totalRevenue)}
                    </div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statLabel}>Commandes</div>
                    <div className={styles.statValue}>{stats.totalOrders}</div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statLabel}>Panier Moyen</div>
                    <div className={styles.statValue}>
                        {new Intl.NumberFormat('fr-FR', {
                            style: 'currency',
                            currency: 'USD'
                        }).format(stats.averageOrderValue)}
                    </div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statLabel}>Pays Actifs</div>
                    <div className={styles.statValue}>{stats.revenueByCountry.length}</div>
                </div>
            </div>

            <div className={styles.card}>
                <h2 className={styles.subtitle}>Évolution des Revenus</h2>
                {stats.monthlyRevenue.some(d => d.value > 0) ? (
                    <div className={styles.chartContainer}>
                        {stats.monthlyRevenue.map((data) => (
                            <div key={data.month} className={styles.barGroup}>
                                <div
                                    className={styles.bar}
                                    style={{ height: `${(data.value / maxVal) * 100}%` }}
                                    title={new Intl.NumberFormat('fr-FR', {
                                        style: 'currency',
                                        currency: 'USD'
                                    }).format(data.value)}
                                ></div>
                                <span className={styles.barLabel}>{data.month}</span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                        <p>Aucune donnée mensuelle disponible</p>
                        <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
                            Les données mensuelles seront disponibles une fois que vous aurez des commandes
                        </p>
                    </div>
                )}
            </div>

            <div className={styles.card}>
                <h2 className={styles.subtitle}>Performance par Pays</h2>
                {stats.revenueByCountry.length > 0 ? (
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th className={styles.th}>Pays</th>
                                <th className={styles.th}>Commandes</th>
                                <th className={styles.th}>Revenus</th>
                                <th className={styles.th}>% du Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stats.revenueByCountry
                                .sort((a, b) => b.revenue - a.revenue)
                                .map((country) => {
                                    const percentage = stats.totalRevenue > 0 
                                        ? (country.revenue / stats.totalRevenue) * 100 
                                        : 0;
                                    const flag = country.country === 'US' ? '🇺🇸' 
                                        : country.country === 'CA' ? '🇨🇦' 
                                        : country.country === 'MX' ? '🇲🇽' 
                                        : '🌍';
                                    const countryName = country.country === 'US' ? 'États-Unis'
                                        : country.country === 'CA' ? 'Canada'
                                        : country.country === 'MX' ? 'Mexique'
                                        : country.country;
                                    
                                    return (
                                        <tr key={country.country}>
                                            <td className={styles.td}>{flag} {countryName}</td>
                                            <td className={styles.td}>{country.orderCount}</td>
                                            <td className={styles.td}>
                                                {new Intl.NumberFormat('fr-FR', {
                                                    style: 'currency',
                                                    currency: country.currency || 'USD'
                                                }).format(country.revenue)}
                                            </td>
                                            <td className={styles.td}>{percentage.toFixed(1)}%</td>
                                        </tr>
                                    );
                                })}
                        </tbody>
                    </table>
                ) : (
                    <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                        <p>Aucune donnée par pays disponible</p>
                    </div>
                )}
            </div>
        </div>
    );
}
