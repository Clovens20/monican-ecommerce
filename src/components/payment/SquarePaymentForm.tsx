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
                    tokenize: () => Promise<any>;
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
    const scriptLoadedRef = useRef(false);
    const initAttemptedRef = useRef(false);
    const containerReadyRef = useRef(false);

    // Fonction pour initialiser Square
    const initializeSquare = useCallback(async () => {
        console.log('[Square] Tentative d\'initialisation...');
        console.log('[Square] cardContainerRef.current:', cardContainerRef.current);
        console.log('[Square] initAttemptedRef.current:', initAttemptedRef.current);
        
        // Éviter les initialisations multiples
        if (initAttemptedRef.current) {
            console.log('[Square] Initialisation déjà tentée, abandon');
            return;
        }

        if (!cardContainerRef.current) {
            console.log('[Square] Conteneur pas encore prêt, réessai dans 200ms');
            setTimeout(() => initializeSquare(), 200);
            return;
        }

        initAttemptedRef.current = true;

        const applicationId = process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID;
        const locationId = process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID;
        const environment = process.env.NEXT_PUBLIC_SQUARE_ENVIRONMENT || 'sandbox';

        console.log('[Square] Configuration:', {
            hasApplicationId: !!applicationId,
            hasLocationId: !!locationId,
            environment,
            applicationIdPrefix: applicationId?.substring(0, 10) + '...',
        });

        if (!applicationId || !locationId) {
            const errorMsg = 'Configuration Square manquante. Veuillez configurer NEXT_PUBLIC_SQUARE_APPLICATION_ID et NEXT_PUBLIC_SQUARE_LOCATION_ID dans votre fichier .env.local';
            console.error('[Square]', errorMsg);
            onError(errorMsg);
            setIsLoading(false);
            return;
        }

        // Vérifier si le SDK est déjà chargé
        if (window.Square && cardContainerRef.current) {
            console.log('[Square] SDK déjà chargé, initialisation directe');
            try {
                const payments = window.Square.payments(applicationId, locationId);
                const card = await payments.card();
                await card.attach(cardContainerRef.current);
                setCardInstance(card);
                setIsReady(true);
                setIsLoading(false);
                console.log('[Square] Initialisation réussie (SDK déjà chargé)');
                return;
            } catch (error: any) {
                console.error('[Square] Erreur initialisation (SDK déjà chargé):', error);
                onError(error.message || 'Erreur lors de l\'initialisation du formulaire de paiement');
                setIsLoading(false);
                initAttemptedRef.current = false;
                return;
            }
        }

        // Si le SDK n'est pas chargé, le charger
        if (!scriptLoadedRef.current) {
            scriptLoadedRef.current = true;

            // Déterminer l'URL du SDK selon l'environnement
            const sdkUrl = environment === 'production'
                ? 'https://web.squarecdn.com/v1/square.js'
                : 'https://sandbox.web.squarecdn.com/v1/square.js';

            console.log('[Square] Chargement du SDK depuis:', sdkUrl);

            // Vérifier si le script existe déjà
            const existingScript = document.querySelector(`script[src="${sdkUrl}"]`);
            if (existingScript) {
                console.log('[Square] Script déjà présent, attente du SDK...');
                // Attendre que le SDK soit disponible
                let attempts = 0;
                const maxAttempts = 100; // 10 secondes max
                const checkSquare = setInterval(async () => {
                    attempts++;
                    if (window.Square && cardContainerRef.current) {
                        clearInterval(checkSquare);
                        console.log('[Square] SDK disponible après', attempts * 100, 'ms');
                        try {
                            const payments = window.Square.payments(applicationId, locationId);
                            const card = await payments.card();
                            await card.attach(cardContainerRef.current);
                            setCardInstance(card);
                            setIsReady(true);
                            setIsLoading(false);
                            console.log('[Square] Initialisation réussie (script existant)');
                        } catch (error: any) {
                            console.error('[Square] Erreur initialisation (script existant):', error);
                            onError(error.message || 'Erreur lors de l\'initialisation du formulaire de paiement');
                            setIsLoading(false);
                            initAttemptedRef.current = false;
                        }
                    } else if (attempts >= maxAttempts) {
                        clearInterval(checkSquare);
                        console.error('[Square] Timeout: SDK non disponible après 10 secondes');
                        onError('Timeout: Le SDK Square n\'a pas pu être chargé');
                        setIsLoading(false);
                        initAttemptedRef.current = false;
                    }
                }, 100);

                return;
            }

            // Charger le script Square Web Payments SDK
            const script = document.createElement('script');
            script.src = sdkUrl; // IMPORTANT: Définir src AVANT d'ajouter au DOM
            script.type = 'text/javascript';
            script.async = true;
            script.id = 'square-payment-sdk';

            script.onload = async () => {
                console.log('[Square] Script chargé avec succès');
                try {
                    // Attendre un peu pour que le SDK soit complètement initialisé
                    await new Promise(resolve => setTimeout(resolve, 200));

                    if (!window.Square) {
                        throw new Error('Square SDK non chargé après le chargement du script');
                    }

                    if (!cardContainerRef.current) {
                        throw new Error('Conteneur de carte non trouvé');
                    }

                    console.log('[Square] Initialisation du formulaire de carte...');
                    // Initialiser Square Payments
                    const payments = window.Square.payments(applicationId, locationId);
                    
                    // Créer l'instance de carte
                    const card = await payments.card();
                    
                    // Attacher le formulaire de carte au conteneur
                    await card.attach(cardContainerRef.current);
                    
                    setCardInstance(card);
                    setIsReady(true);
                    setIsLoading(false);
                    console.log('[Square] ✅ Formulaire de paiement initialisé avec succès');
                } catch (error: any) {
                    console.error('[Square] Erreur initialisation:', error);
                    onError(error.message || 'Erreur lors de l\'initialisation du formulaire de paiement');
                    setIsLoading(false);
                    initAttemptedRef.current = false; // Permettre de réessayer
                }
            };

            script.onerror = (error) => {
                console.error('[Square] Erreur chargement script:', error);
                onError('Impossible de charger le SDK Square. Vérifiez votre connexion internet et que les variables d\'environnement NEXT_PUBLIC_SQUARE_APPLICATION_ID et NEXT_PUBLIC_SQUARE_LOCATION_ID sont correctement configurées.');
                setIsLoading(false);
                scriptLoadedRef.current = false; // Permettre de réessayer
                initAttemptedRef.current = false;
            };

            document.head.appendChild(script);
            console.log('[Square] Script ajouté au DOM');
        }
    }, [onError]);

    // Callback ref qui se déclenche quand l'élément est monté dans le DOM
    const setCardContainerRef = useCallback((element: HTMLDivElement | null) => {
        if (element && !containerReadyRef.current) {
            cardContainerRef.current = element;
            containerReadyRef.current = true;
            console.log('[Square] Conteneur monté dans le DOM, initialisation...');
            // Attendre un peu pour s'assurer que l'élément est complètement rendu
            setTimeout(() => {
                if (cardContainerRef.current && !initAttemptedRef.current) {
                    initializeSquare();
                }
            }, 100);
        }
    }, [initializeSquare]);

    const handleSubmit = useCallback(async () => {
        if (!cardInstance || !isReady || isProcessing || disabled) {
            if (!isReady) {
                onError('Le formulaire de paiement n\'est pas encore prêt. Veuillez patienter.');
            }
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

    return (
        <div style={{ width: '100%' }}>
            {isLoading && (
                <div style={{ 
                    padding: '2rem', 
                    textAlign: 'center',
                    background: '#f9fafb',
                    borderRadius: '0.5rem',
                    border: '1px dashed #d1d5db',
                    marginBottom: '1rem'
                }}>
                    <div style={{ marginBottom: '1rem' }}>🔄</div>
                    <div style={{ fontSize: '0.9rem', color: '#6b7280' }}>
                        Chargement du formulaire de paiement sécurisé...
                    </div>
                </div>
            )}
            
            {/* Toujours rendre le conteneur, même pendant le chargement */}
            <div 
                ref={setCardContainerRef}
                id="square-card-container"
                style={{
                    width: '100%',
                    minHeight: '120px',
                    marginBottom: '1rem',
                    display: isLoading ? 'none' : 'block',
                }}
            />
            
            {!isReady && !isLoading && (
                <div style={{ 
                    padding: '1rem', 
                    background: '#fee2e2', 
                    borderRadius: '0.5rem',
                    color: '#991b1b',
                    fontSize: '0.9rem',
                    marginBottom: '1rem'
                }}>
                    ⚠️ Le formulaire de paiement n'est pas encore prêt. Veuillez patienter quelques instants.
                </div>
            )}
        </div>
    );
}

