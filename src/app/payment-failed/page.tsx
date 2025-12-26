'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { getContactInfo } from '@/lib/contact-info';
import styles from './page.module.css';

function PaymentFailedContent() {
    const searchParams = useSearchParams();
    const errorType = searchParams.get('error');
    const paymentIntentId = searchParams.get('payment_intent');

    const [errorMessage, setErrorMessage] = useState('Le paiement n\'a pas pu être finalisé');
    const [contactInfo, setContactInfo] = useState({ email: 'support@monican.shop', phone: '717-880-1479' });

    useEffect(() => {
        // Messages d'erreur personnalisés
        const errorMessages: Record<string, string> = {
            'card_declined': 'Carte refusée par votre banque',
            'insufficient_funds': 'Fonds insuffisants',
            'expired_card': 'Carte expirée',
            'incorrect_cvc': 'Code de sécurité incorrect',
            'processing_error': 'Erreur de traitement',
            'cancelled': 'Paiement annulé',
            'REQUIRES_ACTION': 'Paiement nécessite une authentification supplémentaire',
        };

        if (errorType && errorMessages[errorType]) {
            setErrorMessage(errorMessages[errorType]);
        }

        // Logger l'échec pour analytics (si disponible)
        if (typeof window !== 'undefined' && (window as any).gtag) {
            (window as any).gtag('event', 'payment_failed', {
                'error_type': errorType || 'unknown',
            });
        }

        // Charger les informations de contact
        getContactInfo('fr').then(info => {
            setContactInfo({ email: info.email, phone: info.phone });
        });
    }, [errorType]);

    return (
        <div className={styles.wrapper}>
            <div className={styles.container}>
                <div className={styles.errorIcon}>
                    <svg viewBox="0 0 52 52">
                        <line x1="16" y1="16" x2="36" y2="36" />
                        <line x1="36" y1="16" x2="16" y2="36" />
                    </svg>
                </div>

                <h1>Paiement Non Complété</h1>
                <p className={styles.errorCode}>{errorMessage}</p>

                <p className={styles.message}>
                    Votre transaction n'a pas abouti. Votre carte n'a pas été débitée et votre panier est toujours disponible.
                </p>

                <div className={styles.reasonsBox}>
                    <div className={styles.reasonsTitle}>Raisons possibles :</div>
                    <ul className={styles.reasonsList}>
                        <li>Fonds insuffisants sur votre carte</li>
                        <li>Informations de carte incorrectes</li>
                        <li>La transaction a été annulée</li>
                        <li>Votre banque a refusé la transaction</li>
                        <li>Limite de paiement dépassée</li>
                    </ul>
                </div>

                <div className={styles.helpBox}>
                    <h3>Que faire maintenant ?</h3>
                    <p>
                        Vérifiez vos informations de paiement et réessayez. Si le problème persiste,
                        contactez votre banque ou{' '}
                        <Link href="/contact" className={styles.helpLink}>
                            notre service client
                        </Link>{' '}
                        qui se fera un plaisir de vous aider.
                    </p>
                </div>

                <div className={styles.buttons}>
                    <Link href="/checkout" className={styles.btnPrimary}>
                        Réessayer le paiement
                    </Link>
                    <Link href="/catalog" className={styles.btnSecondary}>
                        Retour au catalogue
                    </Link>
                </div>

                <div className={styles.contactInfo}>
                    <p><strong>Besoin d'aide ?</strong></p>
                    <div className={styles.contactLinks}>
                        <a href={`mailto:${contactInfo.email}`}>📧 {contactInfo.email}</a>
                        <a href={`tel:${contactInfo.phone.replace(/\D/g, '')}`}>📞 {contactInfo.phone}</a>
                        <Link href="/contact">💬 Chat en direct</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function PaymentFailedPage() {
    return (
        <Suspense fallback={
            <div className={styles.wrapper}>
                <div className={styles.container}>
                    <div className={styles.loadingIcon}>⏳</div>
                    <p>Chargement...</p>
                </div>
            </div>
        }>
            <PaymentFailedContent />
        </Suspense>
    );
}

