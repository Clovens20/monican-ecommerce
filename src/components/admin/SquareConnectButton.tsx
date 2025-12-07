'use client';

import { useState } from 'react';
import styles from './SquareConnectButton.module.css';

interface SquareConnectButtonProps {
    userId: string | undefined;
    onConnect?: () => void;
}

export default function SquareConnectButton({ userId, onConnect }: SquareConnectButtonProps) {
    const [loading, setLoading] = useState(false);

    const handleConnect = async () => {
        console.log('🔵 Bouton Square cliqué, userId:', userId);
        
        if (!userId) {
            console.error('❌ userId est undefined');
            alert('Erreur: Utilisateur non identifié. Veuillez vous reconnecter.');
            return;
        }

        setLoading(true);
        console.log('🔄 Début de la requête vers /api/admin/square-auth-url');

        try {
            const response = await fetch('/api/admin/square-auth-url', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId }),
            });

            console.log('📡 Réponse reçue:', {
                status: response.status,
                statusText: response.statusText,
                ok: response.ok
            });

            // Vérifier que la réponse est OK
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Erreur inconnue' }));
                console.error('❌ Erreur HTTP:', errorData);
                throw new Error(errorData.error || `Erreur HTTP: ${response.status}`);
            }

            const data = await response.json();
            console.log('✅ Données reçues:', { 
                success: data.success, 
                hasUrl: !!data.url,
                urlPreview: data.url ? data.url.substring(0, 100) + '...' : 'pas d\'URL'
            });

            if (!data.success || !data.url) {
                console.error('❌ Données invalides:', data);
                throw new Error(data.error || 'Impossible de générer l\'URL Square');
            }

            if (typeof window !== 'undefined' && data.state) {
                sessionStorage.setItem('square_oauth_state', data.state);
                console.log('💾 State sauvegardé dans sessionStorage');
            }

            console.log('🚀 Redirection vers Square OAuth...');
            window.location.href = data.url;
        } catch (error) {
            console.error('❌ Error initiating Square OAuth:', error);
            alert(`Erreur lors de la connexion à Square: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
            setLoading(false);
        }
    };

    // Permettre le clic même si userId est undefined pour afficher l'erreur
    const isDisabled = loading;
    const hasUserId = !!userId;

    return (
        <div style={{ position: 'relative' }}>
            <button
                onClick={handleConnect}
                disabled={isDisabled}
                className={styles.connectButton}
                style={{ 
                    opacity: isDisabled ? 0.6 : 1,
                    cursor: isDisabled ? 'not-allowed' : 'pointer',
                    position: 'relative',
                    zIndex: 1
                }}
            >
                {loading ? (
                    <>
                        <span className={styles.spinner}></span>
                        <span>Connexion...</span>
                    </>
                ) : (
                    <>
                        <span className={styles.buttonIcon}>💳</span>
                        <span>Connecter mon compte Square</span>
                    </>
                )}
            </button>
            
            {/* Avertissement si userId manquant */}
            {!hasUserId && !loading && (
                <div style={{
                    marginTop: '8px',
                    padding: '8px',
                    backgroundColor: '#fff3cd',
                    border: '1px solid #ffc107',
                    borderRadius: '4px',
                    fontSize: '12px',
                    color: '#856404',
                    textAlign: 'center'
                }}>
                    ⚠️ Vous devez être connecté pour utiliser cette fonctionnalité
                </div>
            )}
        </div>
    );
}