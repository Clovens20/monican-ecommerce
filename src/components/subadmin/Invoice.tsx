'use client';

import Image from 'next/image';
import { Order } from '@/lib/types';
import styles from './Invoice.module.css';

interface InvoiceProps {
    order: Order;
}

// Dictionnaire de traductions
const translations = {
    en: {
        invoice: 'INVOICE',
        issueDate: 'Issue Date',
        tracking: 'Tracking',
        status: 'Status',
        paid: 'PAID',
        customerInfo: 'CUSTOMER INFORMATION',
        privilegedCustomer: 'Valued Customer',
        shippingAddress: 'Shipping Address',
        orderedItems: 'ORDERED ITEMS',
        product: 'Product',
        size: 'Size',
        qty: 'Qty',
        unitPrice: 'Unit Price',
        total: 'Total',
        summary: 'SUMMARY',
        subtotal: 'Subtotal (Products)',
        shippingCost: 'Shipping Cost',
        taxes: 'Taxes',
        grandTotal: 'TOTAL PAID BY CUSTOMER',
        paymentInfo: 'PAYMENT INFORMATION',
        paymentMethod: 'Payment Method',
        paymentStatus: 'Payment Status',
        paymentConfirmed: 'Payment Confirmed',
        thankYouTitle: 'Thank you for your trust!',
        thankYouText: 'Your satisfaction is our priority. For any questions, our team is at your disposal.',
        footerNote: '📄 This invoice must be kept with the package',
        tagline: 'E-Commerce Excellence Worldwide'
    },
    fr: {
        invoice: 'FACTURE',
        issueDate: 'Date d\'émission',
        tracking: 'Suivi',
        status: 'Statut',
        paid: 'PAYÉ',
        customerInfo: 'INFORMATIONS CLIENT',
        privilegedCustomer: 'Client Privilégié',
        shippingAddress: 'Adresse de Livraison',
        orderedItems: 'ARTICLES COMMANDÉS',
        product: 'Produit',
        size: 'Taille',
        qty: 'Qté',
        unitPrice: 'Prix Unit.',
        total: 'Total',
        summary: 'RÉCAPITULATIF',
        subtotal: 'Sous-total (Produits)',
        shippingCost: 'Frais de livraison',
        taxes: 'Taxes',
        grandTotal: 'TOTAL PAYÉ PAR LE CLIENT',
        paymentInfo: 'INFORMATIONS DE PAIEMENT',
        paymentMethod: 'Méthode de paiement',
        paymentStatus: 'Statut du paiement',
        paymentConfirmed: 'Paiement confirmé',
        thankYouTitle: 'Merci pour votre confiance !',
        thankYouText: 'Votre satisfaction est notre priorité. Pour toute question, notre équipe est à votre disposition.',
        footerNote: '📄 Cette facture doit être conservée avec le colis',
        tagline: 'E-Commerce Excellence Mondiale'
    },
    es: {
        invoice: 'FACTURA',
        issueDate: 'Fecha de emisión',
        tracking: 'Seguimiento',
        status: 'Estado',
        paid: 'PAGADO',
        customerInfo: 'INFORMACIÓN DEL CLIENTE',
        privilegedCustomer: 'Cliente Privilegiado',
        shippingAddress: 'Dirección de Envío',
        orderedItems: 'ARTÍCULOS PEDIDOS',
        product: 'Producto',
        size: 'Talla',
        qty: 'Cant.',
        unitPrice: 'Precio Unit.',
        total: 'Total',
        summary: 'RESUMEN',
        subtotal: 'Subtotal (Productos)',
        shippingCost: 'Gastos de envío',
        taxes: 'Impuestos',
        grandTotal: 'TOTAL PAGADO POR EL CLIENTE',
        paymentInfo: 'INFORMACIÓN DE PAGO',
        paymentMethod: 'Método de pago',
        paymentStatus: 'Estado del pago',
        paymentConfirmed: 'Pago confirmado',
        thankYouTitle: '¡Gracias por su confianza!',
        thankYouText: 'Su satisfacción es nuestra prioridad. Para cualquier pregunta, nuestro equipo está a su disposición.',
        footerNote: '📄 Esta factura debe conservarse con el paquete',
        tagline: 'Excelencia en E-Commerce Mundial'
    },
    de: {
        invoice: 'RECHNUNG',
        issueDate: 'Ausstellungsdatum',
        tracking: 'Verfolgung',
        status: 'Status',
        paid: 'BEZAHLT',
        customerInfo: 'KUNDENINFORMATIONEN',
        privilegedCustomer: 'Bevorzugter Kunde',
        shippingAddress: 'Lieferadresse',
        orderedItems: 'BESTELLTE ARTIKEL',
        product: 'Produkt',
        size: 'Größe',
        qty: 'Menge',
        unitPrice: 'Stückpreis',
        total: 'Gesamt',
        summary: 'ZUSAMMENFASSUNG',
        subtotal: 'Zwischensumme (Produkte)',
        shippingCost: 'Versandkosten',
        taxes: 'Steuern',
        grandTotal: 'VOM KUNDEN GEZAHLTER GESAMTBETRAG',
        paymentInfo: 'ZAHLUNGSINFORMATIONEN',
        paymentMethod: 'Zahlungsmethode',
        paymentStatus: 'Zahlungsstatus',
        paymentConfirmed: 'Zahlung bestätigt',
        thankYouTitle: 'Vielen Dank für Ihr Vertrauen!',
        thankYouText: 'Ihre Zufriedenheit ist unsere Priorität. Bei Fragen steht Ihnen unser Team zur Verfügung.',
        footerNote: '📄 Diese Rechnung muss mit dem Paket aufbewahrt werden',
        tagline: 'E-Commerce Exzellenz Weltweit'
    },
    it: {
        invoice: 'FATTURA',
        issueDate: 'Data di emissione',
        tracking: 'Tracciamento',
        status: 'Stato',
        paid: 'PAGATO',
        customerInfo: 'INFORMAZIONI CLIENTE',
        privilegedCustomer: 'Cliente Privilegiato',
        shippingAddress: 'Indirizzo di Spedizione',
        orderedItems: 'ARTICOLI ORDINATI',
        product: 'Prodotto',
        size: 'Taglia',
        qty: 'Qtà',
        unitPrice: 'Prezzo Unit.',
        total: 'Totale',
        summary: 'RIEPILOGO',
        subtotal: 'Subtotale (Prodotti)',
        shippingCost: 'Spese di spedizione',
        taxes: 'Tasse',
        grandTotal: 'TOTALE PAGATO DAL CLIENTE',
        paymentInfo: 'INFORMAZIONI DI PAGAMENTO',
        paymentMethod: 'Metodo di pagamento',
        paymentStatus: 'Stato del pagamento',
        paymentConfirmed: 'Pagamento confermato',
        thankYouTitle: 'Grazie per la vostra fiducia!',
        thankYouText: 'La vostra soddisfazione è la nostra priorità. Per qualsiasi domanda, il nostro team è a vostra disposizione.',
        footerNote: '📄 Questa fattura deve essere conservata con il pacco',
        tagline: 'Eccellenza E-Commerce Mondiale'
    }
};

// Noms de pays traduits
const countryNames = {
    en: {
        'US': 'United States',
        'CA': 'Canada',
        'MX': 'Mexico',
        'FR': 'France',
        'UK': 'United Kingdom',
        'DE': 'Germany',
        'ES': 'Spain',
        'IT': 'Italy'
    },
    fr: {
        'US': 'États-Unis',
        'CA': 'Canada',
        'MX': 'Mexique',
        'FR': 'France',
        'UK': 'Royaume-Uni',
        'DE': 'Allemagne',
        'ES': 'Espagne',
        'IT': 'Italie'
    },
    es: {
        'US': 'Estados Unidos',
        'CA': 'Canadá',
        'MX': 'México',
        'FR': 'Francia',
        'UK': 'Reino Unido',
        'DE': 'Alemania',
        'ES': 'España',
        'IT': 'Italia'
    },
    de: {
        'US': 'Vereinigte Staaten',
        'CA': 'Kanada',
        'MX': 'Mexiko',
        'FR': 'Frankreich',
        'UK': 'Vereinigtes Königreich',
        'DE': 'Deutschland',
        'ES': 'Spanien',
        'IT': 'Italien'
    },
    it: {
        'US': 'Stati Uniti',
        'CA': 'Canada',
        'MX': 'Messico',
        'FR': 'Francia',
        'UK': 'Regno Unito',
        'DE': 'Germania',
        'ES': 'Spagna',
        'IT': 'Italia'
    }
};

export default function Invoice({ order }: InvoiceProps) {
    // Déterminer la langue à partir de l'ordre (par défaut 'en')
    const language = (order.language || 'en') as keyof typeof translations;
    const t = translations[language] || translations.en;
    const countries = countryNames[language] || countryNames.en;

    const formatDate = (dateString: string) => {
        const locales = {
            en: 'en-US',
            fr: 'fr-FR',
            es: 'es-ES',
            de: 'de-DE',
            it: 'it-IT'
        };
        
        return new Date(dateString).toLocaleString(locales[language] || 'en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatCurrency = (amount: number, currency: string) => {
        const locales = {
            en: 'en-US',
            fr: 'fr-FR',
            es: 'es-ES',
            de: 'de-DE',
            it: 'it-IT'
        };
        
        return new Intl.NumberFormat(locales[language] || 'en-US', {
            style: 'currency',
            currency: currency
        }).format(amount);
    };

    const getCountryName = (country: string) => {
        return (countries as Record<string, string>)[country] || country.toUpperCase();
    };

    const calculateItemTotal = (price: number, quantity: number) => {
        return price * quantity;
    };

    const calculateGrandTotal = () => {
        const subtotal = order.subtotal || 0;
        const shipping = order.shippingCost || 0;
        const tax = order.tax || 0;
        
        const calculatedTotal = subtotal + shipping + tax;
        
        if (order.subtotal !== undefined && order.subtotal !== null && 
            order.shippingCost !== undefined && order.shippingCost !== null &&
            order.tax !== undefined && order.tax !== null) {
            return calculatedTotal;
        }
        
        if (calculatedTotal > 0) {
            return calculatedTotal;
        }
        
        return order.total || 0;
    };

    return (
        <div className={styles.invoice}>
            {/* En-tête premium avec dégradé */}
            <div className={styles.invoiceHeader}>
                <div className={styles.headerGradient}></div>
                <div className={styles.headerContent}>
                    <div className={styles.companySection}>
                        <div className={styles.logoWrapper}>
                            <div className={styles.logoContainer}>
                                <Image
                                    src="/logo.png"
                                    alt="MONICAN Logo"
                                    width={80}
                                    height={80}
                                    className={styles.logoImage}
                                    priority
                                />
                            </div>
                            <div className={styles.logoShadow}></div>
                        </div>
                        <div className={styles.companyDetails}>
                            <div className={styles.companyName}>MONICAN</div>
                            <div className={styles.companyTagline}>{t.tagline}</div>
                            <div className={styles.companyAddress}>
                                <div className={styles.addressLine}>
                                    <span className={styles.icon}>📧</span>
                                    support@monican.shop
                                </div>
                                <div className={styles.addressLine}>
                                    <span className={styles.icon}>🌐</span>
                                    www.monican.shop
                                </div>
                                <div className={styles.addressLine}>
                                    <span className={styles.icon}>📞</span>
                                    +1 717-880-1479
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className={styles.invoiceMetadata}>
                        <div className={styles.invoiceTitle}>{t.invoice}</div>
                        <div className={styles.invoiceNumber}>N° {order.orderNumber || order.id}</div>
                        <div className={styles.metadataGrid}>
                            <div className={styles.metadataItem}>
                                <div className={styles.metadataLabel}>{t.issueDate}</div>
                                <div className={styles.metadataValue}>{formatDate(order.date)}</div>
                            </div>
                            {order.trackingNumber && (
                                <div className={styles.metadataItem}>
                                    <div className={styles.metadataLabel}>{t.tracking}</div>
                                    <div className={styles.metadataValue}>{order.trackingNumber}</div>
                                </div>
                            )}
                            <div className={styles.metadataItem}>
                                <div className={styles.metadataLabel}>{t.status}</div>
                                <div className={styles.statusPaid}>
                                    <span className={styles.statusIcon}>✓</span>
                                    {t.paid}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Informations client avec design carte */}
            <div className={styles.customerSection}>
                <div className={styles.sectionTitle}>
                    <span className={styles.titleIcon}>👤</span>
                    {t.customerInfo}
                </div>
                <div className={styles.customerCard}>
                    <div className={styles.customerHeader}>
                        <div className={styles.customerName}>{order.customerName}</div>
                        <div className={styles.customerBadge}>{t.privilegedCustomer}</div>
                    </div>
                    <div className={styles.customerInfo}>
                        <div className={styles.infoRow}>
                            <span className={styles.infoIcon}>📧</span>
                            <span className={styles.infoText}>{order.customerEmail}</span>
                        </div>
                        {order.customerPhone && (
                            <div className={styles.infoRow}>
                                <span className={styles.infoIcon}>📞</span>
                                <span className={styles.infoText}>{order.customerPhone}</span>
                            </div>
                        )}
                    </div>
                    <div className={styles.shippingBlock}>
                        <div className={styles.shippingTitle}>
                            <span className={styles.shippingIcon}>📦</span>
                            {t.shippingAddress}
                        </div>
                        <div className={styles.shippingAddress}>
                            <div>{order.shippingAddress.street}</div>
                            <div>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zip}</div>
                            <div className={styles.country}>{getCountryName(order.shippingAddress.country)}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tableau des produits moderne */}
            <div className={styles.productsSection}>
                <div className={styles.sectionTitle}>
                    <span className={styles.titleIcon}>🛍️</span>
                    {t.orderedItems}
                </div>
                <div className={styles.tableWrapper}>
                    <table className={styles.productsTable}>
                        <thead>
                            <tr>
                                <th className={styles.thProduct}>{t.product}</th>
                                <th className={styles.thCenter}>{t.size}</th>
                                <th className={styles.thCenter}>{t.qty}</th>
                                <th className={styles.thRight}>{t.unitPrice}</th>
                                <th className={styles.thRight}>{t.total}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {order.items.map((item, index) => (
                                <tr key={item.id} className={index % 2 === 0 ? styles.evenRow : styles.oddRow}>
                                    <td className={styles.productCell}>
                                        <div className={styles.productInfo}>
                                            <div className={styles.productName}>{item.name}</div>
                                            <div className={styles.productSku}>SKU: {item.productId}</div>
                                        </div>
                                    </td>
                                    <td className={styles.centerCell}>
                                        <div className={styles.sizeBadge}>{item.size}</div>
                                    </td>
                                    <td className={styles.centerCell}>
                                        <div className={styles.quantityBadge}>×{item.quantity}</div>
                                    </td>
                                    <td className={styles.rightCell}>
                                        {formatCurrency(item.price, order.currency)}
                                    </td>
                                    <td className={styles.rightCell}>
                                        <div className={styles.totalCell}>
                                            {formatCurrency(calculateItemTotal(item.price, item.quantity), order.currency)}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Totaux avec design premium */}
            <div className={styles.totalsSection}>
                <div className={styles.totalsCard}>
                    <div className={styles.totalsTitle}>{t.summary}</div>
                    <div className={styles.totalsGrid}>
                        <div className={styles.totalRow}>
                            <span className={styles.totalLabel}>{t.subtotal}</span>
                            <span className={styles.totalAmount}>{formatCurrency(order.subtotal || 0, order.currency)}</span>
                        </div>
                        <div className={styles.totalRow}>
                            <span className={styles.totalLabel}>
                                <span className={styles.labelIcon}>🚚</span>
                                {t.shippingCost}
                            </span>
                            <span className={styles.totalAmount}>{formatCurrency(order.shippingCost || 0, order.currency)}</span>
                        </div>
                        <div className={styles.totalRow}>
                            <span className={styles.totalLabel}>
                                <span className={styles.labelIcon}>💼</span>
                                {t.taxes}
                            </span>
                            <span className={styles.totalAmount}>{formatCurrency(order.tax || 0, order.currency)}</span>
                        </div>
                        <div className={styles.totalDivider}></div>
                        <div className={styles.grandTotalRow}>
                            <span className={styles.grandTotalLabel}>{t.grandTotal}</span>
                            <span className={styles.grandTotalAmount}>
                                {formatCurrency(calculateGrandTotal(), order.currency)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Informations de paiement */}
            <div className={styles.paymentSection}>
                <div className={styles.paymentCard}>
                    <div className={styles.paymentHeader}>
                        <span className={styles.paymentIcon}>💳</span>
                        {t.paymentInfo}
                    </div>
                    <div className={styles.paymentDetails}>
                        <div className={styles.paymentRow}>
                            <span className={styles.paymentLabel}>{t.paymentMethod}</span>
                            <span className={styles.paymentValue}>{order.paymentMethod}</span>
                        </div>
                        <div className={styles.paymentRow}>
                            <span className={styles.paymentLabel}>{t.paymentStatus}</span>
                            <span className={styles.paymentStatus}>
                                <span className={styles.statusDot}></span>
                                {t.paymentConfirmed}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Pied de page professionnel */}
            <div className={styles.invoiceFooter}>
                <div className={styles.footerDivider}></div>
                <div className={styles.footerContent}>
                    <div className={styles.thankYouMessage}>
                        <div className={styles.thankYouIcon}>🎉</div>
                        <div className={styles.thankYouText}>
                            <div className={styles.thankYouTitle}>{t.thankYouTitle}</div>
                            <div className={styles.thankYouSubtext}>
                                {t.thankYouText}
                            </div>
                        </div>
                    </div>
                    <div className={styles.footerInfo}>
                        <div className={styles.footerNote}>
                            {t.footerNote}
                        </div>
                        <div className={styles.footerLinks}>
                            <span>support@monican.shop</span>
                            <span className={styles.separator}>•</span>
                            <span>www.monican.shop</span>
                            <span className={styles.separator}>•</span>
                            <span>+1 717-880-1479</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}