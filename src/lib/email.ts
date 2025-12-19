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
    items: Array<{ name: string; quantity: number; price: number; size?: string; image?: string }>;
    subtotal?: number;
    shippingCost?: number;
    tax?: number;
    total: number;
    currency: string;
    shippingAddress: any;
    orderDate?: string;
}): string {
    const formatCurrency = (amount: number) => {
        const locale = data.currency === 'USD' ? 'en-US' : data.currency === 'CAD' ? 'en-CA' : 'es-MX';
        return new Intl.NumberFormat(locale, { 
            style: 'currency', 
            currency: data.currency 
        }).format(amount);
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return new Date().toLocaleDateString('fr-FR', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
        return new Date(dateString).toLocaleDateString('fr-FR', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    };

    const subtotal = data.subtotal || data.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shipping = data.shippingCost || 0;
    const tax = data.tax || 0;

    return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>Confirmation de commande - Monican.shop</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #1a1a1a;
            background-color: #f5f5f5;
            padding: 0;
            margin: 0;
        }
        .email-wrapper {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
        }
        .header {
            background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%);
            color: #ffffff;
            padding: 40px 30px;
            text-align: center;
        }
        .header h1 {
            font-size: 28px;
            font-weight: 700;
            letter-spacing: 1px;
            margin: 0;
        }
        .header .subtitle {
            font-size: 14px;
            opacity: 0.9;
            margin-top: 8px;
        }
        .success-banner {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: #ffffff;
            padding: 30px;
            text-align: center;
        }
        .success-banner .icon {
            font-size: 48px;
            margin-bottom: 15px;
        }
        .success-banner h2 {
            font-size: 24px;
            font-weight: 700;
            margin: 0 0 10px 0;
        }
        .success-banner p {
            font-size: 16px;
            opacity: 0.95;
            margin: 0;
        }
        .content {
            padding: 40px 30px;
            background-color: #ffffff;
        }
        .greeting {
            font-size: 18px;
            color: #1a1a1a;
            margin-bottom: 20px;
            line-height: 1.8;
        }
        .order-info {
            background: #f9fafb;
            border-left: 4px solid #000000;
            padding: 20px;
            margin: 25px 0;
            border-radius: 4px;
        }
        .order-info p {
            margin: 5px 0;
            font-size: 15px;
        }
        .order-info strong {
            color: #000000;
            font-weight: 600;
        }
        .section-title {
            font-size: 20px;
            font-weight: 700;
            color: #000000;
            margin: 35px 0 20px 0;
            padding-bottom: 10px;
            border-bottom: 2px solid #e5e7eb;
        }
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            background: #ffffff;
        }
        .items-table th {
            background: #f9fafb;
            padding: 15px;
            text-align: left;
            font-weight: 600;
            font-size: 13px;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            border-bottom: 2px solid #e5e7eb;
        }
        .items-table td {
            padding: 20px 15px;
            border-bottom: 1px solid #e5e7eb;
            vertical-align: top;
        }
        .item-name {
            font-weight: 600;
            color: #1a1a1a;
            font-size: 15px;
            margin-bottom: 5px;
        }
        .item-details {
            font-size: 13px;
            color: #6b7280;
        }
        .item-quantity {
            text-align: center;
            font-weight: 600;
            color: #1a1a1a;
        }
        .item-price {
            text-align: right;
            font-weight: 600;
            color: #1a1a1a;
            font-size: 15px;
        }
        .totals {
            background: #f9fafb;
            padding: 20px;
            margin: 25px 0;
            border-radius: 4px;
        }
        .total-row {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            font-size: 15px;
        }
        .total-row:not(.total-final) {
            color: #6b7280;
            border-bottom: 1px solid #e5e7eb;
        }
        .total-final {
            font-size: 20px;
            font-weight: 700;
            color: #000000;
            margin-top: 10px;
            padding-top: 15px;
            border-top: 2px solid #000000;
        }
        .shipping-address {
            background: #f9fafb;
            padding: 20px;
            margin: 25px 0;
            border-radius: 4px;
            border: 1px solid #e5e7eb;
        }
        .shipping-address h3 {
            font-size: 16px;
            font-weight: 600;
            color: #000000;
            margin-bottom: 12px;
        }
        .shipping-address p {
            font-size: 14px;
            color: #4b5563;
            line-height: 1.8;
            margin: 5px 0;
        }
        .next-steps {
            background: #eff6ff;
            border-left: 4px solid #3b82f6;
            padding: 20px;
            margin: 25px 0;
            border-radius: 4px;
        }
        .next-steps h3 {
            font-size: 16px;
            font-weight: 600;
            color: #1e40af;
            margin-bottom: 12px;
        }
        .next-steps ul {
            margin-left: 20px;
            color: #1e3a8a;
        }
        .next-steps li {
            margin: 8px 0;
            font-size: 14px;
            line-height: 1.6;
        }
        .footer {
            background: #1a1a1a;
            color: #9ca3af;
            padding: 40px 30px;
            text-align: center;
            font-size: 13px;
            line-height: 1.8;
        }
        .footer a {
            color: #ffffff;
            text-decoration: none;
        }
        .footer a:hover {
            text-decoration: underline;
        }
        .footer-links {
            margin: 20px 0;
        }
        .footer-links a {
            margin: 0 15px;
            color: #d1d5db;
        }
        .divider {
            height: 1px;
            background: #e5e7eb;
            margin: 30px 0;
        }
        @media only screen and (max-width: 600px) {
            .content {
                padding: 30px 20px;
            }
            .header {
                padding: 30px 20px;
            }
            .items-table {
                font-size: 12px;
            }
            .items-table th,
            .items-table td {
                padding: 12px 8px;
            }
            .total-row {
                font-size: 14px;
            }
            .total-final {
                font-size: 18px;
            }
        }
    </style>
</head>
<body>
    <div class="email-wrapper">
        <!-- Header -->
        <div class="header">
            <h1>MONICAN.SHOP</h1>
            <div class="subtitle">Votre boutique de confiance</div>
        </div>

        <!-- Success Banner -->
        <div class="success-banner">
            <div class="icon">✓</div>
            <h2>Commande confirmée !</h2>
            <p>Merci pour votre achat. Votre commande a été reçue avec succès.</p>
        </div>

        <!-- Main Content -->
        <div class="content">
            <div class="greeting">
                Bonjour <strong>${data.customerName}</strong>,
            </div>

            <p style="font-size: 15px; color: #4b5563; line-height: 1.8; margin-bottom: 25px;">
                Nous sommes ravis de vous confirmer que votre commande a été reçue et est en cours de traitement. 
                Vous trouverez ci-dessous tous les détails de votre commande.
            </p>

            <!-- Order Information -->
            <div class="order-info">
                <p><strong>Numéro de commande :</strong> ${data.orderNumber}</p>
                <p><strong>Date de commande :</strong> ${formatDate(data.orderDate)}</p>
                <p><strong>Statut :</strong> <span style="color: #059669; font-weight: 600;">Confirmée</span></p>
            </div>

            <!-- Order Items -->
            <h2 class="section-title">Articles commandés</h2>
            <table class="items-table">
                <thead>
                    <tr>
                        <th>Article</th>
                        <th style="text-align: center; width: 80px;">Qté</th>
                        <th style="text-align: right;">Prix</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.items.map(item => `
                        <tr>
                            <td>
                                <div class="item-name">${item.name}</div>
                                ${item.size ? `<div class="item-details">Taille: ${item.size}</div>` : ''}
                            </td>
                            <td class="item-quantity">${item.quantity}</td>
                            <td class="item-price">${formatCurrency(item.price * item.quantity)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>

            <!-- Totals -->
            <div class="totals">
                <div class="total-row">
                    <span>Sous-total</span>
                    <span>${formatCurrency(subtotal)}</span>
                </div>
                ${shipping > 0 ? `
                <div class="total-row">
                    <span>Frais de livraison</span>
                    <span>${formatCurrency(shipping)}</span>
                </div>
                ` : ''}
                ${tax > 0 ? `
                <div class="total-row">
                    <span>Taxes</span>
                    <span>${formatCurrency(tax)}</span>
                </div>
                ` : ''}
                <div class="total-row total-final">
                    <span>Total</span>
                    <span>${formatCurrency(data.total)}</span>
                </div>
            </div>

            <!-- Shipping Address -->
            ${data.shippingAddress ? `
            <h2 class="section-title">Adresse de livraison</h2>
            <div class="shipping-address">
                <h3>Livraison à :</h3>
                <p>
                    ${data.shippingAddress.name || data.customerName}<br>
                    ${data.shippingAddress.address || ''}<br>
                    ${data.shippingAddress.address2 ? data.shippingAddress.address2 + '<br>' : ''}
                    ${data.shippingAddress.city || ''}, ${data.shippingAddress.state || ''} ${data.shippingAddress.postalCode || ''}<br>
                    ${data.shippingAddress.country || ''}
                </p>
            </div>
            ` : ''}

            <!-- Next Steps -->
            <div class="next-steps">
                <h3>Prochaines étapes</h3>
                <ul>
                    <li>Vous recevrez un email de confirmation dès que votre commande sera expédiée</li>
                    <li>Un numéro de suivi vous sera fourni pour suivre votre colis</li>
                    <li>Le délai de livraison estimé est de 5 à 7 jours ouvrés</li>
                </ul>
            </div>

            <div class="divider"></div>

            <p style="font-size: 14px; color: #6b7280; line-height: 1.8; text-align: center; margin-top: 30px;">
                Si vous avez des questions concernant votre commande, n'hésitez pas à nous contacter. 
                Notre équipe est là pour vous aider !
            </p>
        </div>

        <!-- Footer -->
        <div class="footer">
            <p style="font-size: 16px; font-weight: 600; color: #ffffff; margin-bottom: 15px;">Monican.shop</p>
            <div class="footer-links">
                <a href="https://monican.shop">Notre site web</a>
                <a href="https://monican.shop/contact">Contact</a>
                <a href="https://monican.shop/faq">FAQ</a>
            </div>
            <p style="margin-top: 20px;">
                Email : <a href="mailto:support@monican.shop">support@monican.shop</a><br>
                Téléphone : <a href="tel:+17178801479">+1 717-880-1479</a>
            </p>
            <p style="margin-top: 20px; font-size: 12px; color: #6b7280;">
                © ${new Date().getFullYear()} Monican.shop. Tous droits réservés.
            </p>
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
            <p>Monican E-commerce - support@monican.shop</p>
            <p>www.monican.shop - +1 717-880-1479</p>
        </div>
    </div>
</body>
</html>
    `;
}

function getOrderConfirmationTextTemplate(data: {
    orderNumber: string;
    customerName: string;
    items: Array<{ name: string; quantity: number; price: number; size?: string }>;
    subtotal?: number;
    shippingCost?: number;
    tax?: number;
    total: number;
    currency: string;
    shippingAddress: any;
    orderDate?: string;
}): string {
    const formatCurrency = (amount: number) => {
        const locale = data.currency === 'USD' ? 'en-US' : data.currency === 'CAD' ? 'en-CA' : 'es-MX';
        return new Intl.NumberFormat(locale, { 
            style: 'currency', 
            currency: data.currency 
        }).format(amount);
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return new Date().toLocaleDateString('fr-FR', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
        return new Date(dateString).toLocaleDateString('fr-FR', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    };

    const subtotal = data.subtotal || data.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shipping = data.shippingCost || 0;
    const tax = data.tax || 0;

    let text = `MONICAN.SHOP\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    text += `✓ COMMANDE CONFIRMÉE !\n\n`;
    text += `Bonjour ${data.customerName},\n\n`;
    text += `Nous sommes ravis de vous confirmer que votre commande a été reçue et est en cours de traitement.\n\n`;
    text += `INFORMATIONS DE COMMANDE\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `Numéro de commande : ${data.orderNumber}\n`;
    text += `Date de commande : ${formatDate(data.orderDate)}\n`;
    text += `Statut : Confirmée\n\n`;
    text += `ARTICLES COMMANDÉS\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    data.items.forEach(item => {
        text += `${item.name}${item.size ? ` (Taille: ${item.size})` : ''}\n`;
        text += `Quantité: ${item.quantity} x ${formatCurrency(item.price)} = ${formatCurrency(item.price * item.quantity)}\n\n`;
    });
    text += `RÉCAPITULATIF\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `Sous-total : ${formatCurrency(subtotal)}\n`;
    if (shipping > 0) {
        text += `Frais de livraison : ${formatCurrency(shipping)}\n`;
    }
    if (tax > 0) {
        text += `Taxes : ${formatCurrency(tax)}\n`;
    }
    text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `TOTAL : ${formatCurrency(data.total)}\n\n`;
    if (data.shippingAddress) {
        text += `ADRESSE DE LIVRAISON\n`;
        text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
        text += `${data.shippingAddress.name || data.customerName}\n`;
        text += `${data.shippingAddress.address || ''}\n`;
        if (data.shippingAddress.address2) {
            text += `${data.shippingAddress.address2}\n`;
        }
        text += `${data.shippingAddress.city || ''}, ${data.shippingAddress.state || ''} ${data.shippingAddress.postalCode || ''}\n`;
        text += `${data.shippingAddress.country || ''}\n\n`;
    }
    text += `PROCHAINES ÉTAPES\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `• Vous recevrez un email de confirmation dès que votre commande sera expédiée\n`;
    text += `• Un numéro de suivi vous sera fourni pour suivre votre colis\n`;
    text += `• Le délai de livraison estimé est de 5 à 7 jours ouvrés\n\n`;
    text += `Si vous avez des questions concernant votre commande, n'hésitez pas à nous contacter.\n\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `MONICAN.SHOP\n`;
    text += `Email : support@monican.shop\n`;
    text += `Téléphone : +1 717-880-1479\n`;
    text += `Site web : https://monican.shop\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `© ${new Date().getFullYear()} Monican.shop. Tous droits réservés.\n`;

    return text;
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
                    html = getOrderConfirmationTemplate(options.data as {
                        orderNumber: string;
                        customerName: string;
                        items: Array<{ name: string; quantity: number; price: number; size?: string; image?: string }>;
                        subtotal?: number;
                        shippingCost?: number;
                        tax?: number;
                        total: number;
                        currency: string;
                        shippingAddress: any;
                        orderDate?: string;
                    });
                    if (!text) {
                        text = getOrderConfirmationTextTemplate(options.data as {
                            orderNumber: string;
                            customerName: string;
                            items: Array<{ name: string; quantity: number; price: number; size?: string }>;
                            subtotal?: number;
                            shippingCost?: number;
                            tax?: number;
                            total: number;
                            currency: string;
                            shippingAddress: any;
                            orderDate?: string;
                        });
                    }
                    break;
                case 'shipping_notification':
                    html = getShippingNotificationTemplate(options.data as {
                        orderNumber: string;
                        customerName: string;
                        trackingNumber: string;
                        carrier?: string;
                    });
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
    items: Array<{ name: string; quantity: number; price: number; size?: string; image?: string }>;
    subtotal?: number;
    shippingCost?: number;
    tax?: number;
    total: number;
    currency: string;
    shippingAddress: any;
    orderDate?: string;
}): Promise<EmailResult> {
    return sendEmail({
        to: orderData.customerEmail,
        subject: `Confirmation de commande ${orderData.orderNumber} - Monican.shop`,
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
