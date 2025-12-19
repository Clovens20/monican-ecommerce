'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCountry } from '@/lib/country';
import Link from 'next/link';
import styles from './page.module.css';

interface Order {
    id: string;
    orderNumber: string;
    customerName: string;
    customerEmail: string;
    date: string;
    status: string;
    total: number;
    currency: string;
    paymentMethod?: string;
    paymentId?: string;
}

function OrderConfirmationContent() {
    const { t } = useLanguage();
    const { formatPrice } = useCountry();
    const searchParams = useSearchParams();
    const router = useRouter();
    const orderId = searchParams.get('orderId');
    const paymentIntentId = searchParams.get('payment_intent');

    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [paymentDetails, setPaymentDetails] = useState<{
        amount: number;
        currency: string;
        email: string;
    } | null>(null);

    useEffect(() => {
        // Si on a un payment_intent, récupérer les détails depuis l'API
        if (paymentIntentId) {
            fetch(`/api/payments/details?payment_intent=${paymentIntentId}`)
                .then(res => res.json())
                .then(data => {
                    if (data.amount) {
                        setPaymentDetails({
                            amount: data.amount / 100,
                            currency: data.currency.toUpperCase(),
                            email: data.email || '',
                        });
                    }
                })
                .catch(err => console.log('Could not load payment details'));
        }

        if (!orderId && !paymentIntentId) {
            setError('Numéro de commande manquant');
            setLoading(false);
            return;
        }

        async function fetchOrder() {
            try {
                if (orderId) {
                    const response = await fetch(`/api/orders/${orderId}`);
                    const data = await response.json();

                    if (response.ok && data.success && data.order) {
                        setOrder(data.order);
                    } else {
                        setError(data.error || 'Commande non trouvée');
                    }
                } else if (paymentIntentId) {
                    // Si on a seulement un payment_intent, créer un ordre temporaire
                    setOrder({
                        id: paymentIntentId.substring(3, 11).toUpperCase(),
                        orderNumber: paymentIntentId.substring(3, 11).toUpperCase(),
                        customerName: '',
                        customerEmail: paymentDetails?.email || '',
                        date: new Date().toISOString(),
                        status: 'confirmed',
                        total: paymentDetails?.amount || 0,
                        currency: paymentDetails?.currency || 'CAD',
                        paymentId: paymentIntentId,
                    });
                }
            } catch (err) {
                console.error('Error fetching order:', err);
                setError('Erreur lors du chargement de la commande');
            } finally {
                setLoading(false);
            }
        }

        fetchOrder();
    }, [orderId, paymentIntentId, paymentDetails]);

    if (loading) {
        return (
            <div className={styles.wrapper}>
                <div className={styles.container}>
                    <div className={styles.loadingIcon}>⏳</div>
                    <p className={styles.loadingText}>Chargement de votre commande...</p>
                </div>
            </div>
        );
    }

    if (error || !order) {
        return (
            <div className={styles.wrapper}>
                <div className={styles.container}>
                    <div className={styles.errorIcon}>❌</div>
                    <h1>Commande non trouvée</h1>
                    <p className={styles.message}>
                        {error || 'Impossible de charger les détails de la commande.'}
                    </p>
                    <Link href="/" className={styles.btnPrimary}>
                        Retour à l'accueil
                    </Link>
                </div>
            </div>
        );
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('fr-CA', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const displayAmount = paymentDetails?.amount || order.total;
    const displayCurrency = paymentDetails?.currency || order.currency;
    const displayEmail = paymentDetails?.email || order.customerEmail;

    return (
        <div className={styles.wrapper}>
            <div className={styles.container}>
                <div className={styles.successIcon}>
                    <svg viewBox="0 0 52 52">
                        <polyline points="14 27 22 35 38 17" />
                    </svg>
                </div>

                <h1>Paiement Réussi !</h1>
                <p className={styles.orderNumber}>
                    Commande #{order.orderNumber || order.id}
                </p>

                <p className={styles.message}>
                    Merci pour votre achat ! Votre commande a été confirmée et sera traitée sous peu.
                </p>

                <div className={styles.infoBox}>
                    <div className={styles.infoItem}>
                        <span className={styles.infoLabel}>Montant payé</span>
                        <span className={styles.infoValue}>
                            {formatPrice(displayAmount)} {displayCurrency}
                        </span>
                    </div>
                    <div className={styles.infoItem}>
                        <span className={styles.infoLabel}>Méthode de paiement</span>
                        <span className={styles.infoValue}>
                            {order.paymentMethod || 'Carte de crédit'}
                        </span>
                    </div>
                    <div className={styles.infoItem}>
                        <span className={styles.infoLabel}>Date</span>
                        <span className={styles.infoValue}>{formatDate(order.date)}</span>
                    </div>
                    <div className={styles.infoItem}>
                        <span className={styles.infoLabel}>Statut</span>
                        <span className={styles.infoValue} style={{ color: '#48bb78' }}>
                            ✓ Confirmé
                        </span>
                    </div>
                </div>

                <div className={styles.buttons}>
                    <Link href="/catalog" className={styles.btnPrimary}>
                        Continuer mes achats
                    </Link>
                    <Link href={`/track-order?orderId=${order.id}`} className={styles.btnSecondary}>
                        Suivre ma commande
                    </Link>
                </div>

                <div className={styles.emailNotice}>
                    📧 Un email de confirmation a été envoyé à{' '}
                    <strong>{displayEmail || 'votre adresse'}</strong>
                </div>
            </div>
        </div>
    );
}

export default function OrderConfirmationPage() {
    return (
        <Suspense fallback={
            <div className={styles.wrapper}>
                <div className={styles.container}>
                    <div className={styles.loadingIcon}>⏳</div>
                    <p className={styles.loadingText}>Chargement...</p>
                </div>
            </div>
        }>
            <OrderConfirmationContent />
        </Suspense>
    );
}
