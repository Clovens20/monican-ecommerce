'use client';

import { useState, useEffect } from 'react';
import { useCart } from '@/lib/cart';
import styles from './AbandonedCartPopup.module.css';

interface AbandonedCartPopupProps {
    onEmailCaptured?: (email: string) => void;
}

export default function AbandonedCartPopup({ onEmailCaptured }: AbandonedCartPopupProps) {
    const { items, total } = useCart();
    const [show, setShow] = useState(false);
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [dismissed, setDismissed] = useState(false);

    // Vérifier si le popup a déjà été fermé (localStorage)
    useEffect(() => {
        const dismissedAt = localStorage.getItem('abandoned_cart_popup_dismissed');
        if (dismissedAt) {
            const dismissedTime = parseInt(dismissedAt, 10);
            const now = Date.now();
            // Réafficher après 24h si fermé
            if (now - dismissedTime < 24 * 60 * 60 * 1000) {
                setDismissed(true);
            }
        }
    }, []);

    // Afficher le popup après 2 minutes si le panier n'est pas vide
    // Ne pas afficher si l'email a déjà été capturé
    useEffect(() => {
        if (dismissed || items.length === 0) return;
        
        // Vérifier si l'email a déjà été capturé
        const savedEmail = localStorage.getItem('customer_email');
        if (savedEmail && savedEmail.includes('@')) {
            return; // Ne pas afficher le popup si l'email est déjà capturé
        }

        const timer = setTimeout(() => {
            setShow(true);
        }, 2 * 60 * 1000); // 2 minutes

        return () => clearTimeout(timer);
    }, [items.length, dismissed]);

    const handleClose = () => {
        setShow(false);
        setDismissed(true);
        localStorage.setItem('abandoned_cart_popup_dismissed', Date.now().toString());
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (!email || !email.includes('@')) {
            setError('Veuillez entrer une adresse email valide');
            setLoading(false);
            return;
        }

        try {
            // Sauvegarder le panier abandonné
            const response = await fetch('/api/cart/abandoned', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email,
                    cartData: {
                        items,
                        total,
                        itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
                    },
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Erreur lors de la sauvegarde');
            }

            setSuccess(true);
            onEmailCaptured?.(email);
            
            // Sauvegarder l'email dans localStorage
            localStorage.setItem('customer_email', email);
            
            // Fermer le popup après 2 secondes
            setTimeout(() => {
                handleClose();
            }, 2000);
        } catch (err: any) {
            setError(err.message || 'Une erreur est survenue');
        } finally {
            setLoading(false);
        }
    };

    if (!show || items.length === 0) return null;

    return (
        <div className={styles.overlay} onClick={handleClose}>
            <div className={styles.popup} onClick={(e) => e.stopPropagation()}>
                <button className={styles.closeBtn} onClick={handleClose} aria-label="Fermer">
                    ×
                </button>

                {success ? (
                    <div className={styles.successContent}>
                        <div className={styles.successIcon}>✓</div>
                        <h3 className={styles.successTitle}>Merci !</h3>
                        <p className={styles.successMessage}>
                            Nous vous enverrons un rappel si vous oubliez votre panier.
                        </p>
                    </div>
                ) : (
                    <>
                        <div className={styles.iconContainer}>
                            <div className={styles.icon}>🛒</div>
                        </div>
                        
                        <h2 className={styles.title}>
                            Ne perdez pas vos articles !
                        </h2>
                        
                        <p className={styles.message}>
                            Vous avez <strong>{items.length}</strong> article{items.length > 1 ? 's' : ''} dans votre panier d'une valeur de{' '}
                            <strong className={styles.total}>
                                {new Intl.NumberFormat('fr-FR', {
                                    style: 'currency',
                                    currency: 'USD',
                                }).format(total)}
                            </strong>
                        </p>
                        
                        <p className={styles.submessage}>
                            Laissez-nous votre email et nous vous rappellerons si vous oubliez de finaliser votre commande.
                        </p>

                        <form onSubmit={handleSubmit} className={styles.form}>
                            <div className={styles.inputGroup}>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="votre@email.com"
                                    className={styles.input}
                                    required
                                    disabled={loading}
                                />
                            </div>

                            {error && (
                                <div className={styles.error}>{error}</div>
                            )}

                            <button
                                type="submit"
                                className={styles.submitBtn}
                                disabled={loading || !email}
                            >
                                {loading ? 'Envoi...' : 'Me rappeler'}
                            </button>
                        </form>

                        <button
                            className={styles.skipBtn}
                            onClick={handleClose}
                            disabled={loading}
                        >
                            Non merci, je continue
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}

