'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface SquarePaymentFormProps {
    onTokenReceived: (token: string) => void;
    onError: (error: string) => void;
    amount: number; // En centimes
    currency: 'USD' | 'CAD' | 'MXN';
    disabled?: boolean;
}

declare global {
    interface Window {
        Square?: {
            payments: (applicationId: string, locationId: string) => {
                card: () => Promise<any>;
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
        console.log('🔧 [Square] Tentative d\'initialisation...');
        
        // Éviter les initialisations multiples
        if (initAttemptedRef.current) {
            console.log('⚠️ [Square] Initialisation déjà tentée, abandon');
            return;
        }

        if (!cardContainerRef.current) {
            console.log('⏳ [Square] Conteneur pas encore prêt, réessai dans 200ms');
            setTimeout(() => initializeSquare(), 200);
            return;
        }

        initAttemptedRef.current = true;

        // ✅ Récupérer la configuration depuis les variables d'environnement
        const applicationId = process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID;
        const locationId = process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID;
        const environment = process.env.NEXT_PUBLIC_SQUARE_ENVIRONMENT || 'sandbox';

        console.log('🔍 [Square] Configuration:', {
            hasApplicationId: !!applicationId,
            hasLocationId: !!locationId,
            environment,
            applicationIdPrefix: applicationId?.substring(0, 15) + '...',
            locationIdPrefix: locationId?.substring(0, 10) + '...',
        });

        // Validation de la configuration
        if (!applicationId || !locationId) {
            const errorMsg = '❌ Configuration Square manquante.\n\n' +
                            'Veuillez ajouter dans votre fichier .env.local:\n' +
                            'NEXT_PUBLIC_SQUARE_APPLICATION_ID=...\n' +
                            'NEXT_PUBLIC_SQUARE_LOCATION_ID=...\n' +
                            'NEXT_PUBLIC_SQUARE_ENVIRONMENT=sandbox';
            console.error('[Square]', errorMsg);
            onError(errorMsg);
            setIsLoading(false);
            return;
        }

        // Vérifier si le SDK est déjà chargé
        if (window.Square && cardContainerRef.current) {
            console.log('✅ [Square] SDK déjà chargé, initialisation directe');
            try {
                const payments = window.Square.payments(applicationId, locationId);
                const card = await payments.card();
                await card.attach(cardContainerRef.current);
                setCardInstance(card);
                setIsReady(true);
                setIsLoading(false);
                console.log('✅ [Square] Formulaire de carte initialisé avec succès');
                return;
            } catch (error: any) {
                console.error('❌ [Square] Erreur initialisation:', error);
                onError(`Erreur d'initialisation: ${error.message}`);
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

            console.log('📥 [Square] Chargement du SDK depuis:', sdkUrl);

            // Vérifier si le script existe déjà
            const existingScript = document.querySelector(`script[src="${sdkUrl}"]`);
            if (existingScript) {
                console.log('⚠️ [Square] Script déjà présent, attente du SDK...');
                
                // Attendre que le SDK soit disponible
                let attempts = 0;
                const maxAttempts = 100; // 10 secondes max
                const checkSquare = setInterval(async () => {
                    attempts++;
                    if (window.Square && cardContainerRef.current) {
                        clearInterval(checkSquare);
                        console.log(`✅ [Square] SDK disponible après ${attempts * 100}ms`);
                        try {
                            const payments = window.Square.payments(applicationId, locationId);
                            const card = await payments.card();
                            await card.attach(cardContainerRef.current);
                            setCardInstance(card);
                            setIsReady(true);
                            setIsLoading(false);
                            console.log('✅ [Square] Formulaire initialisé (script existant)');
                        } catch (error: any) {
                            console.error('❌ [Square] Erreur initialisation:', error);
                            onError(`Erreur: ${error.message}`);
                            setIsLoading(false);
                            initAttemptedRef.current = false;
                        }
                    } else if (attempts >= maxAttempts) {
                        clearInterval(checkSquare);
                        console.error('❌ [Square] Timeout: SDK non disponible après 10s');
                        onError('Le SDK Square n\'a pas pu être chargé. Veuillez rafraîchir la page.');
                        setIsLoading(false);
                        initAttemptedRef.current = false;
                    }
                }, 100);

                return;
            }

            // Charger le script Square Web Payments SDK
            const script = document.createElement('script');
            script.src = sdkUrl;
            script.type = 'text/javascript';
            script.async = true;
            script.id = 'square-payment-sdk';

            script.onload = async () => {
                console.log('✅ [Square] Script chargé avec succès');
                try {
                    // Attendre un peu pour que le SDK soit complètement initialisé
                    await new Promise(resolve => setTimeout(resolve, 200));

                    if (!window.Square) {
                        throw new Error('SDK Square non disponible après chargement');
                    }

                    if (!cardContainerRef.current) {
                        throw new Error('Conteneur de carte non trouvé');
                    }

                    console.log('🔧 [Square] Initialisation du formulaire de carte...');
                    
                    // Initialiser Square Payments
                    const payments = window.Square.payments(applicationId, locationId);
                    
                    // Créer l'instance de carte
                    const card = await payments.card();
                    
                    // Attacher le formulaire de carte au conteneur
                    await card.attach(cardContainerRef.current);
                    
                    setCardInstance(card);
                    setIsReady(true);
                    setIsLoading(false);
                    console.log('✅ [Square] Formulaire de paiement prêt!');
                } catch (error: any) {
                    console.error('❌ [Square] Erreur initialisation:', error);
                    onError(`Erreur: ${error.message}`);
                    setIsLoading(false);
                    initAttemptedRef.current = false;
                }
            };

            script.onerror = (error) => {
                console.error('❌ [Square] Erreur chargement script:', error);
                onError('Impossible de charger le SDK Square. Vérifiez votre connexion internet.');
                setIsLoading(false);
                scriptLoadedRef.current = false;
                initAttemptedRef.current = false;
            };

            document.head.appendChild(script);
            console.log('📤 [Square] Script ajouté au DOM');
        }
    }, [onError]);

    // Callback ref qui se déclenche quand l'élément est monté dans le DOM
    const setCardContainerRef = useCallback((element: HTMLDivElement | null) => {
        if (element && !containerReadyRef.current) {
            cardContainerRef.current = element;
            containerReadyRef.current = true;
            console.log('✅ [Square] Conteneur monté dans le DOM');
            
            // Attendre un peu pour s'assurer que l'élément est complètement rendu
            setTimeout(() => {
                if (cardContainerRef.current && !initAttemptedRef.current) {
                    initializeSquare();
                }
            }, 100);
        }
    }, [initializeSquare]);

    // ✅ Fonction de tokenisation
    const handleSubmit = useCallback(async () => {
        if (!cardInstance || !isReady || isProcessing || disabled) {
            if (!isReady) {
                console.warn('⚠️ [Square] Formulaire pas encore prêt');
                onError('Le formulaire de paiement n\'est pas encore prêt. Veuillez patienter.');
            }
            return;
        }

        console.log('🔒 [Square] Début de la tokenisation...');
        setIsProcessing(true);

        try {
            // ✅ Tokeniser la carte
            const tokenResult = await cardInstance.tokenize();
            
            console.log('📥 [Square] Résultat tokenisation:', {
                status: tokenResult.status,
                hasToken: !!tokenResult.token,
                hasErrors: !!tokenResult.errors,
            });

            if (tokenResult.status === 'OK') {
                console.log('✅ [Square] Token généré:', tokenResult.token.substring(0, 20) + '...');
                onTokenReceived(tokenResult.token);
            } else {
                let errorMessage = 'Erreur lors de la validation de la carte';
                
                if (tokenResult.errors && tokenResult.errors.length > 0) {
                    errorMessage = tokenResult.errors
                        .map((e: any) => e.message || e.detail || 'Erreur inconnue')
                        .join(', ');
                }
                
                console.error('❌ [Square] Erreur tokenisation:', errorMessage);
                onError(errorMessage);
                setIsProcessing(false);
            }
        } catch (error: any) {
            console.error('❌ [Square] Exception lors de la tokenisation:', error);
            onError(error.message || 'Une erreur est survenue lors du traitement de la carte');
            setIsProcessing(false);
        }
    }, [cardInstance, isReady, isProcessing, disabled, onTokenReceived, onError]);

    // ✅ Exposer la fonction handleSubmit via window pour l'appeler depuis le parent
    useEffect(() => {
        if (typeof window !== 'undefined') {
            (window as any).__squarePaymentFormSubmit = handleSubmit;
            console.log('✅ [Square] Fonction de tokenisation exposée');
        }
        return () => {
            if (typeof window !== 'undefined') {
                delete (window as any).__squarePaymentFormSubmit;
                console.log('🧹 [Square] Fonction de tokenisation nettoyée');
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
                    <div style={{ marginBottom: '1rem', fontSize: '2rem' }}>🔄</div>
                    <div style={{ fontSize: '0.9rem', color: '#6b7280' }}>
                        Chargement du formulaire de paiement sécurisé...
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: '0.5rem' }}>
                        Cela peut prendre quelques secondes
                    </div>
                </div>
            )}
            
            {/* ✅ Toujours rendre le conteneur, même pendant le chargement */}
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
                    ⚠️ Le formulaire de paiement n'a pas pu être chargé. Veuillez vérifier votre configuration Square ou rafraîchir la page.
                </div>
            )}

            {isReady && !isLoading && (
                <div style={{
                    padding: '0.75rem',
                    background: '#d1fae5',
                    borderRadius: '0.5rem',
                    color: '#065f46',
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                }}>
                    <span>✓</span>
                    <span>Formulaire de paiement prêt</span>
                </div>
            )}
        </div>
    );
}