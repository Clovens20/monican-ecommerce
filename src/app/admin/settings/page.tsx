'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import styles from './page.module.css';

function SettingsPageContent() {
    const searchParams = useSearchParams();
    const [loading, setLoading] = useState(true);
    const [squareConfigured, setSquareConfigured] = useState(false);

    useEffect(() => {
        async function checkSquareConfig() {
            try {
                // Vérifier si Square est configuré via l'API
                const response = await fetch('/api/admin/square-config-status');
                if (response.ok) {
                    const data = await response.json();
                    setSquareConfigured(data.configured || false);
                }
            } catch (error) {
                console.error('❌ Error checking Square config:', error);
            } finally {
                setLoading(false);
            }
        }
        checkSquareConfig();
    }, []);

    if (loading) {
        return (
            <div className={styles.container}>
                <div className={styles.loading}>Chargement...</div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Paramètres</h1>
                <p className={styles.subtitle}>Gérez les paramètres de votre application</p>
            </div>

            <div className={styles.content}>
                {/* Section Paiements */}
                <section className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <h2 className={styles.sectionTitle}>Paiements</h2>
                        <p className={styles.sectionDescription}>
                            Configuration Square pour accepter les paiements
                        </p>
                    </div>

                    <div className={styles.sectionContent}>
                        <div className={styles.paymentCard}>
                            <div className={styles.paymentInfo}>
                                <div className={styles.paymentIcon}>💳</div>
                                <div className={styles.paymentDetails}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                                        <h3 className={styles.paymentTitle}>Square Payment</h3>
                                        {squareConfigured ? (
                                            <div className={styles.connectedBadge}>
                                                <span className={styles.badgeIcon}>✓</span>
                                                <span>Configuré</span>
                                            </div>
                                        ) : (
                                            <div className={styles.disconnectedBadge}>
                                                <span className={styles.badgeIcon}>✗</span>
                                                <span>Non configuré</span>
                                            </div>
                                        )}
                                    </div>
                                    
                                    <p className={styles.paymentDescription}>
                                        {squareConfigured 
                                            ? 'Square est configuré via les variables d\'environnement et prêt à accepter les paiements.'
                                            : 'Configurez Square en ajoutant SQUARE_ACCESS_TOKEN et SQUARE_LOCATION_ID dans votre fichier .env'}
                                    </p>

                                    {squareConfigured && (
                                        <div className={styles.connectionDetails}>
                                            <div className={styles.detailItem}>
                                                <span className={styles.detailLabel}>Configuration:</span>
                                                <span className={styles.detailValue}>
                                                    Variables d'environnement (.env)
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Autres sections peuvent être ajoutées ici */}
            </div>
        </div>
    );
}

export default function SettingsPage() {
    return (
        <Suspense fallback={<div className={styles.container}><div className={styles.loading}>Chargement...</div></div>}>
            <SettingsPageContent />
        </Suspense>
    );
}
