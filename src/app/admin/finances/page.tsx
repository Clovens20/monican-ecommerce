'use client';

import styles from './page.module.css';

const monthlyData = [
    { month: 'Jan', value: 4500 },
    { month: 'Fév', value: 5200 },
    { month: 'Mar', value: 4800 },
    { month: 'Avr', value: 6100 },
    { month: 'Mai', value: 5900 },
    { month: 'Juin', value: 7500 },
    { month: 'Juil', value: 8200 },
    { month: 'Août', value: 7800 },
    { month: 'Sep', value: 9100 },
    { month: 'Oct', value: 10500 },
    { month: 'Nov', value: 12450 },
    { month: 'Déc', value: 3200 }, // Current partial month
];

const maxVal = Math.max(...monthlyData.map(d => d.value));

export default function FinancesPage() {
    return (
        <div className={styles.container}>
            <h1 className={styles.title}>Rapports Financiers</h1>

            <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <div className={styles.statLabel}>Revenus Totaux (Année)</div>
                    <div className={styles.statValue}>$85,250.00</div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statLabel}>Commandes</div>
                    <div className={styles.statValue}>1,245</div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statLabel}>Panier Moyen</div>
                    <div className={styles.statValue}>$68.47</div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statLabel}>Taux de Conversion</div>
                    <div className={styles.statValue}>3.2%</div>
                </div>
            </div>

            <div className={styles.card}>
                <h2 className={styles.subtitle}>Évolution des Revenus</h2>
                <div className={styles.chartContainer}>
                    {monthlyData.map((data) => (
                        <div key={data.month} className={styles.barGroup}>
                            <div
                                className={styles.bar}
                                style={{ height: `${(data.value / maxVal) * 100}%` }}
                                title={`$${data.value}`}
                            ></div>
                            <span className={styles.barLabel}>{data.month}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className={styles.card}>
                <h2 className={styles.subtitle}>Performance par Pays</h2>
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
                        <tr>
                            <td className={styles.td}>🇺🇸 USA</td>
                            <td className={styles.td}>850</td>
                            <td className={styles.td}>$58,200.00</td>
                            <td className={styles.td}>68%</td>
                        </tr>
                        <tr>
                            <td className={styles.td}>🇨🇦 Canada</td>
                            <td className={styles.td}>280</td>
                            <td className={styles.td}>$19,400.00</td>
                            <td className={styles.td}>23%</td>
                        </tr>
                        <tr>
                            <td className={styles.td}>🇲🇽 Mexique</td>
                            <td className={styles.td}>115</td>
                            <td className={styles.td}>$7,650.00</td>
                            <td className={styles.td}>9%</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
}
