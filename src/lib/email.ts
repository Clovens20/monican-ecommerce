// ============================================================================
// EMAIL SERVICE - Resend/SendGrid Integration
// ============================================================================

import { getContactInfoServer, type ContactInfo } from './contact-info';

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
}, contactInfo?: ContactInfo): string {
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
                <a href="${contactInfo?.siteUrl || 'https://monican.shop'}">Notre site web</a>
                <a href="${contactInfo?.siteUrl || 'https://monican.shop'}/contact">Contact</a>
                <a href="${contactInfo?.siteUrl || 'https://monican.shop'}/faq">FAQ</a>
            </div>
            <p style="margin-top: 20px;">
                Email : <a href="mailto:${contactInfo?.email || 'support@monican.shop'}">${contactInfo?.email || 'support@monican.shop'}</a><br>
                Téléphone : <a href="tel:${contactInfo?.phone?.replace(/\D/g, '') || '17178801479'}">${contactInfo?.phone || '+1 717-880-1479'}</a>
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
}, contactInfo?: ContactInfo): string {
    return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>Votre commande a été expédiée - Monican.shop</title>
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
            margin-bottom: 8px;
            letter-spacing: 0.02em;
        }
        .header p {
            font-size: 14px;
            opacity: 0.9;
        }
        .content {
            padding: 40px 30px;
        }
        .greeting {
            font-size: 18px;
            font-weight: 600;
            color: #1a1a1a;
            margin-bottom: 20px;
        }
        .message {
            font-size: 16px;
            color: #4a4a4a;
            margin-bottom: 30px;
            line-height: 1.8;
        }
        .order-info {
            background: #f9fafb;
            border-left: 4px solid #000000;
            padding: 20px;
            margin: 30px 0;
            border-radius: 4px;
        }
        .order-info-label {
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: #6b7280;
            margin-bottom: 8px;
            font-weight: 600;
        }
        .order-info-value {
            font-size: 20px;
            font-weight: 700;
            color: #000000;
        }
        .tracking-box {
            background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
            border: 2px solid #fbbf24;
            border-radius: 12px;
            padding: 30px;
            margin: 30px 0;
            text-align: center;
        }
        .tracking-label {
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: #92400e;
            margin-bottom: 12px;
            font-weight: 700;
        }
        .tracking-number {
            font-size: 24px;
            font-weight: 900;
            color: #000000;
            font-family: 'Courier New', monospace;
            letter-spacing: 0.1em;
            margin-bottom: 8px;
            word-break: break-all;
        }
        .carrier-info {
            font-size: 14px;
            color: #78350f;
            margin-top: 8px;
        }
        .cta-button {
            display: inline-block;
            background: #000000;
            color: #ffffff;
            padding: 14px 32px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            font-size: 16px;
            margin: 30px 0;
            transition: background 0.2s;
        }
        .cta-button:hover {
            background: #1a1a1a;
        }
        .info-section {
            background: #f9fafb;
            border-radius: 8px;
            padding: 20px;
            margin: 30px 0;
        }
        .info-title {
            font-size: 16px;
            font-weight: 700;
            color: #1a1a1a;
            margin-bottom: 12px;
        }
        .info-text {
            font-size: 14px;
            color: #4a4a4a;
            line-height: 1.8;
        }
        .footer {
            background: #1a1a1a;
            color: #ffffff;
            padding: 30px;
            text-align: center;
        }
        .footer-content {
            font-size: 14px;
            line-height: 1.8;
        }
        .footer-links {
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
        }
        .footer-links a {
            color: #ffffff;
            text-decoration: none;
            margin: 0 12px;
            font-size: 13px;
        }
        .footer-links a:hover {
            text-decoration: underline;
        }
        @media only screen and (max-width: 600px) {
            .content {
                padding: 30px 20px;
            }
            .tracking-number {
                font-size: 20px;
            }
        }
    </style>
</head>
<body>
    <div class="email-wrapper">
        <div class="header">
            <h1>MONICAN</h1>
            <p>E-Commerce Excellence</p>
        </div>
        
        <div class="content">
            <div class="greeting">
                Bonjour ${data.customerName},
            </div>
            
            <div class="message">
                Excellente nouvelle ! Votre commande a été expédiée et est en route vers vous.
            </div>
            
            <div class="order-info">
                <div class="order-info-label">Numéro de commande</div>
                <div class="order-info-value">${data.orderNumber}</div>
            </div>
            
            <div class="tracking-box">
                <div class="tracking-label">Numéro de suivi</div>
                <div class="tracking-number">${data.trackingNumber}</div>
                ${data.carrier ? `<div class="carrier-info">Transporteur: ${data.carrier}</div>` : ''}
            </div>
            
            <div style="text-align: center;">
                <a href="https://monican.shop/track-order?tracking=${encodeURIComponent(data.trackingNumber)}" class="cta-button">
                    Suivre mon colis
                </a>
            </div>
            
            <div class="info-section">
                <div class="info-title">📦 Prochaines étapes</div>
                <div class="info-text">
                    <p style="margin-bottom: 12px;">
                        <strong>1. Suivi en temps réel</strong><br>
                        Utilisez le numéro de suivi ci-dessus pour suivre l'emplacement de votre colis en temps réel sur le site du transporteur.
                    </p>
                    <p style="margin-bottom: 12px;">
                        <strong>2. Réception</strong><br>
                        Votre colis devrait arriver dans les prochains jours ouvrables. Assurez-vous qu'il y a quelqu'un pour le recevoir.
                    </p>
                    <p>
                        <strong>3. Questions ?</strong><br>
                        Si vous avez des questions ou des préoccupations concernant votre commande, notre équipe est là pour vous aider.
                    </p>
                </div>
            </div>
            
            <div class="message" style="margin-top: 30px; padding-top: 30px; border-top: 1px solid #e5e7eb;">
                Nous vous remercions de votre confiance et espérons que vous serez satisfait de votre achat.
                <br><br>
                Cordialement,<br>
                <strong>L'équipe Monican</strong>
            </div>
        </div>
        
        <div class="footer">
            <div class="footer-content">
                <p><strong>MONICAN</strong></p>
                <p>E-Commerce Excellence</p>
                <div class="footer-links">
                    <a href="${contactInfo?.siteUrl || 'https://monican.shop'}">www.monican.shop</a>
                    <a href="mailto:${contactInfo?.email || 'support@monican.shop'}">${contactInfo?.email || 'support@monican.shop'}</a>
                    <a href="tel:${contactInfo?.phone?.replace(/\D/g, '') || '17178801479'}">${contactInfo?.phone || '+1 717-880-1479'}</a>
                </div>
                <p style="margin-top: 20px; font-size: 12px; opacity: 0.7;">
                    © ${new Date().getFullYear()} Monican.shop. Tous droits réservés.
                </p>
            </div>
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
}, contactInfo?: ContactInfo): string {
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
    text += `Email : ${contactInfo?.email || 'support@monican.shop'}\n`;
    text += `Téléphone : ${contactInfo?.phone || '+1 717-880-1479'}\n`;
    text += `Site web : ${contactInfo?.siteUrl || 'https://monican.shop'}\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `© ${new Date().getFullYear()} Monican.shop. Tous droits réservés.\n`;

    return text;
}

/**
 * Template HTML pour les emails de panier abandonné
 */
function getAbandonedCartTemplate(data: {
    customerName?: string;
    items: Array<{ name: string; quantity: number; price: number; size?: string; image?: string }>;
    total: number;
    currency: string;
    recoveryUrl: string;
}, contactInfo?: ContactInfo): string {
    const formatCurrency = (amount: number) => {
        const locale = data.currency === 'USD' ? 'en-US' : data.currency === 'CAD' ? 'en-CA' : 'es-MX';
        return new Intl.NumberFormat(locale, { 
            style: 'currency', 
            currency: data.currency 
        }).format(amount);
    };

    const customerName = data.customerName || 'Cher client';
    const itemCount = data.items.reduce((sum, item) => sum + item.quantity, 0);

    return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Vous avez oublié quelque chose...</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb;">
    <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f9fafb;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    <!-- Header avec gradient -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #10B981 0%, #3B82F6 100%); padding: 40px 30px; text-align: center;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 800; line-height: 1.2;">
                                🛒 Vous avez oublié quelque chose !
                            </h1>
                        </td>
                    </tr>
                    
                    <!-- Contenu principal -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #111827;">
                                Bonjour ${customerName},
                            </p>
                            
                            <p style="margin: 0 0 30px; font-size: 16px; line-height: 1.6; color: #4b5563;">
                                Nous avons remarqué que vous avez laissé <strong style="color: #10B981;">${itemCount} article${itemCount > 1 ? 's' : ''}</strong> dans votre panier d'une valeur de <strong style="color: #10B981;">${formatCurrency(data.total)}</strong>.
                            </p>
                            
                            <p style="margin: 0 0 30px; font-size: 16px; line-height: 1.6; color: #4b5563;">
                                Ne manquez pas cette occasion ! Vos articles vous attendent. Finalisez votre commande maintenant et profitez de nos produits de qualité.
                            </p>
                            
                            <!-- Bouton CTA -->
                            <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 30px 0;">
                                <tr>
                                    <td align="center" style="padding: 0;">
                                        <a href="${data.recoveryUrl}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #10B981 0%, #059669 100%); color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 16px; box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3); transition: all 0.3s;">
                                            Récupérer mon panier →
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Liste des articles -->
                            <div style="background: #f9fafb; border-radius: 12px; padding: 24px; margin: 30px 0;">
                                <h2 style="margin: 0 0 20px; font-size: 18px; font-weight: 700; color: #111827;">
                                    Vos articles :
                                </h2>
                                ${data.items.map(item => `
                                    <div style="display: flex; align-items: center; padding: 16px 0; border-bottom: 1px solid #e5e7eb;">
                                        ${item.image ? `
                                            <img src="${item.image}" alt="${item.name}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px; margin-right: 16px;">
                                        ` : ''}
                                        <div style="flex: 1;">
                                            <p style="margin: 0 0 4px; font-size: 16px; font-weight: 600; color: #111827;">
                                                ${item.name}
                                            </p>
                                            ${item.size ? `<p style="margin: 0 0 4px; font-size: 14px; color: #6b7280;">Taille: ${item.size}</p>` : ''}
                                            <p style="margin: 0; font-size: 14px; color: #6b7280;">
                                                Quantité: ${item.quantity} × ${formatCurrency(item.price)}
                                            </p>
                                        </div>
                                        <div style="text-align: right;">
                                            <p style="margin: 0; font-size: 18px; font-weight: 700; color: #10B981;">
                                                ${formatCurrency(item.price * item.quantity)}
                                            </p>
                                        </div>
                                    </div>
                                `).join('')}
                                <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 20px; margin-top: 20px; border-top: 2px solid #e5e7eb;">
                                    <p style="margin: 0; font-size: 18px; font-weight: 700; color: #111827;">
                                        Total :
                                    </p>
                                    <p style="margin: 0; font-size: 24px; font-weight: 800; color: #10B981;">
                                        ${formatCurrency(data.total)}
                                    </p>
                                </div>
                            </div>
                            
                            <p style="margin: 30px 0 0; font-size: 14px; line-height: 1.6; color: #6b7280; text-align: center;">
                                ⏰ Cette offre est valable pendant 7 jours. Ne manquez pas cette occasion !
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                            <p style="margin: 0 0 10px; font-size: 14px; color: #6b7280;">
                                Des questions ? Contactez-nous à <a href="mailto:${contactInfo?.email || 'support@monican.shop'}" style="color: #10B981; text-decoration: none;">${contactInfo?.email || 'support@monican.shop'}</a>
                            </p>
                            <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                                © ${new Date().getFullYear()} Monican.shop. Tous droits réservés.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `.trim();
}

/**
 * Template texte pour les emails de panier abandonné
 */
function getAbandonedCartTextTemplate(data: {
    customerName?: string;
    items: Array<{ name: string; quantity: number; price: number; size?: string }>;
    total: number;
    currency: string;
    recoveryUrl: string;
}, contactInfo?: ContactInfo): string {
    const formatCurrency = (amount: number) => {
        const locale = data.currency === 'USD' ? 'en-US' : data.currency === 'CAD' ? 'en-CA' : 'es-MX';
        return new Intl.NumberFormat(locale, { 
            style: 'currency', 
            currency: data.currency 
        }).format(amount);
    };

    const customerName = data.customerName || 'Cher client';
    const itemCount = data.items.reduce((sum, item) => sum + item.quantity, 0);

    let text = `🛒 Vous avez oublié quelque chose !\n\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    text += `Bonjour ${customerName},\n\n`;
    text += `Nous avons remarqué que vous avez laissé ${itemCount} article${itemCount > 1 ? 's' : ''} dans votre panier d'une valeur de ${formatCurrency(data.total)}.\n\n`;
    text += `Ne manquez pas cette occasion ! Vos articles vous attendent.\n\n`;
    text += `Récupérez votre panier : ${data.recoveryUrl}\n\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    text += `VOS ARTICLES :\n\n`;
    
    data.items.forEach(item => {
        text += `• ${item.name}`;
        if (item.size) text += ` (Taille: ${item.size})`;
        text += ` - Quantité: ${item.quantity} × ${formatCurrency(item.price)} = ${formatCurrency(item.price * item.quantity)}\n`;
    });
    
    text += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    text += `TOTAL : ${formatCurrency(data.total)}\n\n`;
    text += `⏰ Cette offre est valable pendant 7 jours.\n\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    text += `Des questions ? Contactez-nous à ${contactInfo?.email || 'support@monican.shop'}\n\n`;
    text += `© ${new Date().getFullYear()} Monican.shop. Tous droits réservés.\n`;

    return text;
}

/**
 * Template HTML pour l'email de bienvenue newsletter
 */
function getWelcomeEmailTemplate(data: {
  subscriberName: string;
  email: string;
}, contactInfo?: ContactInfo): string {
  const siteUrl = contactInfo?.siteUrl || 'https://monican.shop';
  
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bienvenue chez Monican !</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb;">
    <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f9fafb;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    <!-- Header avec gradient -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #10B981 0%, #3B82F6 100%); padding: 50px 30px; text-align: center;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 800; line-height: 1.2;">
                                🎉 Bienvenue chez Monican !
                            </h1>
                            <p style="margin: 15px 0 0; color: #ffffff; font-size: 18px; opacity: 0.95;">
                                Merci de nous rejoindre
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Contenu principal -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <p style="margin: 0 0 20px; font-size: 18px; line-height: 1.6; color: #111827; font-weight: 600;">
                                Bonjour ${data.subscriberName},
                            </p>
                            
                            <p style="margin: 0 0 25px; font-size: 16px; line-height: 1.8; color: #4b5563;">
                                Nous sommes ravis de vous accueillir dans la communauté <strong style="color: #10B981;">Monican</strong> ! 🎊
                            </p>
                            
                            <p style="margin: 0 0 25px; font-size: 16px; line-height: 1.8; color: #4b5563;">
                                En vous abonnant à notre newsletter, vous avez maintenant accès à :
                            </p>
                            
                            <ul style="margin: 0 0 30px; padding-left: 20px; color: #4b5563; font-size: 16px; line-height: 1.8;">
                                <li style="margin-bottom: 12px;">✨ <strong>Offres exclusives</strong> réservées aux membres</li>
                                <li style="margin-bottom: 12px;">🆕 <strong>Nouveautés</strong> en avant-première</li>
                                <li style="margin-bottom: 12px;">💡 <strong>Conseils de style</strong> et tendances mode</li>
                                <li style="margin-bottom: 12px;">🎁 <strong>Codes promo</strong> et réductions spéciales</li>
                            </ul>
                            
                            <!-- Boutons CTA -->
                            <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 35px 0;">
                                <tr>
                                    <td align="center" style="padding: 0 0 15px;">
                                        <a href="${siteUrl}/catalog" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #10B981 0%, #059669 100%); color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 16px; box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);">
                                            🛍️ Découvrir notre catalogue
                                        </a>
                                    </td>
                                </tr>
                                <tr>
                                    <td align="center" style="padding: 0;">
                                        <a href="${siteUrl}/about" style="display: inline-block; padding: 14px 35px; background: transparent; color: #10B981; text-decoration: none; border: 2px solid #10B981; border-radius: 12px; font-weight: 600; font-size: 15px;">
                                            📖 En savoir plus sur nous
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            
                            <div style="background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%); border-radius: 12px; padding: 25px; margin: 30px 0; border-left: 4px solid #10B981;">
                                <p style="margin: 0; font-size: 15px; line-height: 1.7; color: #065f46;">
                                    <strong style="color: #10B981;">💎 Offre spéciale pour les nouveaux membres :</strong><br>
                                    Profitez de <strong>10% de réduction</strong> sur votre première commande avec le code <strong style="background: #ffffff; padding: 4px 8px; border-radius: 6px; color: #10B981;">WELCOME10</strong>
                                </p>
                            </div>
                            
                            <p style="margin: 30px 0 0; font-size: 14px; line-height: 1.6; color: #6b7280; text-align: center;">
                                Restez connecté avec nous sur les réseaux sociaux pour ne rien manquer !
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                            <div style="margin-bottom: 20px;">
                                <a href="${siteUrl}" style="display: inline-block; margin: 0 10px; color: #10B981; text-decoration: none; font-weight: 600;">Accueil</a>
                                <span style="color: #d1d5db;">|</span>
                                <a href="${siteUrl}/catalog" style="display: inline-block; margin: 0 10px; color: #10B981; text-decoration: none; font-weight: 600;">Catalogue</a>
                                <span style="color: #d1d5db;">|</span>
                                <a href="${siteUrl}/contact" style="display: inline-block; margin: 0 10px; color: #10B981; text-decoration: none; font-weight: 600;">Contact</a>
                            </div>
                            <p style="margin: 0 0 10px; font-size: 14px; color: #6b7280;">
                                Des questions ? Contactez-nous à <a href="mailto:${contactInfo?.email || 'support@monican.shop'}" style="color: #10B981; text-decoration: none;">${contactInfo?.email || 'support@monican.shop'}</a>
                            </p>
                            <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                                © ${new Date().getFullYear()} Monican.shop. Tous droits réservés.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `.trim();
}

/**
 * Template texte pour l'email de bienvenue
 */
function getWelcomeEmailTextTemplate(data: {
  subscriberName: string;
  email: string;
}, contactInfo?: ContactInfo): string {
  const siteUrl = contactInfo?.siteUrl || 'https://monican.shop';
  
  let text = `🎉 BIENVENUE CHEZ MONICAN !\n\n`;
  text += `Bonjour ${data.subscriberName},\n\n`;
  text += `Nous sommes ravis de vous accueillir dans la communauté Monican ! 🎊\n\n`;
  text += `En vous abonnant à notre newsletter, vous avez maintenant accès à :\n\n`;
  text += `✨ Offres exclusives réservées aux membres\n`;
  text += `🆕 Nouveautés en avant-première\n`;
  text += `💡 Conseils de style et tendances mode\n`;
  text += `🎁 Codes promo et réductions spéciales\n\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  text += `💎 OFFRE SPÉCIALE POUR LES NOUVEAUX MEMBRES :\n`;
  text += `Profitez de 10% de réduction sur votre première commande avec le code WELCOME10\n\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  text += `🛍️ Découvrir notre catalogue : ${siteUrl}/catalog\n`;
  text += `📖 En savoir plus sur nous : ${siteUrl}/about\n\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  text += `Des questions ? Contactez-nous à ${contactInfo?.email || 'support@monican.shop'}\n\n`;
  text += `© ${new Date().getFullYear()} Monican.shop. Tous droits réservés.\n`;

  return text;
}

/**
 * Envoie un email de bienvenue pour la newsletter
 */
export async function sendWelcomeEmail(data: {
  email: string;
  subscriberName?: string;
}): Promise<EmailResult> {
  const contactInfo = await getContactInfoServer('fr');
  const subscriberName = data.subscriberName || data.email.split('@')[0];
  
  const html = getWelcomeEmailTemplate({ subscriberName, email: data.email }, contactInfo);
  const text = getWelcomeEmailTextTemplate({ subscriberName, email: data.email }, contactInfo);
  
  return sendEmail({
    to: data.email,
    subject: '🎉 Bienvenue chez Monican - Offre spéciale pour vous !',
    html,
    text,
  });
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

        // Récupérer les informations de contact depuis la base de données
        let contactInfo: ContactInfo | undefined;
        try {
            contactInfo = await getContactInfoServer('fr');
        } catch (error) {
            console.error('Error fetching contact info for email:', error);
            // Continuer avec les valeurs par défaut
        }

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
                    }, contactInfo);
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
                        }, contactInfo);
                    }
                    break;
                case 'shipping_notification':
                    html = getShippingNotificationTemplate(options.data as {
                        orderNumber: string;
                        customerName: string;
                        trackingNumber: string;
                        carrier?: string;
                    }, contactInfo);
                    break;
                case 'abandoned_cart':
                    html = getAbandonedCartTemplate(options.data as {
                        customerName?: string;
                        items: Array<{ name: string; quantity: number; price: number; size?: string; image?: string }>;
                        total: number;
                        currency: string;
                        recoveryUrl: string;
                    }, contactInfo);
                    if (!text) {
                        text = getAbandonedCartTextTemplate(options.data as {
                            customerName?: string;
                            items: Array<{ name: string; quantity: number; price: number; size?: string }>;
                            total: number;
                            currency: string;
                            recoveryUrl: string;
                        }, contactInfo);
                    }
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

/**
 * Template HTML pour l'email de nouveau produit
 */
function getNewProductEmailTemplate(data: {
  productName: string;
  productDescription: string;
  productPrice: number;
  productImage?: string;
  productUrl: string;
  currency: string;
}, contactInfo?: ContactInfo): string {
  const siteUrl = contactInfo?.siteUrl || 'https://monican.shop';
  const formatCurrency = (amount: number) => {
    const locale = data.currency === 'USD' ? 'en-US' : data.currency === 'CAD' ? 'en-CA' : 'es-MX';
    return new Intl.NumberFormat(locale, { 
      style: 'currency', 
      currency: data.currency 
    }).format(amount);
  };
  
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nouveau produit disponible !</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb;">
    <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f9fafb;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #10B981 0%, #3B82F6 100%); padding: 40px 30px; text-align: center;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 800; line-height: 1.2;">
                                🆕 Nouveau produit disponible !
                            </h1>
                        </td>
                    </tr>
                    
                    <!-- Contenu -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <p style="margin: 0 0 25px; font-size: 18px; line-height: 1.6; color: #111827; font-weight: 600;">
                                Bonne nouvelle ! 🎉
                            </p>
                            
                            <p style="margin: 0 0 30px; font-size: 16px; line-height: 1.8; color: #4b5563;">
                                Nous avons le plaisir de vous présenter notre nouveau produit :
                            </p>
                            
                            <!-- Produit -->
                            <div style="background: #f9fafb; border-radius: 12px; padding: 25px; margin: 30px 0; border: 1px solid #e5e7eb;">
                                ${data.productImage ? `
                                    <img src="${data.productImage}" alt="${data.productName}" style="width: 100%; max-width: 400px; height: auto; border-radius: 8px; margin-bottom: 20px; display: block; margin-left: auto; margin-right: auto;">
                                ` : ''}
                                <h2 style="margin: 0 0 15px; font-size: 24px; font-weight: 700; color: #111827; text-align: center;">
                                    ${data.productName}
                                </h2>
                                <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.7; color: #4b5563; text-align: center;">
                                    ${data.productDescription}
                                </p>
                                <div style="text-align: center; margin: 25px 0;">
                                    <span style="font-size: 28px; font-weight: 800; color: #10B981;">
                                        ${formatCurrency(data.productPrice)}
                                    </span>
                                </div>
                                <div style="text-align: center; margin-top: 25px;">
                                    <a href="${data.productUrl}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #10B981 0%, #059669 100%); color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 16px; box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);">
                                        Voir le produit →
                                    </a>
                                </div>
                            </div>
                            
                            <p style="margin: 30px 0 0; font-size: 14px; line-height: 1.6; color: #6b7280; text-align: center;">
                                Ne manquez pas cette occasion ! Quantités limitées disponibles.
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                            <p style="margin: 0 0 10px; font-size: 14px; color: #6b7280;">
                                Des questions ? Contactez-nous à <a href="mailto:${contactInfo?.email || 'support@monican.shop'}" style="color: #10B981; text-decoration: none;">${contactInfo?.email || 'support@monican.shop'}</a>
                            </p>
                            <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                                © ${new Date().getFullYear()} Monican.shop. Tous droits réservés.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `.trim();
}

/**
 * Envoie un email de nouveau produit à tous les abonnés
 */
export async function sendNewProductNotification(productData: {
  id: string;
  name: string;
  description: string;
  price: number;
  image?: string;
  currency?: string;
}): Promise<EmailResult> {
  const contactInfo = await getContactInfoServer('fr');
  const siteUrl = contactInfo?.siteUrl || 'https://monican.shop';
  const productUrl = `${siteUrl}/product/${productData.id}`;
  
  const html = getNewProductEmailTemplate({
    productName: productData.name,
    productDescription: productData.description,
    productPrice: productData.price,
    productImage: productData.image,
    productUrl,
    currency: productData.currency || 'USD',
  }, contactInfo);
  
  // Récupérer tous les abonnés actifs
  const { supabaseAdmin } = await import('@/lib/supabase');
  const { data: subscribers, error } = await supabaseAdmin
    .from('newsletter_subscribers')
    .select('email')
    .eq('status', 'active');
  
  if (error || !subscribers || subscribers.length === 0) {
    console.error('Error fetching subscribers:', error);
    return {
      success: false,
      error: 'Aucun abonné trouvé',
    };
  }
  
  // Envoyer l'email à tous les abonnés
  const emailPromises = subscribers.map(subscriber =>
    sendEmail({
      to: subscriber.email,
      subject: `🆕 Nouveau produit : ${productData.name}`,
      html,
    })
  );
  
  const results = await Promise.allSettled(emailPromises);
  const successCount = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
  
  return {
    success: true,
    messageId: `sent-to-${successCount}-subscribers`,
  };
}
