'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCountry } from '@/lib/country';
import Link from 'next/link';
import styles from './page.module.css';

interface Order {
    id: string;
    orderNumber: string;
    customerName: string;
    customerEmail: string;
    date: string;
    status: string;
    total: number;
    currency: string;
    items: Array<{
        id: string;
        name: string;
        size?: string;
        quantity: number;
        price: number;
        image?: string;
    }>;
    shippingAddress: {
        street: string;
        city: string;
        state: string;
        zip: string;
        country: string;
    };
    subtotal: number;
    shippingCost: number;
    tax: number;
}

export default function OrderConfirmationPage() {
    const { t } = useLanguage();
    const { formatPrice } = useCountry();
    const searchParams = useSearchParams();
    const router = useRouter();
    const orderId = searchParams.get('orderId');

    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!orderId) {
            setError('Numéro de commande manquant');
            setLoading(false);
            return;
        }

        async function fetchOrder() {
            try {
                const response = await fetch(`/api/orders/${orderId}`);
                const data = await response.json();

                if (response.ok && data.success && data.order) {
                    setOrder(data.order);
                } else {
                    setError(data.error || 'Commande non trouvée');
                }
            } catch (err) {
                console.error('Error fetching order:', err);
                setError('Erreur lors du chargement de la commande');
            } finally {
                setLoading(false);
            }
        }

        fetchOrder();
    }, [orderId]);

    if (loading) {
        return (
            <div className="container" style={{ padding: '4rem 0', textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏳</div>
                <p style={{ fontSize: '1.1rem', color: '#6b7280' }}>Chargement de votre commande...</p>
            </div>
        );
    }

    if (error || !order) {
        return (
            <div className="container" style={{ padding: '4rem 0', textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>❌</div>
                <h1 style={{ marginBottom: '1rem' }}>Commande non trouvée</h1>
                <p style={{ marginBottom: '2rem', color: '#6b7280' }}>
                    {error || 'Impossible de charger les détails de la commande.'}
                </p>
                <Link 
                    href="/" 
                    style={{
                        display: 'inline-block',
                        padding: '0.75rem 2rem',
                        background: '#111827',
                        color: 'white',
                        textDecoration: 'none',
                        borderRadius: '0.5rem',
                        fontWeight: 600
                    }}
                >
                    Retour à l'accueil
                </Link>
            </div>
        );
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('fr-FR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className={`container ${styles.container}`}>
            {/* Message de remerciement */}
            <div style={{
                textAlign: 'center',
                marginBottom: '3rem',
                padding: '2rem',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '1rem',
                color: 'white'
            }}>
                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎉</div>
                <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem', fontWeight: 700 }}>
                    {t('orderConfirmed') || 'Commande confirmée ! Merci pour votre achat.'}
                </h1>
                <p style={{ fontSize: '1.1rem', opacity: 0.9 }}>
                    Votre commande a été reçue et est en cours de traitement.
                </p>
            </div>

            {/* Numéro de commande */}
            <div style={{
                background: '#f9fafb',
                padding: '1.5rem',
                borderRadius: '0.5rem',
                marginBottom: '2rem',
                border: '2px solid #e5e7eb'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <p style={{ fontSize: '0.9rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                            Numéro de commande
                        </p>
                        <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827' }}>
                            {order.orderNumber || order.id}
                        </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: '0.9rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                            Date de commande
                        </p>
                        <p style={{ fontSize: '1rem', fontWeight: 600, color: '#111827' }}>
                            {formatDate(order.date)}
                        </p>
                    </div>
                </div>
            </div>

            {/* Détails de la commande */}
            <div style={{
                background: 'white',
                padding: '2rem',
                borderRadius: '0.5rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                marginBottom: '2rem'
            }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem', color: '#111827' }}>
                    Détails de la commande
                </h2>

                {/* Articles */}
                <div style={{ marginBottom: '2rem' }}>
                    {order.items.map((item) => (
                        <div 
                            key={item.id}
                            style={{
                                display: 'flex',
                                gap: '1rem',
                                padding: '1rem 0',
                                borderBottom: '1px solid #e5e7eb'
                            }}
                        >
                            {item.image && (
                                <img 
                                    src={item.image} 
                                    alt={item.name}
                                    style={{
                                        width: '80px',
                                        height: '80px',
                                        objectFit: 'cover',
                                        borderRadius: '0.5rem'
                                    }}
                                />
                            )}
                            <div style={{ flex: 1 }}>
                                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                                    {item.name}
                                </h3>
                                {item.size && (
                                    <p style={{ fontSize: '0.9rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                                        Taille: {item.size}
                                    </p>
                                )}
                                <p style={{ fontSize: '0.9rem', color: '#6b7280' }}>
                                    Quantité: {item.quantity}
                                </p>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <p style={{ fontSize: '1.1rem', fontWeight: 700, color: '#111827' }}>
                                    {formatPrice(item.price * item.quantity)}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Résumé financier */}
                <div style={{
                    paddingTop: '1.5rem',
                    borderTop: '2px solid #e5e7eb'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                        <span style={{ color: '#6b7280' }}>Sous-total</span>
                        <span style={{ fontWeight: 600 }}>{formatPrice(order.subtotal)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                        <span style={{ color: '#6b7280' }}>Livraison</span>
                        <span style={{ fontWeight: 600 }}>{formatPrice(order.shippingCost)}</span>
                    </div>
                    {order.tax > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                            <span style={{ color: '#6b7280' }}>Taxes</span>
                            <span style={{ fontWeight: 600 }}>{formatPrice(order.tax)}</span>
                        </div>
                    )}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        paddingTop: '1rem',
                        borderTop: '1px solid #e5e7eb',
                        fontSize: '1.25rem',
                        fontWeight: 700
                    }}>
                        <span>Total</span>
                        <span>{formatPrice(order.total)}</span>
                    </div>
                </div>
            </div>

            {/* Adresse de livraison */}
            <div style={{
                background: 'white',
                padding: '2rem',
                borderRadius: '0.5rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                marginBottom: '2rem'
            }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem', color: '#111827' }}>
                    Adresse de livraison
                </h2>
                <p style={{ lineHeight: '1.8', color: '#374151' }}>
                    {order.customerName}<br />
                    {order.shippingAddress.street}<br />
                    {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zip}<br />
                    {order.shippingAddress.country}
                </p>
            </div>

            {/* Informations importantes */}
            <div style={{
                background: '#fef3c7',
                padding: '1.5rem',
                borderRadius: '0.5rem',
                marginBottom: '2rem',
                border: '1px solid #fde68a'
            }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.75rem', color: '#92400e' }}>
                    📧 Email de confirmation
                </h3>
                <p style={{ color: '#78350f', lineHeight: '1.6' }}>
                    Un email de confirmation a été envoyé à <strong>{order.customerEmail}</strong> avec tous les détails de votre commande.
                </p>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link 
                    href="/"
                    style={{
                        display: 'inline-block',
                        padding: '0.75rem 2rem',
                        background: '#111827',
                        color: 'white',
                        textDecoration: 'none',
                        borderRadius: '0.5rem',
                        fontWeight: 600,
                        transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#374151'}
                    onMouseLeave={(e) => e.currentTarget.style.background = '#111827'}
                >
                    Continuer vos achats
                </Link>
                <Link 
                    href={`/track-order?orderId=${order.id}`}
                    style={{
                        display: 'inline-block',
                        padding: '0.75rem 2rem',
                        background: 'white',
                        color: '#111827',
                        textDecoration: 'none',
                        borderRadius: '0.5rem',
                        fontWeight: 600,
                        border: '2px solid #e5e7eb',
                        transition: 'border-color 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = '#111827'}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
                >
                    Suivre ma commande
                </Link>
            </div>
        </div>
    );
}

