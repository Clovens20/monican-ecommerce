'use client';

import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import styles from './page.module.css';

export default function TrackOrderPage() {
    const { t } = useLanguage();
    const [orderId, setOrderId] = useState('');
    const [email, setEmail] = useState('');
    const [trackingInfo, setTrackingInfo] = useState<any>(null);

    const handleTrack = (e: React.FormEvent) => {
        e.preventDefault();
        // Simulation - Ici vous feriez un appel API réel
        if (orderId && email) {
            setTrackingInfo({
                orderId,
                status: 'shipped',
                estimatedDelivery: '2025-12-05',
                trackingNumber: 'USPS9400100000000000000001',
                currentLocation: 'New York, NY',
                history: [
                    { date: '2025-11-24', status: t('orderPlaced'), location: t('warehouse') },
                    { date: '2025-11-25', status: t('processing'), location: t('warehouse') },
                    { date: '2025-11-26', status: t('shipped'), location: 'New York, NY' },
                ],
            });
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>{t('trackOrderTitle')}</h1>
                <p className={styles.subtitle}>
                    {t('trackOrderSubtitle')}
                </p>
            </div>

            <div className={styles.trackForm}>
                <form onSubmit={handleTrack} className={styles.form}>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>{t('orderNumber')} *</label>
                        <input
                            type="text"
                            className={styles.input}
                            value={orderId}
                            onChange={(e) => setOrderId(e.target.value)}
                            placeholder={t('orderNumberPlaceholder')}
                            required
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>{t('email')} *</label>
                        <input
                            type="email"
                            className={styles.input}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="votre@email.com"
                            required
                        />
                    </div>

                    <button type="submit" className={styles.trackButton}>
                        {t('trackOrderBtn')}
                    </button>
                </form>
            </div>

            {trackingInfo && (
                <div className={styles.trackingInfo}>
                    <h2 className={styles.sectionTitle}>{t('trackingInfo')}</h2>
                    <div className={styles.statusCard}>
                        <div className={styles.statusHeader}>
                            <div>
                                <p className={styles.orderId}>{t('order')}: {trackingInfo.orderId}</p>
                                <p className={styles.trackingNumber}>
                                    {t('trackingNumber')}: {trackingInfo.trackingNumber}
                                </p>
                            </div>
                            <div className={`${styles.statusBadge} ${styles[trackingInfo.status]}`}>
                                {trackingInfo.status === 'shipped' ? t('shipped') : trackingInfo.status}
                            </div>
                        </div>

                        <div className={styles.timeline}>
                            {trackingInfo.history.map((item: any, index: number) => (
                                <div key={index} className={styles.timelineItem}>
                                    <div className={styles.timelineDot}></div>
                                    <div className={styles.timelineContent}>
                                        <p className={styles.timelineDate}>{item.date}</p>
                                        <p className={styles.timelineStatus}>{item.status}</p>
                                        <p className={styles.timelineLocation}>{item.location}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className={styles.deliveryInfo}>
                            <p><strong>{t('estimatedDeliveryLabel')}:</strong> {trackingInfo.estimatedDelivery}</p>
                            <p><strong>{t('currentLocationLabel')}:</strong> {trackingInfo.currentLocation}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

