'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCart } from '@/lib/cart';
import styles from './recover.module.css';

interface CartData {
    items: Array<{
        productId: string;
        name: string;
        quantity: number;
        price: number;
        size?: string;
    }>;
    total: number;
    currency: string;
}

function RecoverCartContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { clearCart } = useCart();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [cartData, setCartData] = useState<CartData | null>(null);

    // ✅ CORRECTION: Gérer le chargement de manière asynchrone avec mounted flag
    useEffect(() => {
        let mounted = true;
        
        const recoverCart = async () => {
            const token = searchParams.get('token');
            
            if (!token) {
                if (mounted) {
                    setError('Token manquant');
                    setLoading(false);
                }
                return;
            }

            try {
                const res = await fetch(`/api/cart/abandoned/recover?token=${token}`);
                const data = await res.json();
                
                if (!res.ok) {
                    throw new Error(data.error || 'Erreur lors de la récupération');
                }
                
                if (mounted) {
                    setCartData(data.cartData);
                    setLoading(false);
                }
            } catch (err) {
                if (mounted) {
                    setError(err instanceof Error ? err.message : 'Erreur inconnue');
                    setLoading(false);
                }
            }
        };
        
        recoverCart();
        
        return () => {
            mounted = false;
        };
    }, [searchParams]);

    const handleRecoverCart = () => {
        if (!cartData || !cartData.items) return;

        // Vider le panier actuel
        clearCart();

        // Marquer le panier comme récupéré
        const token = searchParams.get('token');
        if (token) {
            fetch(`/api/cart/abandoned/recover`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token }),
            });
        }

        // Rediriger vers le panier
        router.push('/cart');
    };

    if (loading) {
        return (
            <div className={styles.container}>
                <div className={styles.loading}>
                    <div className={styles.spinner}></div>
                    <p>Chargement de votre panier...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.container}>
                <div className={styles.error}>
                    <div className={styles.errorIcon}>⚠️</div>
                    <h1 className={styles.title}>Panier introuvable</h1>
                    <p>{error}</p>
                    <p className={styles.errorSubtext}>
                        Ce panier a peut-être expiré ou a déjà été récupéré.
                    </p>
                    <button
                        className={styles.button}
                        onClick={() => router.push('/catalog')}
                    >
                        Continuer mes achats
                    </button>
                </div>
            </div>
        );
    }

    if (!cartData) {
        return null;
    }

    const itemCount = cartData.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;

    return (
        <div className={styles.container}>
            <div className={styles.success}>
                <div className={styles.successIcon}>✓</div>
                <h1 className={styles.title}>Panier récupéré avec succès !</h1>
                <p className={styles.message}>
                    Vous avez <strong>{itemCount}</strong> article{itemCount > 1 ? 's' : ''} dans votre panier
                    {" d'une valeur de "}
                    <strong className={styles.total}>
                        {new Intl.NumberFormat('fr-FR', {
                            style: 'currency',
                            currency: cartData.currency || 'USD',
                        }).format(cartData.total || 0)}
                    </strong>
                </p>
                <div className={styles.actions}>
                    <button
                        className={styles.buttonPrimary}
                        onClick={handleRecoverCart}
                    >
                        Voir mon panier
                    </button>
                    <button
                        className={styles.buttonSecondary}
                        onClick={() => router.push('/catalog')}
                    >
                        Continuer mes achats
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function RecoverCartPage() {
    return (
        <Suspense fallback={
            <div className={styles.container}>
                <div className={styles.loading}>
                    <div className={styles.spinner}></div>
                    <p>Chargement...</p>
                </div>
            </div>
        }>
            <RecoverCartContent />
        </Suspense>
    );
}