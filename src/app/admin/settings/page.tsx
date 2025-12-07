'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import SquareConnectButton from '@/components/admin/SquareConnectButton';
import styles from './page.module.css';

function SettingsPageContent() {
    const searchParams = useSearchParams();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [squareConnected, setSquareConnected] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        // Vérifier les paramètres d'URL pour les messages
        const success = searchParams.get('success');
        const error = searchParams.get('error');
        
        if (success === 'square_connected') {
            setMessage({ type: 'success', text: 'Votre compte Square a été connecté avec succès !' });
            setSquareConnected(true);
        } else if (error) {
            const errorMessages: Record<string, string> = {
                'missing_parameters': 'Paramètres manquants dans la réponse OAuth.',
                'invalid_state': 'État de sécurité invalide. Veuillez réessayer.',
                'server_config': 'Erreur de configuration serveur. Contactez le support.',
                'token_exchange_failed': 'Échec de l\'échange du token. Veuillez réessayer.',
                'no_token': 'Aucun token reçu de Square.',
                'database_error': 'Erreur lors de la sauvegarde. Veuillez réessayer.',
                'unexpected_error': 'Une erreur inattendue s\'est produite.',
            };
            setMessage({ 
                type: 'error', 
                text: errorMessages[error] || 'Une erreur s\'est produite lors de la connexion.' 
            });
        }

        async function loadUser() {
            try {
                console.log('🔍 Chargement de l\'utilisateur...');
                
                // Utiliser une route API pour récupérer l'utilisateur actuel
                const response = await fetch('/api/admin/me');
                console.log('📡 Réponse /api/admin/me:', {
                    status: response.status,
                    ok: response.ok
                });
                
                if (response.ok) {
                    const userData = await response.json();
                    console.log('👤 Utilisateur récupéré:', userData);
                    console.log('🆔 User ID:', userData?.id);
                    
                    setUser(userData);
                    
                    // Vérifier si Square est connecté
                    if (userData?.id) {
                        try {
                            const squareResponse = await fetch(`/api/admin/square-status?userId=${userData.id}`);
                            if (squareResponse.ok) {
                                const squareData = await squareResponse.json();
                                setSquareConnected(squareData.connected || false);
                            }
                        } catch (err) {
                            console.error('Error checking Square status:', err);
                        }
                    }
                } else {
                    console.warn('⚠️ Impossible de récupérer l\'utilisateur, status:', response.status);
                    const errorData = await response.json().catch(() => ({}));
                    console.warn('Erreur:', errorData);
                }
            } catch (error) {
                console.error('❌ Error loading user:', error);
            } finally {
                setLoading(false);
            }
        }
        loadUser();
    }, [searchParams]);

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
                            Connectez votre compte Square pour accepter les paiements
                        </p>
                    </div>

                    <div className={styles.sectionContent}>
                        {message && (
                            <div className={`${styles.message} ${styles[message.type]}`}>
                                {message.type === 'success' ? '✓' : '✗'} {message.text}
                            </div>
                        )}
                        <div className={styles.paymentCard}>
                            <div className={styles.paymentInfo}>
                                <div className={styles.paymentIcon}>💳</div>
                                <div className={styles.paymentDetails}>
                                    <h3 className={styles.paymentTitle}>Square Payment</h3>
                                    <p className={styles.paymentDescription}>
                                        {squareConnected 
                                            ? 'Votre compte Square est connecté et prêt à accepter les paiements.'
                                            : 'Connectez votre compte Square pour commencer à accepter les paiements en ligne.'}
                                    </p>
                                    {squareConnected && (
                                        <div className={styles.connectedBadge}>
                                            <span className={styles.badgeIcon}>✓</span>
                                            <span>Connecté</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            <div className={styles.paymentAction}>
                                <SquareConnectButton 
                                    userId={user?.id}
                                    onConnect={() => setSquareConnected(true)}
                                />
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
