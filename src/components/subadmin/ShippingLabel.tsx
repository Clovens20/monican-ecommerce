'use client';

import Image from 'next/image';
import { Order } from '@/lib/types';
import styles from './ShippingLabel.module.css';
import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

interface ShippingLabelProps {
    order: Order;
}

export default function ShippingLabel({ order }: ShippingLabelProps) {
    const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
    const [qrCodeReady, setQrCodeReady] = useState(false);

    useEffect(() => {
        // Générer le QR code avec les informations de shipping
        const generateQRCode = async () => {
            // Prioriser orderNumber (format ORD-MON-XXXXXX) au lieu de l'UUID
            const orderNumber = order.orderNumber || order.id;
            
            const shippingData = {
                // Numéro de commande au format ORD-MON-XXXXXX (prioritaire)
                orderNumber: orderNumber,
                // ID technique (UUID) pour référence interne si nécessaire
                orderId: order.id,
                customerName: order.customerName,
                address: {
                    street: order.shippingAddress.street,
                    city: order.shippingAddress.city,
                    state: order.shippingAddress.state,
                    zip: order.shippingAddress.zip,
                    country: order.shippingAddress.country
                },
                phone: order.customerPhone || '',
                tracking: order.trackingNumber || '',
                date: order.date,
                // Métadonnées pour faciliter le scan
                type: 'shipping_label',
                version: '1.0'
            };

            // Format JSON structuré pour faciliter le parsing
            const qrData = JSON.stringify(shippingData, null, 0);
            
            try {
                const dataUrl = await QRCode.toDataURL(qrData, {
                    width: 200,
                    margin: 1,
                    color: {
                        dark: '#000000',
                        light: '#FFFFFF'
                    },
                    errorCorrectionLevel: 'M' // Niveau de correction d'erreur moyen pour meilleure lisibilité
                });
                setQrCodeUrl(dataUrl);
                // Marquer le QR code comme prêt après un court délai pour laisser l'image se charger
                setTimeout(() => setQrCodeReady(true), 50);
            } catch (error) {
                console.error('Error generating QR code:', error);
                setQrCodeReady(true); // Marquer comme prêt même en cas d'erreur pour ne pas bloquer l'impression
            }
        };

        generateQRCode();
    }, [order]);

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
                    <span className={styles.orderValue}>#{order.orderNumber || order.id}</span>
                </div>
                <div className={styles.orderDetail}>
                    <span className={styles.orderLabel}>DATE</span>
                    <span className={styles.orderValue}>{formatDate(order.date)}</span>
                </div>
            </div>

            {/* Section destinataire - Grande et lisible */}
            <div className={styles.recipientSection}>
                <div className={styles.sectionHeader}>
                    <div className={styles.headerTitle}>SHIP TO:</div>
                </div>
                <div className={styles.recipientBox}>
                    <div className={styles.recipientNameRow}>
                        <div className={styles.recipientName}>{order.customerName || 'N/A'}</div>
                        {qrCodeUrl && (
                            <div className={styles.qrCodeInline}>
                                <img 
                                    src={qrCodeUrl} 
                                    alt="QR Code Shipping" 
                                    className={styles.qrCodeImage}
                                    onLoad={() => setQrCodeReady(true)}
                                    onError={() => setQrCodeReady(true)}
                                />
                            </div>
                        )}
                    </div>
                    {order.shippingAddress ? (
                        <div className={styles.addressLines}>
                            <div className={styles.addressLine}>{order.shippingAddress.street || ''}</div>
                            <div className={styles.addressLine}>
                                {order.shippingAddress.city || ''}, {order.shippingAddress.state || ''}
                            </div>
                            <div className={styles.addressLine}>
                                {order.shippingAddress.zip || ''}
                            </div>
                            <div className={styles.countryLine}>{getCountryName(order.shippingAddress.country || 'US')}</div>
                        </div>
                    ) : (
                        <div className={styles.addressLines}>
                            <div className={styles.addressLine} style={{ color: '#ef4444' }}>Adresse non disponible</div>
                        </div>
                    )}
                    {order.customerPhone && (
                        <div className={styles.contactLine}>
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
                    <div className={styles.senderContact}>support@monican.shop</div>
                    <div className={styles.senderContact}>www.monican.shop</div>
                    <div className={styles.senderContact}>+1 717-880-1479</div>
                </div>
            </div>

            {/* Code-barres et suivi */}
            <div className={styles.trackingSection}>
                {order.trackingNumber && (
                    <div className={styles.trackingBox}>
                        <div className={styles.trackingLabel}>TRACKING #:</div>
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