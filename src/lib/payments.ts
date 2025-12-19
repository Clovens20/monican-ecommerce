// ============================================================================
// PAYMENT PROCESSING - Stripe Integration
// ============================================================================

import Stripe from 'stripe';

// Initialiser Stripe avec la clé secrète
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2025-12-15.clover',
});

// ============================================================================
// TYPES
// ============================================================================

export interface PaymentRequest {
    amount: number; // En centimes (ex: 10000 = $100.00)
    currency: 'USD' | 'CAD' | 'MXN';
    sourceId: string; // PaymentIntent ID ou PaymentMethod ID depuis Stripe
    orderId?: string;
    customerEmail: string;
    customerName: string;
    shippingAddress: {
        street: string;
        city: string;
        state: string;
        zip: string;
        country: string;
    };
}

export interface PaymentResult {
    success: boolean;
    paymentId?: string;
    transactionId?: string;
    error?: string;
    errorCode?: string;
}

export interface RefundRequest {
    paymentId: string;
    amount?: number; // Montant partiel, si omis = remboursement total
    reason?: string;
}

export interface RefundResult {
    success: boolean;
    refundId?: string;
    error?: string;
}

// ============================================================================
// PAYMENT FUNCTIONS - STRIPE
// ============================================================================

/**
 * Traite un paiement via Stripe avec retry automatique
 */
export async function processPaymentWithRetry(
    request: PaymentRequest,
    maxRetries: number = 3
): Promise<PaymentResult> {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

    if (!stripeSecretKey) {
        return {
            success: false,
            error: 'Configuration Stripe manquante (STRIPE_SECRET_KEY)',
            errorCode: 'CONFIG_ERROR',
        };
    }

    let lastError: string = '';
    let lastErrorCode: string = '';

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`💳 [STRIPE] Tentative paiement ${attempt}/${maxRetries} pour ${request.orderId || 'sans orderId'}`);

            // Si sourceId commence par "pi_", c'est un PaymentIntent ID
            // Sinon, c'est un PaymentMethod ID et on doit créer un PaymentIntent
            if (request.sourceId.startsWith('pi_')) {
                // Récupérer le PaymentIntent existant
                const paymentIntent = await stripe.paymentIntents.retrieve(request.sourceId);

                if (paymentIntent.status === 'succeeded') {
                    console.log(`✅ [STRIPE] Paiement réussi: ${paymentIntent.id}`);
                    return {
                        success: true,
                        paymentId: paymentIntent.id,
                        transactionId: paymentIntent.id,
                    };
                } else if (paymentIntent.status === 'requires_action') {
                    // Le paiement nécessite une action (ex: 3D Secure)
                    return {
                        success: false,
                        error: 'Paiement nécessite une authentification supplémentaire',
                        errorCode: 'REQUIRES_ACTION',
                    };
                } else if (paymentIntent.status === 'processing') {
                    // Le paiement est en cours de traitement
                    return {
                        success: false,
                        error: 'Paiement en cours de traitement',
                        errorCode: 'PROCESSING',
                    };
                } else {
                    lastError = `Statut: ${paymentIntent.status}`;
                    lastErrorCode = 'INVALID_STATUS';
                }
            } else {
                // Créer un PaymentIntent avec le PaymentMethod
                const paymentIntent = await stripe.paymentIntents.create({
                    amount: request.amount,
                    currency: request.currency.toLowerCase(),
                    payment_method: request.sourceId,
                    confirmation_method: 'manual',
                    confirm: true,
                    return_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/order-confirmation`,
                    metadata: {
                        orderId: request.orderId || '',
                        customerEmail: request.customerEmail,
                        customerName: request.customerName,
                    },
                    shipping: {
                        name: request.customerName,
                        address: {
                            line1: request.shippingAddress.street,
                            city: request.shippingAddress.city,
                            state: request.shippingAddress.state,
                            postal_code: request.shippingAddress.zip,
                            country: request.shippingAddress.country,
                        },
                    },
                });

                if (paymentIntent.status === 'succeeded') {
                    console.log(`✅ [STRIPE] Paiement réussi: ${paymentIntent.id}`);
                    return {
                        success: true,
                        paymentId: paymentIntent.id,
                        transactionId: paymentIntent.id,
                    };
                } else if (paymentIntent.status === 'requires_action') {
                    return {
                        success: false,
                        error: 'Paiement nécessite une authentification supplémentaire',
                        errorCode: 'REQUIRES_ACTION',
                    };
                } else {
                    lastError = `Statut: ${paymentIntent.status}`;
                    lastErrorCode = 'INVALID_STATUS';
                }
            }

            // Certaines erreurs ne doivent pas être retentées
            if (lastErrorCode === 'INVALID_STATUS' && lastError.includes('canceled')) {
                break;
            }

            if (attempt < maxRetries) {
                const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
                console.log(`⏳ [STRIPE] Attente ${delay}ms avant retry...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }

        } catch (error: any) {
            lastError = error.message || 'Erreur lors du traitement du paiement';
            lastErrorCode = error.code || 'PROCESSING_ERROR';
            console.error(`❌ [STRIPE] Tentative ${attempt} erreur:`, lastError);

            // Erreurs non-retryable
            const nonRetryableCodes = ['card_declined', 'insufficient_funds', 'expired_card', 'incorrect_cvc'];
            if (nonRetryableCodes.includes(error.code)) {
                break;
            }

            if (attempt < maxRetries) {
                const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    console.error(`❌ [STRIPE] Échec paiement après ${maxRetries} tentatives`);
    return {
        success: false,
        error: lastError || 'Échec paiement après retries',
        errorCode: lastErrorCode,
    };
}

/**
 * Traite un paiement via Stripe (wrapper avec retry par défaut)
 */
export async function processPayment(request: PaymentRequest): Promise<PaymentResult> {
    return processPaymentWithRetry(request, 3);
}

/**
 * Rembourse un paiement via Stripe
 */
export async function refundPayment(
    paymentId: string,
    amount?: number,
    reason?: string
): Promise<RefundResult>;
export async function refundPayment(request: RefundRequest): Promise<RefundResult>;
export async function refundPayment(
    paymentIdOrRequest: string | RefundRequest,
    amount?: number,
    reason?: string
): Promise<RefundResult> {
    try {
        const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

        if (!stripeSecretKey) {
            return {
                success: false,
                error: 'Configuration Stripe manquante (STRIPE_SECRET_KEY)',
            };
        }

        // Support des deux signatures de fonction
        let paymentId: string;
        let refundAmount: number | undefined;
        let refundReason: string | undefined;

        if (typeof paymentIdOrRequest === 'string') {
            paymentId = paymentIdOrRequest;
            refundAmount = amount;
            refundReason = reason;
        } else {
            paymentId = paymentIdOrRequest.paymentId;
            refundAmount = paymentIdOrRequest.amount;
            refundReason = paymentIdOrRequest.reason;
        }

        console.log('💰 [STRIPE] Remboursement:', paymentId, refundAmount ? `(${refundAmount} centimes)` : '(total)');

        // Récupérer le PaymentIntent pour obtenir le montant
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentId);
        
        const refundParams: Stripe.RefundCreateParams = {
            payment_intent: paymentId,
            reason: refundReason ? (refundReason as Stripe.RefundCreateParams.Reason) : undefined,
        };

        // Si montant spécifié, remboursement partiel
        if (refundAmount !== undefined) {
            refundParams.amount = refundAmount;
        }

        const refund = await stripe.refunds.create(refundParams);

        console.log('✅ [STRIPE] Remboursement créé:', refund.id);
        return {
            success: true,
            refundId: refund.id,
        };
    } catch (error: any) {
        console.error('❌ [STRIPE] Erreur remboursement:', error);
        return {
            success: false,
            error: error.message || 'Erreur lors du remboursement',
        };
    }
}

/**
 * Vérifie le statut d'un paiement Stripe
 */
export async function getPaymentStatus(paymentId: string): Promise<{
    status: string;
    amount: number;
    currency: string;
} | null> {
    try {
        const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

        if (!stripeSecretKey) {
            return null;
        }

        const paymentIntent = await stripe.paymentIntents.retrieve(paymentId);

        return {
            status: paymentIntent.status,
            amount: paymentIntent.amount,
            currency: paymentIntent.currency.toUpperCase(),
        };
    } catch (error) {
        console.error('❌ [STRIPE] Error getting payment status:', error);
        return null;
    }
}

