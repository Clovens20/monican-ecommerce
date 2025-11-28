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
 * Traite un paiement via Square
 * NOTE: Cette fonction doit être appelée côté serveur uniquement
 */
export async function processPayment(request: PaymentRequest): Promise<PaymentResult> {
    try {
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

        // Préparer la requête de paiement
        const paymentRequest = {
            source_id: request.sourceId,
            amount_money: {
                amount: request.amount,
                currency: request.currency,
            },
            idempotency_key: `${request.orderId || 'order'}-${Date.now()}`,
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
            return {
                success: false,
                error: errorMessage,
                errorCode: data.errors?.[0]?.code,
            };
        }

        return {
            success: true,
            paymentId: data.payment?.id,
            transactionId: data.payment?.id,
        };
    } catch (error) {
        console.error('Error processing payment:', error);
        return {
            success: false,
            error: 'Erreur lors du traitement du paiement',
            errorCode: 'PROCESSING_ERROR',
        };
    }
}

/**
 * Rembourse un paiement
 */
export async function refundPayment(request: RefundRequest): Promise<RefundResult> {
    try {
        const squareAccessToken = process.env.SQUARE_ACCESS_TOKEN;
        const squareEnvironment = process.env.SQUARE_ENVIRONMENT || 'sandbox';

        if (!squareAccessToken) {
            return {
                success: false,
                error: 'Configuration Square manquante',
            };
        }

        const squareApiUrl = squareEnvironment === 'production'
            ? 'https://connect.squareup.com'
            : 'https://connect.squareupsandbox.com';

        const refundRequest: any = {
            idempotency_key: `refund-${Date.now()}`,
            payment_id: request.paymentId,
        };

        if (request.amount) {
            refundRequest.amount_money = {
                amount: request.amount,
            };
        }

        if (request.reason) {
            refundRequest.reason = request.reason;
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
            return {
                success: false,
                error: data.errors?.[0]?.detail || 'Erreur de remboursement',
            };
        }

        return {
            success: true,
            refundId: data.refund?.id,
        };
    } catch (error) {
        console.error('Error refunding payment:', error);
        return {
            success: false,
            error: 'Erreur lors du remboursement',
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

