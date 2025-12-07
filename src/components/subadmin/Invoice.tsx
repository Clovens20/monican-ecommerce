'use client';

import Image from 'next/image';
import { Order } from '@/lib/types';
import styles from './Invoice.module.css';

interface InvoiceProps {
    order: Order;
}

export default function Invoice({ order }: InvoiceProps) {
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('fr-FR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatCurrency = (amount: number, currency: string) => {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: currency
        }).format(amount);
    };

    const getCountryName = (country: string) => {
        const countries: { [key: string]: string } = {
            'US': 'États-Unis',
            'CA': 'Canada',
            'MX': 'Mexique',
            'FR': 'France',
            'UK': 'Royaume-Uni',
            'DE': 'Allemagne',
            'ES': 'Espagne',
            'IT': 'Italie'
        };
        return countries[country] || country;
    };

    const calculateItemTotal = (price: number, quantity: number) => {
        return price * quantity;
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
                            <div className={styles.companyTagline}>E-Commerce Excellence Mondiale</div>
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
                        <div className={styles.invoiceTitle}>FACTURE</div>
                        <div className={styles.invoiceNumber}>N° {order.id}</div>
                        <div className={styles.metadataGrid}>
                            <div className={styles.metadataItem}>
                                <div className={styles.metadataLabel}>Date d'émission</div>
                                <div className={styles.metadataValue}>{formatDate(order.date)}</div>
                            </div>
                            {order.trackingNumber && (
                                <div className={styles.metadataItem}>
                                    <div className={styles.metadataLabel}>Suivi</div>
                                    <div className={styles.metadataValue}>{order.trackingNumber}</div>
                                </div>
                            )}
                            <div className={styles.metadataItem}>
                                <div className={styles.metadataLabel}>Statut</div>
                                <div className={styles.statusPaid}>
                                    <span className={styles.statusIcon}>✓</span>
                                    PAYÉ
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
                    INFORMATIONS CLIENT
                </div>
                <div className={styles.customerCard}>
                    <div className={styles.customerHeader}>
                        <div className={styles.customerName}>{order.customerName}</div>
                        <div className={styles.customerBadge}>Client Privilégié</div>
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
                            Adresse de Livraison
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
                    ARTICLES COMMANDÉS
                </div>
                <div className={styles.tableWrapper}>
                    <table className={styles.productsTable}>
                        <thead>
                            <tr>
                                <th className={styles.thProduct}>Produit</th>
                                <th className={styles.thCenter}>Taille</th>
                                <th className={styles.thCenter}>Qté</th>
                                <th className={styles.thRight}>Prix Unit.</th>
                                <th className={styles.thRight}>Total</th>
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
                    <div className={styles.totalsTitle}>RÉCAPITULATIF</div>
                    <div className={styles.totalsGrid}>
                        <div className={styles.totalRow}>
                            <span className={styles.totalLabel}>Sous-total</span>
                            <span className={styles.totalAmount}>{formatCurrency(order.subtotal, order.currency)}</span>
                        </div>
                        <div className={styles.totalRow}>
                            <span className={styles.totalLabel}>
                                <span className={styles.labelIcon}>🚚</span>
                                Frais de livraison
                            </span>
                            <span className={styles.totalAmount}>{formatCurrency(order.shippingCost, order.currency)}</span>
                        </div>
                        <div className={styles.totalRow}>
                            <span className={styles.totalLabel}>
                                <span className={styles.labelIcon}>💼</span>
                                Taxes
                            </span>
                            <span className={styles.totalAmount}>{formatCurrency(order.tax, order.currency)}</span>
                        </div>
                        <div className={styles.totalDivider}></div>
                        <div className={styles.grandTotalRow}>
                            <span className={styles.grandTotalLabel}>TOTAL À PAYER</span>
                            <span className={styles.grandTotalAmount}>
                                {formatCurrency(order.total, order.currency)}
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
                        INFORMATIONS DE PAIEMENT
                    </div>
                    <div className={styles.paymentDetails}>
                        <div className={styles.paymentRow}>
                            <span className={styles.paymentLabel}>Méthode de paiement</span>
                            <span className={styles.paymentValue}>{order.paymentMethod}</span>
                        </div>
                        <div className={styles.paymentRow}>
                            <span className={styles.paymentLabel}>Statut du paiement</span>
                            <span className={styles.paymentStatus}>
                                <span className={styles.statusDot}></span>
                                Paiement confirmé
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
                            <div className={styles.thankYouTitle}>Merci pour votre confiance !</div>
                            <div className={styles.thankYouSubtext}>
                                Votre satisfaction est notre priorité. Pour toute question, notre équipe est à votre disposition.
                            </div>
                        </div>
                    </div>
                    <div className={styles.footerInfo}>
                        <div className={styles.footerNote}>
                            📄 Cette facture doit être conservée avec le colis
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