// ============================================================================
// EMAIL SERVICE - Resend/SendGrid Integration
// ============================================================================

// ============================================================================
// TYPES
// ============================================================================

export interface EmailOptions {
    to: string;
    subject: string;
    template?: string;
    data?: Record<string, any>;
    html?: string;
    text?: string;
}

export interface EmailResult {
    success: boolean;
    messageId?: string;
    error?: string;
}

// ============================================================================
// EMAIL TEMPLATES
// ============================================================================

function getOrderConfirmationTemplate(data: {
    orderNumber: string;
    customerName: string;
    items: Array<{ name: string; quantity: number; price: number }>;
    total: number;
    currency: string;
    shippingAddress: any;
}): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #000; color: #fff; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .order-details { background: #fff; padding: 15px; margin: 20px 0; border-radius: 5px; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Monican E-commerce</h1>
        </div>
        <div class="content">
            <h2>Confirmation de commande</h2>
            <p>Bonjour ${data.customerName},</p>
            <p>Merci pour votre commande ! Votre commande <strong>${data.orderNumber}</strong> a été reçue et est en cours de traitement.</p>
            
            <div class="order-details">
                <h3>Détails de la commande</h3>
                <ul>
                    ${data.items.map(item => `
                        <li>${item.name} x ${item.quantity} - ${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: data.currency }).format(item.price * item.quantity)}</li>
                    `).join('')}
                </ul>
                <p><strong>Total: ${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: data.currency }).format(data.total)}</strong></p>
            </div>
            
            <p>Nous vous enverrons un email de confirmation dès que votre commande sera expédiée.</p>
        </div>
        <div class="footer">
            <p>Monican E-commerce - support@monican.com</p>
        </div>
    </div>
</body>
</html>
    `;
}

function getShippingNotificationTemplate(data: {
    orderNumber: string;
    customerName: string;
    trackingNumber: string;
    carrier?: string;
}): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #000; color: #fff; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .tracking { background: #fff; padding: 15px; margin: 20px 0; border-radius: 5px; text-align: center; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Monican E-commerce</h1>
        </div>
        <div class="content">
            <h2>Votre commande a été expédiée !</h2>
            <p>Bonjour ${data.customerName},</p>
            <p>Votre commande <strong>${data.orderNumber}</strong> a été expédiée.</p>
            
            <div class="tracking">
                <h3>Numéro de suivi</h3>
                <p style="font-size: 24px; font-weight: bold;">${data.trackingNumber}</p>
                ${data.carrier ? `<p>Transporteur: ${data.carrier}</p>` : ''}
            </div>
            
            <p>Vous pouvez suivre votre colis en utilisant le numéro de suivi ci-dessus.</p>
        </div>
        <div class="footer">
            <p>Monican E-commerce - support@monican.com</p>
        </div>
    </div>
</body>
</html>
    `;
}

// ============================================================================
// EMAIL FUNCTIONS
// ============================================================================

/**
 * Envoie un email
 */
export async function sendEmail(options: EmailOptions): Promise<EmailResult> {
    try {
        const emailService = process.env.EMAIL_SERVICE || 'resend';
        const emailFrom = process.env.EMAIL_FROM || 'noreply@monican.com';
        const emailFromName = process.env.EMAIL_FROM_NAME || 'Monican E-commerce';

        let html = options.html;
        let text = options.text;

        // Générer le contenu depuis un template si spécifié
        if (options.template && options.data) {
            switch (options.template) {
                case 'order_confirmation':
                    html = getOrderConfirmationTemplate(options.data);
                    break;
                case 'shipping_notification':
                    html = getShippingNotificationTemplate(options.data);
                    break;
                default:
                    html = options.html || '';
            }
        }

        if (emailService === 'resend') {
            return await sendEmailResend({
                ...options,
                html: html || '',
                text: text || '',
                from: `${emailFromName} <${emailFrom}>`,
            });
        } else if (emailService === 'sendgrid') {
            return await sendEmailSendGrid({
                ...options,
                html: html || '',
                text: text || '',
                from: emailFrom,
                fromName: emailFromName,
            });
        } else {
            // Fallback: utiliser Supabase (si configuré)
            return await sendEmailSupabase({
                ...options,
                html: html || '',
                text: text || '',
            });
        }
    } catch (error) {
        console.error('Error sending email:', error);
        return {
            success: false,
            error: 'Erreur lors de l\'envoi de l\'email',
        };
    }
}

/**
 * Envoie un email via Resend
 */
async function sendEmailResend(options: EmailOptions & { html: string; text: string; from: string }): Promise<EmailResult> {
    try {
        const resendApiKey = process.env.RESEND_API_KEY;

        if (!resendApiKey) {
            return {
                success: false,
                error: 'Clé API Resend manquante',
            };
        }

        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${resendApiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                from: options.from,
                to: options.to,
                subject: options.subject,
                html: options.html,
                text: options.text,
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            return {
                success: false,
                error: data.message || 'Erreur lors de l\'envoi',
            };
        }

        return {
            success: true,
            messageId: data.id,
        };
    } catch (error) {
        console.error('Error sending email via Resend:', error);
        return {
            success: false,
            error: 'Erreur de connexion à Resend',
        };
    }
}

/**
 * Envoie un email via SendGrid
 */
async function sendEmailSendGrid(options: EmailOptions & { html: string; text: string; from: string; fromName: string }): Promise<EmailResult> {
    try {
        const sendgridApiKey = process.env.SENDGRID_API_KEY;

        if (!sendgridApiKey) {
            return {
                success: false,
                error: 'Clé API SendGrid manquante',
            };
        }

        const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${sendgridApiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                personalizations: [{
                    to: [{ email: options.to }],
                }],
                from: {
                    email: options.from,
                    name: options.fromName,
                },
                subject: options.subject,
                content: [
                    {
                        type: 'text/plain',
                        value: options.text,
                    },
                    {
                        type: 'text/html',
                        value: options.html,
                    },
                ],
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            return {
                success: false,
                error: errorText || 'Erreur lors de l\'envoi',
            };
        }

        return {
            success: true,
            messageId: response.headers.get('x-message-id') || undefined,
        };
    } catch (error) {
        console.error('Error sending email via SendGrid:', error);
        return {
            success: false,
            error: 'Erreur de connexion à SendGrid',
        };
    }
}

/**
 * Envoie un email via Supabase (fallback)
 */
async function sendEmailSupabase(options: EmailOptions & { html: string; text: string }): Promise<EmailResult> {
    try {
        // Ajouter à la file d'attente d'emails dans Supabase
        const { supabaseAdmin } = await import('./supabase');

        const { error } = await supabaseAdmin
            .from('email_queue')
            .insert({
                to_email: options.to,
                subject: options.subject,
                template: options.template || null,
                data: options.data || {},
                status: 'pending',
            });

        if (error) {
            return {
                success: false,
                error: 'Erreur lors de l\'ajout à la file d\'attente',
            };
        }

        // Note: Un worker séparé devrait traiter la file d'attente
        // Pour l'instant, on retourne success car l'email est en file d'attente
        return {
            success: true,
        };
    } catch (error) {
        console.error('Error queuing email:', error);
        return {
            success: false,
            error: 'Erreur lors de la mise en file d\'attente',
        };
    }
}

/**
 * Envoie une confirmation de commande
 */
export async function sendOrderConfirmation(orderData: {
    orderNumber: string;
    customerEmail: string;
    customerName: string;
    items: Array<{ name: string; quantity: number; price: number }>;
    total: number;
    currency: string;
    shippingAddress: any;
}): Promise<EmailResult> {
    return sendEmail({
        to: orderData.customerEmail,
        subject: `Confirmation de commande ${orderData.orderNumber}`,
        template: 'order_confirmation',
        data: orderData,
    });
}

/**
 * Envoie une notification d'expédition
 */
export async function sendShippingNotification(shippingData: {
    orderNumber: string;
    customerEmail: string;
    customerName: string;
    trackingNumber: string;
    carrier?: string;
}): Promise<EmailResult> {
    return sendEmail({
        to: shippingData.customerEmail,
        subject: `Votre commande ${shippingData.orderNumber} a été expédiée`,
        template: 'shipping_notification',
        data: shippingData,
    });
}
