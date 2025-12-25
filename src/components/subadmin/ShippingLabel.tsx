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

    useEffect(() => {
        const generateQRCode = async () => {
            const orderNumber = order.orderNumber || order.id;
            
            const shippingData = {
                orderNumber: orderNumber,
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
                type: 'shipping_label',
                version: '1.0'
            };

            const qrData = JSON.stringify(shippingData, null, 0);
            
            try {
                const dataUrl = await QRCode.toDataURL(qrData, {
                    width: 200,
                    margin: 1,
                    color: {
                        dark: '#000000',
                        light: '#FFFFFF'
                    },
                    errorCorrectionLevel: 'M'
                });
                setQrCodeUrl(dataUrl);
            } catch (error) {
                console.error('Error generating QR code:', error);
            }
        };

        generateQRCode();
    }, [order]);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const day = date.getDate();
        const month = date.toLocaleDateString('fr-FR', { month: 'long' });
        const year = date.getFullYear();
        return `${day} ${month} ${year}`;
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

    return (
        <div className={styles.shippingLabel}>
            {/* Header avec logo et badge */}
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
                        <div className={styles.tagline}>E-COMMERCE EXCELLENCE</div>
                    </div>
                </div>
                <div className={styles.priorityBadge}>
                    <div className={styles.badgeText}>STANDARD</div>
                </div>
            </div>

            {/* Barre de commande et date */}
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

            {/* Section destinataire */}
            <div className={styles.recipientSection}>
                <div className={styles.sectionHeader}>
                    <span className={styles.headerIcon}>📦</span>
                    <span className={styles.headerTitle}>DESTINATAIRE</span>
                </div>
                
                <div className={styles.recipientBox}>
                    {/* Nom du client en haut */}
                    <div className={styles.recipientName}>
                        {order.customerName || 'N/A'}
                    </div>
                    
                    {/* Adresse et QR Code côte à côte */}
                    <div className={styles.addressAndQrRow}>
                        {/* Informations adresse - GAUCHE */}
                        <div className={styles.recipientInfo}>
                            {order.shippingAddress ? (
                                <div className={styles.addressLines}>
                                    <div className={styles.addressLine}>
                                        {order.shippingAddress.street || ''}
                                    </div>
                                    <div className={styles.addressLine}>
                                        {order.shippingAddress.city || ''}, {order.shippingAddress.state || ''}
                                    </div>
                                    <div className={styles.addressLine}>
                                        {order.shippingAddress.zip || ''}
                                    </div>
                                </div>
                            ) : (
                                <div className={styles.addressLines}>
                                    <div className={styles.addressLine} style={{ color: '#ef4444' }}>
                                        Adresse non disponible
                                    </div>
                                </div>
                            )}
                        </div>
                        
                        {/* QR Code - DROITE */}
                        {qrCodeUrl && (
                            <div className={styles.qrCodeContainer}>
                                <img 
                                    src={qrCodeUrl} 
                                    alt="QR Code Shipping" 
                                    className={styles.qrCodeImage}
                                />
                            </div>
                        )}
                    </div>
                    
                    {/* Ligne de séparation */}
                    {order.shippingAddress && (
                        <>
                            <div className={styles.separatorLine}></div>
                            
                            {/* Pays */}
                            <div className={styles.countryLine}>
                                {getCountryName(order.shippingAddress.country || 'US')}
                            </div>
                            
                            {/* Téléphone */}
                            {order.customerPhone && (
                                <div className={styles.contactLine}>
                                    <span className={styles.phoneIcon}>📞</span>
                                    <span className={styles.phoneNumber}>{order.customerPhone}</span>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Section expéditeur */}
            <div className={styles.senderSection}>
                <div className={styles.senderHeader}>EXPÉDITEUR</div>
                <div className={styles.senderBox}>
                    <div className={styles.senderName}>MONICAN</div>
                    <div className={styles.senderContact}>support@monican.shop</div>
                    <div className={styles.senderContact}>www.monican.shop</div>
                    <div className={styles.senderContact}>+1717-880-1479</div>
                </div>
                <div className={styles.senderSignatureBox}></div>
            </div>
        </div>
    );
}