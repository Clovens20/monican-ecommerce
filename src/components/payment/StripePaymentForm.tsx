'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { loadStripe, StripeElementsOptions } from '@stripe/stripe-js';
import {
    Elements,
    PaymentElement,
    useStripe,
    useElements
} from '@stripe/react-stripe-js';

interface StripePaymentFormProps {
    onTokenReceived: (paymentIntentId: string) => void;
    onError: (error: string) => void;
    amount: number; // En centimes
    currency: 'USD' | 'CAD' | 'MXN';
    disabled?: boolean;
}

// Charger Stripe avec la clé publique
const stripePromise = loadStripe(
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''
);

// Composant interne pour le formulaire de carte
function PaymentForm({
    onTokenReceived,
    onError,
    amount,
    currency,
    disabled = false,
}: Omit<StripePaymentFormProps, 'onTokenReceived' | 'onError' | 'amount' | 'currency' | 'disabled'> & {
    onTokenReceived: (paymentIntentId: string) => void;
    onError: (error: string) => void;
    amount: number;
    currency: 'USD' | 'CAD' | 'MXN';
    disabled: boolean;
}) {
    const stripe = useStripe();
    const elements = useElements();
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = useCallback(async () => {
        if (!stripe || !elements || isProcessing || disabled) {
            if (!stripe || !elements) {
                onError('Le formulaire de paiement n\'est pas encore prêt. Veuillez patienter.');
            }
            return;
        }

        const paymentElement = elements.getElement(PaymentElement);
        if (!paymentElement) {
            onError('Élément de paiement non trouvé');
            return;
        }

        setIsProcessing(true);
        setError(null);

        try {
            // Créer un PaymentIntent côté serveur
            const response = await fetch('/api/payments/create-intent', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    amount,
                    currency: currency.toLowerCase(),
                }),
            });

            const { clientSecret, error: apiError } = await response.json();

            if (apiError || !clientSecret) {
                throw new Error(apiError || 'Erreur lors de la création du PaymentIntent');
            }

            // Confirmer le paiement
            const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
                elements,
                clientSecret,
                confirmParams: {
                    return_url: `${window.location.origin}/order-confirmation`,
                },
                redirect: 'if_required',
            });

            if (confirmError) {
                throw new Error(confirmError.message || 'Erreur lors de la confirmation du paiement');
            }

            if (paymentIntent && paymentIntent.status === 'succeeded') {
                onTokenReceived(paymentIntent.id);
            } else if (paymentIntent && paymentIntent.status === 'requires_action') {
                // Le paiement nécessite une action (ex: 3D Secure)
                // Stripe gère automatiquement la redirection
                onError('Paiement nécessite une authentification supplémentaire. Veuillez suivre les instructions.');
            } else {
                throw new Error(`Statut de paiement inattendu: ${paymentIntent?.status}`);
            }
        } catch (error: any) {
            console.error('❌ [STRIPE] Erreur paiement:', error);
            const errorMessage = error.message || 'Une erreur est survenue lors du traitement de la carte';
            setError(errorMessage);
            onError(errorMessage);
            
            // Rediriger vers la page d'échec si c'est une erreur critique
            if (error.code || errorMessage.includes('refusé') || errorMessage.includes('décliné')) {
                const errorCode = error.code || 'processing_error';
                if (typeof window !== 'undefined') {
                    window.location.href = `/payment-failed?error=${encodeURIComponent(errorCode)}`;
                }
            }
        } finally {
            setIsProcessing(false);
        }
    }, [stripe, elements, amount, currency, disabled, isProcessing, onTokenReceived, onError]);

    // Exposer la fonction handleSubmit via window pour l'appeler depuis le parent
    useEffect(() => {
        if (typeof window !== 'undefined') {
            (window as any).__stripePaymentFormSubmit = handleSubmit;
        }
        return () => {
            if (typeof window !== 'undefined') {
                delete (window as any).__stripePaymentFormSubmit;
            }
        };
    }, [handleSubmit]);

    return (
        <div style={{ width: '100%' }}>
            <div style={{ marginBottom: '1rem' }}>
                <PaymentElement />
            </div>
            {error && (
                <div style={{
                    padding: '0.75rem',
                    background: '#fee2e2',
                    borderRadius: '0.5rem',
                    color: '#991b1b',
                    fontSize: '0.9rem',
                    marginBottom: '1rem'
                }}>
                    ⚠️ {error}
                </div>
            )}
            {isProcessing && (
                <div style={{
                    padding: '0.75rem',
                    background: '#dbeafe',
                    borderRadius: '0.5rem',
                    color: '#1e40af',
                    fontSize: '0.9rem',
                    marginBottom: '1rem',
                    textAlign: 'center'
                }}>
                    🔄 Traitement du paiement...
                </div>
            )}
        </div>
    );
}

// Composant principal
export default function StripePaymentForm({
    onTokenReceived,
    onError,
    amount,
    currency,
    disabled = false,
}: StripePaymentFormProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [stripeError, setStripeError] = useState<string | null>(null);

    useEffect(() => {
        const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
        if (!publishableKey) {
            setStripeError('Configuration Stripe manquante (NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)');
            setIsLoading(false);
            return;
        }

        stripePromise.then(() => {
            setIsLoading(false);
        }).catch((error) => {
            console.error('❌ [STRIPE] Erreur chargement SDK:', error);
            setStripeError('Impossible de charger le SDK Stripe');
            setIsLoading(false);
        });
    }, []);

    if (isLoading) {
        return (
            <div style={{
                padding: '2rem',
                textAlign: 'center',
                background: '#f9fafb',
                borderRadius: '0.5rem',
                border: '1px dashed #d1d5db',
                marginBottom: '1rem'
            }}>
                <div style={{ marginBottom: '1rem', fontSize: '2rem' }}>🔄</div>
                <div style={{ fontSize: '0.9rem', color: '#6b7280' }}>
                    Chargement du formulaire de paiement sécurisé...
                </div>
            </div>
        );
    }

    if (stripeError) {
        return (
            <div style={{
                padding: '1rem',
                background: '#fee2e2',
                borderRadius: '0.5rem',
                color: '#991b1b',
                fontSize: '0.9rem',
                marginBottom: '1rem'
            }}>
                ⚠️ {stripeError}
            </div>
        );
    }

    const options: StripeElementsOptions = {
        appearance: {
            theme: 'stripe',
        },
    };

    return (
        <Elements stripe={stripePromise} options={options}>
            <PaymentForm
                onTokenReceived={onTokenReceived}
                onError={onError}
                amount={amount}
                currency={currency}
                disabled={disabled}
            />
        </Elements>
    );
}

