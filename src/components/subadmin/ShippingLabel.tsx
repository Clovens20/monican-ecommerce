'use client';

import Image from 'next/image';
import { Order } from '@/lib/types';
import styles from './ShippingLabel.module.css';

interface ShippingLabelProps {
    order: Order;
}

export default function ShippingLabel({ order }: ShippingLabelProps) {
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const getCountryName = (country: string) => {
        const countries: { [key: string]: string } = {
            'US': 'ÉTATS-UNIS',
            'CA': 'CANADA',
            'MX': 'MEXIQUE',
            'FR': 'FRANCE',
            'UK': 'ROYAUME-UNI',
            'DE': 'ALLEMAGNE',
            'ES': 'ESPAGNE',
            'IT': 'ITALIE'
        };
        return countries[country] || country.toUpperCase();
    };

    const getShippingPriority = () => {
        // Logique pour déterminer la priorité d'expédition
        const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
        return itemCount > 5 ? 'PRIORITAIRE' : 'STANDARD';
    };

    return (
        <div className={styles.shippingLabel}>
            {/* En-tête avec branding fort */}
            <div className={styles.labelHeader}>
                <div className={styles.brandSection}>
                    <div className={styles.logoContainer}>
                        <div className={styles.logoWrapper}>
                            <Image
                                src="/logo.png"
                                alt="MONICAN Logo"
                                width={60}
                                height={60}
                                className={styles.logoImage}
                                priority
                            />
                        </div>
                    </div>
                    <div className={styles.companyInfo}>
                        <div className={styles.companyName}>MONICAN</div>
                        <div className={styles.tagline}>E-Commerce Excellence</div>
                    </div>
                </div>
                <div className={styles.priorityBadge}>
                    <div className={styles.badgeIcon}>🚀</div>
                    <div className={styles.badgeText}>{getShippingPriority()}</div>
                </div>
            </div>

            {/* Informations de commande */}
            <div className={styles.orderBar}>
                <div className={styles.orderDetail}>
                    <span className={styles.orderLabel}>COMMANDE</span>
                    <span className={styles.orderValue}>#{order.id}</span>
                </div>
                <div className={styles.orderDetail}>
                    <span className={styles.orderLabel}>DATE</span>
                    <span className={styles.orderValue}>{formatDate(order.date)}</span>
                </div>
            </div>

            {/* Section destinataire - Grande et lisible */}
            <div className={styles.recipientSection}>
                <div className={styles.sectionHeader}>
                    <div className={styles.headerIcon}>📦</div>
                    <div className={styles.headerTitle}>DESTINATAIRE</div>
                </div>
                <div className={styles.recipientBox}>
                    <div className={styles.recipientName}>{order.customerName}</div>
                    <div className={styles.addressLines}>
                        <div className={styles.addressLine}>{order.shippingAddress.street}</div>
                        <div className={styles.addressLine}>
                            {order.shippingAddress.city}, {order.shippingAddress.state}
                        </div>
                        <div className={styles.addressLine}>
                            {order.shippingAddress.zip}
                        </div>
                        <div className={styles.countryLine}>{getCountryName(order.shippingAddress.country)}</div>
                    </div>
                    {order.customerPhone && (
                        <div className={styles.contactLine}>
                            <span className={styles.phoneIcon}>📞</span>
                            <span className={styles.phoneNumber}>{order.customerPhone}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Section expéditeur - Compacte */}
            <div className={styles.senderSection}>
                <div className={styles.senderHeader}>EXPÉDITEUR</div>
                <div className={styles.senderBox}>
                    <div className={styles.senderName}>MONICAN</div>
                    <div className={styles.senderAddress}>
                        123 Commerce Street, Montreal, QC H3A 0G4, CANADA
                    </div>
                    <div className={styles.senderContact}>support@monican.com</div>
                </div>
            </div>

            {/* Code-barres et suivi */}
            <div className={styles.trackingSection}>
                {order.trackingNumber && (
                    <div className={styles.trackingBox}>
                        <div className={styles.trackingLabel}>NUMÉRO DE SUIVI</div>
                        <div className={styles.trackingNumber}>{order.trackingNumber}</div>
                        <div className={styles.trackingBarcode}>
                            {Array.from({ length: 60 }).map((_, i) => (
                                <div 
                                    key={i} 
                                    className={styles.barcodeLine}
                                    style={{ 
                                        height: `${Math.random() * 35 + 25}px`,
                                        opacity: Math.random() > 0.1 ? 1 : 0.3
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Informations supplémentaires */}
            <div className={styles.labelFooter}>
                <div className={styles.itemsBadge}>
                    <span className={styles.itemsIcon}>📋</span>
                    <span className={styles.itemsText}>
                        {order.items.reduce((sum, item) => sum + item.quantity, 0)} article{order.items.reduce((sum, item) => sum + item.quantity, 0) > 1 ? 's' : ''}
                    </span>
                </div>
                <div className={styles.qrSection}>
                    <div className={styles.qrCode}>
                        <div className={styles.qrPattern}>
                            {Array.from({ length: 25 }).map((_, i) => (
                                <div key={i} className={styles.qrDot} style={{ opacity: Math.random() > 0.3 ? 1 : 0 }} />
                            ))}
                        </div>
                    </div>
                    <div className={styles.qrLabel}>Scan moi</div>
                </div>
            </div>

            {/* Avertissement d'impression */}
            <div className={styles.printWarning}>
                <div className={styles.warningIcon}>⚠️</div>
                <div className={styles.warningText}>
                    Apposer cette étiquette sur le colis avant expédition
                </div>
            </div>
        </div>
    );
}