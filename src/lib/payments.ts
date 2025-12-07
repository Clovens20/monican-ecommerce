// ============================================================================
// PAYMENT PROCESSING - Square Integration
// ============================================================================

// ============================================================================
// TYPES
// ============================================================================

export interface PaymentRequest {
    amount: number; // En centimes (ex: 10000 = $100.00)
    currency: 'USD' | 'CAD' | 'MXN';
    sourceId: string; // Token de la carte depuis Square
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
// PAYMENT FUNCTIONS
// ============================================================================

/**
 * Traite un paiement via Square avec retry automatique
 * ✅ CORRECTION 4: Ajout de retry avec exponential backoff
 * NOTE: Cette fonction doit être appelée côté serveur uniquement
 */
export async function processPaymentWithRetry(
    request: PaymentRequest,
    maxRetries: number = 3
): Promise<PaymentResult> {
    const squareAccessToken = process.env.SQUARE_ACCESS_TOKEN;
    const squareLocationId = process.env.SQUARE_LOCATION_ID;
    const squareEnvironment = process.env.SQUARE_ENVIRONMENT || 'sandbox';

    if (!squareAccessToken || !squareLocationId) {
        return {
            success: false,
            error: 'Configuration Square manquante',
            errorCode: 'CONFIG_ERROR',
        };
    }

    const squareApiUrl = squareEnvironment === 'production'
        ? 'https://connect.squareup.com'
        : 'https://connect.squareupsandbox.com';

    let lastError: string = '';
    let lastErrorCode: string = '';

    // Générer un idempotency key unique basé sur orderId et timestamp
    const baseIdempotencyKey = request.orderId || `order-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`💳 Tentative paiement ${attempt}/${maxRetries} pour ${baseIdempotencyKey}`);

            // Idempotency key unique par tentative (permet retry sans risque de double paiement)
            const idempotencyKey = `${baseIdempotencyKey}-${Math.floor(Date.now() / 1000)}-${attempt}`;

            // Préparer la requête de paiement
            const paymentRequest = {
                source_id: request.sourceId,
                amount_money: {
                    amount: request.amount,
                    currency: request.currency,
                },
                idempotency_key: idempotencyKey,
                buyer_email_address: request.customerEmail,
                shipping_address: {
                    address_line_1: request.shippingAddress.street,
                    locality: request.shippingAddress.city,
                    administrative_district_level_1: request.shippingAddress.state,
                    postal_code: request.shippingAddress.zip,
                    country: request.shippingAddress.country,
                },
            };

            // Appeler l'API Square
            const response = await fetch(`${squareApiUrl}/v2/payments`, {
                method: 'POST',
                headers: {
                    'Square-Version': '2023-10-18',
                    'Authorization': `Bearer ${squareAccessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(paymentRequest),
            });

            const data = await response.json();

            if (!response.ok) {
                const errorMessage = data.errors?.[0]?.detail || 'Erreur de paiement';
                lastError = errorMessage;
                lastErrorCode = data.errors?.[0]?.code || 'UNKNOWN_ERROR';
                
                // Certaines erreurs ne doivent pas être retentées (ex: carte refusée)
                const nonRetryableCodes = ['CARD_DECLINED', 'INSUFFICIENT_FUNDS', 'INVALID_EXPIRATION'];
                if (nonRetryableCodes.includes(lastErrorCode)) {
                    console.error(`❌ Erreur non-retryable: ${lastErrorCode}`);
                    break;
                }

                console.error(`❌ Tentative ${attempt} échouée: ${lastError}`);
                
                if (attempt < maxRetries) {
                    // Exponential backoff: 1s, 2s, 4s (max 5s)
                    const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
                    console.log(`⏳ Attente ${delay}ms avant retry...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
                continue;
            }

            // Vérifier le statut du paiement
            if (data.payment?.status === 'COMPLETED') {
                console.log(`✅ Paiement réussi: ${data.payment.id}`);
                return {
                    success: true,
                    paymentId: data.payment.id,
                    transactionId: data.payment.id,
                };
            } else {
                lastError = `Statut: ${data.payment?.status}`;
                lastErrorCode = 'INVALID_STATUS';
                console.warn(`⚠️ Statut de paiement non complété: ${data.payment?.status}`);
            }

        } catch (error: any) {
            lastError = error.message || 'Erreur lors du traitement du paiement';
            lastErrorCode = 'PROCESSING_ERROR';
            console.error(`❌ Tentative ${attempt} erreur:`, lastError);

            if (attempt < maxRetries) {
                const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    console.error(`❌ Échec paiement après ${maxRetries} tentatives`);
    return {
        success: false,
        error: lastError || 'Échec paiement après retries',
        errorCode: lastErrorCode,
    };
}

/**
 * Traite un paiement via Square (wrapper avec retry par défaut)
 */
export async function processPayment(request: PaymentRequest): Promise<PaymentResult> {
    return processPaymentWithRetry(request, 3);
}

/**
 * Rembourse un paiement
 * ✅ CORRECTION 4: Amélioration du remboursement avec gestion d'erreurs et idempotency
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
        const squareAccessToken = process.env.SQUARE_ACCESS_TOKEN;
        const squareEnvironment = process.env.SQUARE_ENVIRONMENT || 'sandbox';

        if (!squareAccessToken) {
            return {
                success: false,
                error: 'Configuration Square manquante',
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

        console.log('💰 Remboursement:', paymentId, refundAmount ? `(${refundAmount})` : '(total)');

        const squareApiUrl = squareEnvironment === 'production'
            ? 'https://connect.squareup.com'
            : 'https://connect.squareupsandbox.com';

        // Récupérer le paiement pour obtenir le montant et la devise si montant partiel
        let currency = 'CAD';
        let totalAmount: number | undefined;

        try {
            const paymentResponse = await fetch(`${squareApiUrl}/v2/payments/${paymentId}`, {
                method: 'GET',
                headers: {
                    'Square-Version': '2023-10-18',
                    'Authorization': `Bearer ${squareAccessToken}`,
                },
            });

            if (paymentResponse.ok) {
                const paymentData = await paymentResponse.json();
                currency = paymentData.payment?.amount_money?.currency || 'CAD';
                totalAmount = Number(paymentData.payment?.amount_money?.amount || 0);
            }
        } catch (error) {
            console.warn('⚠️ Impossible de récupérer les détails du paiement:', error);
        }

        // Créer la requête de remboursement avec idempotency key unique
        const idempotencyKey = `refund-${paymentId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        const refundRequest: any = {
            idempotency_key: idempotencyKey,
            payment_id: paymentId,
            reason: refundReason || 'Échec commande - remboursement auto',
        };

        // Si montant spécifié, remboursement partiel, sinon remboursement total
        if (refundAmount !== undefined) {
            refundRequest.amount_money = {
                amount: refundAmount, // En centimes
                currency: currency,
            };
        }

        const response = await fetch(`${squareApiUrl}/v2/refunds`, {
            method: 'POST',
            headers: {
                'Square-Version': '2023-10-18',
                'Authorization': `Bearer ${squareAccessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(refundRequest),
        });

        const data = await response.json();

        if (!response.ok) {
            const errorMessage = data.errors?.[0]?.detail || 'Erreur de remboursement';
            console.error('❌ Erreur remboursement:', errorMessage);
            return {
                success: false,
                error: errorMessage,
            };
        }

        console.log('✅ Remboursement créé:', data.refund?.id);
        return {
            success: true,
            refundId: data.refund?.id,
        };
    } catch (error: any) {
        console.error('❌ Erreur remboursement:', error);
        return {
            success: false,
            error: error.message || 'Erreur lors du remboursement',
        };
    }
}

/**
 * Vérifie le statut d'un paiement
 */
export async function getPaymentStatus(paymentId: string): Promise<{
    status: string;
    amount: number;
    currency: string;
} | null> {
    try {
        const squareAccessToken = process.env.SQUARE_ACCESS_TOKEN;
        const squareEnvironment = process.env.SQUARE_ENVIRONMENT || 'sandbox';

        if (!squareAccessToken) {
            return null;
        }

        const squareApiUrl = squareEnvironment === 'production'
            ? 'https://connect.squareup.com'
            : 'https://connect.squareupsandbox.com';

        const response = await fetch(`${squareApiUrl}/v2/payments/${paymentId}`, {
            method: 'GET',
            headers: {
                'Square-Version': '2023-10-18',
                'Authorization': `Bearer ${squareAccessToken}`,
            },
        });

        const data = await response.json();

        if (!response.ok || !data.payment) {
            return null;
        }

        return {
            status: data.payment.status,
            amount: data.payment.amount_money.amount,
            currency: data.payment.amount_money.currency,
        };
    } catch (error) {
        console.error('Error getting payment status:', error);
        return null;
    }
}

