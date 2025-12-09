'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface SquarePaymentFormProps {
    onTokenReceived: (token: string) => void;
    onError: (error: string) => void;
    amount: number;
    currency: 'USD' | 'CAD' | 'MXN';
    disabled?: boolean;
}

declare global {
    interface Window {
        Square?: {
            payments: (applicationId: string, locationId: string) => {
                card: () => {
                    attach: (element: HTMLElement) => Promise<any>;
                };
            };
        };
    }
}

export default function SquarePaymentForm({
    onTokenReceived,
    onError,
    amount,
    currency,
    disabled = false,
}: SquarePaymentFormProps) {
    const cardContainerRef = useRef<HTMLDivElement>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isReady, setIsReady] = useState(false);
    const [cardInstance, setCardInstance] = useState<any>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        const applicationId = process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID;
        const locationId = process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID;
        const environment = process.env.NEXT_PUBLIC_SQUARE_ENVIRONMENT || 'sandbox';

        if (!applicationId || !locationId) {
            onError('Configuration Square manquante. Veuillez configurer NEXT_PUBLIC_SQUARE_APPLICATION_ID et NEXT_PUBLIC_SQUARE_LOCATION_ID.');
            setIsLoading(false);
            return;
        }

        // Déterminer l'URL du SDK selon l'environnement
        const sdkUrl = environment === 'production'
            ? 'https://web.squarecdn.com/v1/square.js'
            : 'https://sandbox.web.squarecdn.com/v1/square.js';

        // Charger le script Square Web Payments SDK
        const script = document.createElement('script');
        script.src = sdkUrl;
        script.type = 'text/javascript';
        script.async = true;

        script.onload = async () => {
            try {
                if (!window.Square) {
                    throw new Error('Square SDK non chargé');
                }

                if (!cardContainerRef.current) {
                    throw new Error('Conteneur de carte non trouvé');
                }

                // Initialiser Square Payments
                const payments = window.Square.payments(applicationId, locationId);
                
                // Créer l'instance de carte
                const card = await payments.card();
                
                // Attacher le formulaire de carte au conteneur
                await card.attach(cardContainerRef.current);
                
                setCardInstance(card);
                setIsReady(true);
                setIsLoading(false);
            } catch (error: any) {
                console.error('Erreur initialisation Square:', error);
                onError(error.message || 'Erreur lors de l\'initialisation du formulaire de paiement');
                setIsLoading(false);
            }
        };

        script.onerror = () => {
            onError('Impossible de charger le SDK Square. Vérifiez votre connexion internet.');
            setIsLoading(false);
        };

        document.body.appendChild(script);

        return () => {
            // Nettoyer le script si le composant est démonté
            if (document.body.contains(script)) {
                document.body.removeChild(script);
            }
        };
    }, [onError]);

    const handleSubmit = useCallback(async () => {
        if (!cardInstance || !isReady || isProcessing || disabled) {
            return;
        }

        setIsProcessing(true);

        try {
            // Tokeniser la carte
            const tokenResult = await cardInstance.tokenize();
            
            if (tokenResult.status === 'OK') {
                onTokenReceived(tokenResult.token);
            } else {
                let errorMessage = 'Erreur lors du traitement de la carte';
                
                if (tokenResult.errors && tokenResult.errors.length > 0) {
                    errorMessage = tokenResult.errors[0].message || errorMessage;
                }
                
                onError(errorMessage);
                setIsProcessing(false);
            }
        } catch (error: any) {
            console.error('Erreur tokenisation:', error);
            onError(error.message || 'Erreur lors du traitement de la carte');
            setIsProcessing(false);
        }
    }, [cardInstance, isReady, isProcessing, disabled, onTokenReceived, onError]);

    // Exposer la fonction handleSubmit via un effet pour qu'elle soit accessible depuis le parent
    useEffect(() => {
        if (typeof window !== 'undefined') {
            (window as any).__squarePaymentFormSubmit = handleSubmit;
        }
        return () => {
            if (typeof window !== 'undefined') {
                delete (window as any).__squarePaymentFormSubmit;
            }
        };
    }, [handleSubmit]);

    if (isLoading) {
        return (
            <div style={{ 
                padding: '2rem', 
                textAlign: 'center',
                background: '#f9fafb',
                borderRadius: '0.5rem',
                border: '1px dashed #d1d5db'
            }}>
                <div style={{ marginBottom: '1rem' }}>🔄</div>
                <div style={{ fontSize: '0.9rem', color: '#6b7280' }}>
                    Chargement du formulaire de paiement sécurisé...
                </div>
            </div>
        );
    }

    return (
        <div style={{ width: '100%' }}>
            <div 
                ref={cardContainerRef}
                id="square-card-container"
                style={{
                    width: '100%',
                    minHeight: '120px',
                    marginBottom: '1rem',
                }}
            />
            {!isReady && (
                <div style={{ 
                    padding: '1rem', 
                    background: '#fee2e2', 
                    borderRadius: '0.5rem',
                    color: '#991b1b',
                    fontSize: '0.9rem',
                    marginBottom: '1rem'
                }}>
                    ⚠️ Le formulaire de paiement n'est pas encore prêt
                </div>
            )}
        </div>
    );
}

