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
        if (!userId) {
            alert('Erreur: Utilisateur non identifié');
            return;
        }

        setLoading(true);

        try {
            const response = await fetch('/api/admin/square-auth-url', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userId }),
            });

            const data = await response.json();

            if (!data.success || !data.url) {
                throw new Error(data.error || 'Impossible de générer l’URL Square');
            }

            // Stocker le state dans sessionStorage pour vérification lors du callback
            if (typeof window !== 'undefined' && data.state) {
                sessionStorage.setItem('square_oauth_state', data.state);
            }

            // Rediriger vers Square OAuth
            window.location.href = data.url;
        } catch (error) {
            console.error('Error initiating Square OAuth:', error);
            alert('Erreur lors de la connexion à Square. Veuillez réessayer.');
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleConnect}
            disabled={loading || !userId}
            className={styles.connectButton}
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
    );
}

