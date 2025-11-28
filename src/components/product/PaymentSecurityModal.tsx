'use client';

import Modal from './Modal';
import { useLanguage } from '@/contexts/LanguageContext';

interface PaymentSecurityModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function PaymentSecurityModal({ isOpen, onClose }: PaymentSecurityModalProps) {
    const { t } = useLanguage();

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={t('securePayment')} icon="🔒">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.75rem', color: '#111827' }}>
                        Méthodes de Paiement Acceptées
                    </h3>
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <div style={{ padding: '1.5rem', background: '#f9fafb', borderRadius: '0.5rem', textAlign: 'center', maxWidth: '300px', width: '100%' }}>
                            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>💳</div>
                            <div style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem' }}>Cartes de Crédit</div>
                            <div style={{ fontSize: '0.9rem', color: '#6b7280' }}>Visa, Mastercard, Amex</div>
                        </div>
                    </div>
                </div>

                <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.75rem', color: '#111827' }}>
                        Sécurité des Paiements
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <div style={{ display: 'flex', alignItems: 'start', gap: '0.75rem' }}>
                            <span style={{ fontSize: '1.5rem' }}>🔐</span>
                            <div>
                                <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Chiffrement SSL/TLS</div>
                                <div style={{ fontSize: '0.9rem', color: '#6b7280' }}>
                                    Toutes les transactions sont protégées par un chiffrement SSL/TLS de niveau bancaire.
                                </div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'start', gap: '0.75rem' }}>
                            <span style={{ fontSize: '1.5rem' }}>🛡️</span>
                            <div>
                                <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Conformité PCI DSS</div>
                                <div style={{ fontSize: '0.9rem', color: '#6b7280' }}>
                                    Nous respectons les normes PCI DSS pour la sécurité des données de carte de crédit.
                                </div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'start', gap: '0.75rem' }}>
                            <span style={{ fontSize: '1.5rem' }}>🔒</span>
                            <div>
                                <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Aucune Donnée Stockée</div>
                                <div style={{ fontSize: '0.9rem', color: '#6b7280' }}>
                                    Nous ne stockons jamais vos informations de carte de crédit sur nos serveurs.
                                </div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'start', gap: '0.75rem' }}>
                            <span style={{ fontSize: '1.5rem' }}>✅</span>
                            <div>
                                <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Protection contre la Fraude</div>
                                <div style={{ fontSize: '0.9rem', color: '#6b7280' }}>
                                    Système de détection de fraude en temps réel pour protéger vos transactions.
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div style={{ padding: '1rem', background: '#f0fdf4', borderRadius: '0.5rem', border: '1px solid #86efac' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '1.25rem' }}>✓</span>
                        <div style={{ fontWeight: 600, color: '#065f46' }}>Garantie de Remboursement</div>
                    </div>
                    <div style={{ fontSize: '0.9rem', color: '#047857' }}>
                        Si vous n'êtes pas satisfait de votre achat, nous offrons un remboursement complet dans les 30 jours.
                    </div>
                </div>
            </div>
        </Modal>
    );
}

