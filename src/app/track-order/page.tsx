'use client';

import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import styles from './page.module.css';

type SearchType = 'orderNumber' | 'trackingNumber';

export default function TrackOrderPage() {
    const { t } = useLanguage();
    const [searchType, setSearchType] = useState<SearchType>('orderNumber');
    const [identifier, setIdentifier] = useState('');
    const [email, setEmail] = useState('');
    const [trackingInfo, setTrackingInfo] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleTrack = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        if (!identifier || !email) {
            setError('Veuillez remplir tous les champs');
            setLoading(false);
            return;
        }

        try {
            const response = await fetch('/api/orders/track', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    identifier,
                    email,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || 'Erreur lors de la recherche de commande');
                setTrackingInfo(null);
                return;
            }

            if (data.success && data.order) {
                const order = data.order;
                setTrackingInfo({
                    orderId: order.orderNumber || order.id,
                    status: order.status,
                    trackingNumber: order.trackingNumber,
                    date: order.date,
                    items: order.items,
                    total: order.total,
                    currency: order.currency,
                    statusHistory: order.statusHistory || [],
                });
            } else {
                setError('Commande non trouvée');
                setTrackingInfo(null);
            }
        } catch (err) {
            console.error('Error tracking order:', err);
            setError('Erreur lors de la connexion au serveur');
            setTrackingInfo(null);
        } finally {
            setLoading(false);
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
                        <label className={styles.label}>
                            {searchType === 'orderNumber' ? t('orderNumber') : t('trackingNumber')} *
                        </label>
                        <div className={styles.searchTypeSelector}>
                            <button
                                type="button"
                                className={`${styles.searchTypeBtn} ${searchType === 'orderNumber' ? styles.active : ''}`}
                                onClick={() => {
                                    setSearchType('orderNumber');
                                    setIdentifier('');
                                }}
                            >
                                {t('orderNumber')}
                            </button>
                            <button
                                type="button"
                                className={`${styles.searchTypeBtn} ${searchType === 'trackingNumber' ? styles.active : ''}`}
                                onClick={() => {
                                    setSearchType('trackingNumber');
                                    setIdentifier('');
                                }}
                            >
                                {t('trackingNumber')}
                            </button>
                        </div>
                        <input
                            type="text"
                            className={styles.input}
                            value={identifier}
                            onChange={(e) => setIdentifier(e.target.value)}
                            placeholder={
                                searchType === 'orderNumber'
                                    ? t('orderNumberPlaceholder')
                                    : 'USPS9400100000000000000001'
                            }
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

                    {error && (
                        <div className={styles.errorMessage}>
                            {error}
                        </div>
                    )}

                    <button type="submit" className={styles.trackButton} disabled={loading}>
                        {loading ? 'Recherche...' : t('trackOrderBtn')}
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
                                {trackingInfo.trackingNumber && (
                                    <p className={styles.trackingNumber}>
                                        {t('trackingNumber')}: {trackingInfo.trackingNumber}
                                    </p>
                                )}
                            </div>
                            <div className={`${styles.statusBadge} ${styles[trackingInfo.status]}`}>
                                {trackingInfo.status === 'shipped' ? t('shipped') : 
                                 trackingInfo.status === 'delivered' ? t('delivered') || 'Livré' :
                                 trackingInfo.status === 'processing' ? t('processing') || 'En traitement' :
                                 trackingInfo.status === 'pending' ? t('pending') || 'En attente' :
                                 trackingInfo.status}
                            </div>
                        </div>

                        {trackingInfo.statusHistory && trackingInfo.statusHistory.length > 0 && (
                            <div className={styles.timeline}>
                                {trackingInfo.statusHistory.map((item: any, index: number) => (
                                    <div key={index} className={styles.timelineItem}>
                                        <div className={styles.timelineDot}></div>
                                        <div className={styles.timelineContent}>
                                            <p className={styles.timelineDate}>
                                                {new Date(item.timestamp || item.date).toLocaleDateString('fr-FR', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </p>
                                            <p className={styles.timelineStatus}>{item.status}</p>
                                            {item.note && (
                                                <p className={styles.timelineLocation}>{item.note}</p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className={styles.deliveryInfo}>
                            <p><strong>Date de commande:</strong> {new Date(trackingInfo.date).toLocaleDateString('fr-FR')}</p>
                            <p><strong>Total:</strong> {new Intl.NumberFormat('fr-FR', {
                                style: 'currency',
                                currency: trackingInfo.currency || 'USD'
                            }).format(trackingInfo.total)}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

