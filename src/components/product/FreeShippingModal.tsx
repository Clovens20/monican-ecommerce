'use client';

import Modal from './Modal';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCart } from '@/lib/cart';
import { useCountry } from '@/lib/country';

interface FreeShippingModalProps {
    isOpen: boolean;
    onClose: () => void;
    productPrice: number;
}

export default function FreeShippingModal({ isOpen, onClose, productPrice }: FreeShippingModalProps) {
    const { t } = useLanguage();
    const { total } = useCart();
    const { formatPrice, settings, shippingCost } = useCountry();

    // Calculate current cart total + product price
    const currentTotal = total;
    const currentShipping = shippingCost(currentTotal);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Options de Livraison" icon="🚚">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* Current Status */}
                <div style={{ padding: '1.25rem', background: '#f9fafb', borderRadius: '0.75rem', border: '1px solid #e5e7eb' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                        <span style={{ fontSize: '1.5rem' }}>📦</span>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, marginBottom: '0.25rem', color: '#111827' }}>
                                Total actuel du panier
                            </div>
                            <div style={{ fontSize: '0.9rem', color: '#6b7280' }}>
                                {formatPrice(currentTotal)}
                            </div>
                        </div>
                    </div>
                    <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid #e5e7eb' }}>
                        <div style={{ fontSize: '0.9rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                            Frais de livraison estimés
                        </div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827' }}>
                            {formatPrice(currentShipping / settings.exchangeRate)}
                        </div>
                    </div>
                </div>

                {/* Shipping Options */}
                <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.75rem', color: '#111827' }}>
                        Options de Livraison Disponibles
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <div style={{ padding: '1rem', background: '#f9fafb', borderRadius: '0.5rem', border: '1px solid #e5e7eb' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                <div style={{ fontWeight: 600 }}>🇺🇸 États-Unis</div>
                                <div style={{ fontSize: '0.9rem', color: '#6b7280' }}>3-7 jours ouvrables</div>
                            </div>
                            <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                                Frais de livraison standard appliqués
                            </div>
                        </div>
                        <div style={{ padding: '1rem', background: '#f9fafb', borderRadius: '0.5rem', border: '1px solid #e5e7eb' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                <div style={{ fontWeight: 600 }}>🇨🇦 Canada</div>
                                <div style={{ fontSize: '0.9rem', color: '#6b7280' }}>4-10 jours ouvrables</div>
                            </div>
                            <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                                Frais de livraison standard appliqués
                            </div>
                        </div>
                        <div style={{ padding: '1rem', background: '#f9fafb', borderRadius: '0.5rem', border: '1px solid #e5e7eb' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                <div style={{ fontWeight: 600 }}>🇲🇽 Mexique</div>
                                <div style={{ fontSize: '0.9rem', color: '#6b7280' }}>5-14 jours ouvrables</div>
                            </div>
                            <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                                Frais de livraison standard appliqués
                            </div>
                        </div>
                    </div>
                </div>

                {/* Info */}
                <div style={{ padding: '1rem', background: '#f0f9ff', borderRadius: '0.5rem', border: '1px solid #bae6fd' }}>
                    <div style={{ fontSize: '0.9rem', color: '#0369a1' }}>
                        <strong>Note:</strong> Les frais de livraison sont calculés automatiquement lors du checkout en fonction de votre adresse et de l'option de livraison sélectionnée (USPS ou FedEx).
                    </div>
                </div>
            </div>
        </Modal>
    );
}

