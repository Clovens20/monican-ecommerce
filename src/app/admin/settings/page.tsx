'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import SquareConnectButton from '@/components/admin/SquareConnectButton';
import styles from './page.module.css';

interface SquareStatus {
    connected: boolean;
    merchantId: string | null;
    connectedAt: string | null;
}

function SettingsPageContent() {
    const searchParams = useSearchParams();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [squareStatus, setSquareStatus] = useState<SquareStatus>({
        connected: false,
        merchantId: null,
        connectedAt: null,
    });
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [checkingStatus, setCheckingStatus] = useState(false);

    // Fonction pour vérifier le statut Square
    const checkSquareStatus = async (userId: string) => {
        try {
            setCheckingStatus(true);
            const squareResponse = await fetch(`/api/admin/square-status?userId=${userId}`);
            const squareData = await squareResponse.json();
            
            if (squareResponse.ok) {
                setSquareStatus({
                    connected: squareData.connected || false,
                    merchantId: squareData.merchantId || null,
                    connectedAt: squareData.connectedAt || null,
                });
            } else {
                console.error('❌ Erreur lors de la vérification du statut Square:', squareData);
            }
        } catch (err) {
            console.error('❌ Error checking Square status:', err);
        } finally {
            setCheckingStatus(false);
        }
    };

    useEffect(() => {
        // Vérifier les paramètres d'URL pour les messages
        const success = searchParams.get('success');
        const error = searchParams.get('error');
        
        if (success === 'square_connected') {
            setMessage({ type: 'success', text: 'Votre compte Square a été connecté avec succès !' });
            // Nettoyer l'URL après affichage du message
            window.history.replaceState({}, '', '/admin/settings');
            // Recharger le statut après connexion réussie
            if (user?.id) {
                setTimeout(() => checkSquareStatus(user.id), 1000);
            }
        } else if (error) {
            const errorMessages: Record<string, string> = {
                'missing_parameters': 'Paramètres manquants dans la réponse OAuth.',
                'invalid_state': 'État de sécurité invalide. Veuillez réessayer.',
                'server_config': 'Erreur de configuration serveur. Vérifiez que SQUARE_CLIENT_ID et SQUARE_CLIENT_SECRET sont configurés.',
                'token_exchange_failed': 'Échec de l\'échange du token. Veuillez réessayer.',
                'no_token': 'Aucun token reçu de Square.',
                'database_error': 'Erreur lors de la sauvegarde. Les colonnes Square ne sont peut-être pas créées dans la base de données.',
                'unexpected_error': 'Une erreur inattendue s\'est produite.',
            };
            setMessage({ 
                type: 'error', 
                text: errorMessages[error] || 'Une erreur s\'est produite lors de la connexion.' 
            });
            // Nettoyer l'URL après affichage du message
            window.history.replaceState({}, '', '/admin/settings');
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
                        await checkSquareStatus(userData.id);
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

    // Formater la date de connexion
    const formatDate = (dateString: string | null) => {
        if (!dateString) return null;
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('fr-FR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return dateString;
        }
    };

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
                        {/* Afficher les messages uniquement s'ils existent */}
                        {message && (
                            <div className={`${styles.message} ${styles[message.type]}`}>
                                {message.type === 'success' ? '✓' : '✗'} {message.text}
                            </div>
                        )}

                        <div className={styles.paymentCard}>
                            <div className={styles.paymentInfo}>
                                <div className={styles.paymentIcon}>💳</div>
                                <div className={styles.paymentDetails}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                                        <h3 className={styles.paymentTitle}>Square Payment</h3>
                                        {squareStatus.connected && (
                                            <div className={styles.connectedBadge}>
                                                <span className={styles.badgeIcon}>✓</span>
                                                <span>Connecté</span>
                                            </div>
                                        )}
                                        {!squareStatus.connected && (
                                            <div className={styles.disconnectedBadge}>
                                                <span className={styles.badgeIcon}>✗</span>
                                                <span>Non connecté</span>
                                            </div>
                                        )}
                                    </div>
                                    
                                    <p className={styles.paymentDescription}>
                                        {squareStatus.connected 
                                            ? 'Votre compte Square est connecté et prêt à accepter les paiements.'
                                            : 'Connectez votre compte Square pour commencer à accepter les paiements en ligne.'}
                                    </p>

                                    {/* Afficher les détails de connexion si connecté */}
                                    {squareStatus.connected && (
                                        <div className={styles.connectionDetails}>
                                            <div className={styles.detailItem}>
                                                <span className={styles.detailLabel}>Merchant ID:</span>
                                                <span className={styles.detailValue}>
                                                    {squareStatus.merchantId || 'Non disponible'}
                                                </span>
                                            </div>
                                            {squareStatus.connectedAt && (
                                                <div className={styles.detailItem}>
                                                    <span className={styles.detailLabel}>Connecté le:</span>
                                                    <span className={styles.detailValue}>
                                                        {formatDate(squareStatus.connectedAt)}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            <div className={styles.paymentAction}>
                                {squareStatus.connected ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end' }}>
                                        <button
                                            onClick={() => user?.id && checkSquareStatus(user.id)}
                                            disabled={checkingStatus}
                                            className={styles.refreshButton}
                                            title="Vérifier le statut de connexion"
                                        >
                                            {checkingStatus ? '⏳ Vérification...' : '🔄 Vérifier le statut'}
                                        </button>
                                        <div style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: 500 }}>
                                            ✓ Connexion active
                                        </div>
                                    </div>
                                ) : (
                                    <SquareConnectButton 
                                        userId={user?.id}
                                        onConnect={() => {
                                            if (user?.id) {
                                                setTimeout(() => checkSquareStatus(user.id), 2000);
                                            }
                                        }}
                                    />
                                )}
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
