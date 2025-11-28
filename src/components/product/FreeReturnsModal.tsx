'use client';

import { useState } from 'react';
import Modal from './Modal';
import { useLanguage } from '@/contexts/LanguageContext';

interface FreeReturnsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function FreeReturnsModal({ isOpen, onClose }: FreeReturnsModalProps) {
    const { t } = useLanguage();
    const [orderNumber, setOrderNumber] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [returnLabel, setReturnLabel] = useState<string | null>(null);
    const [trackingNumber, setTrackingNumber] = useState('');
    const [isCompleting, setIsCompleting] = useState(false);
    const [isCompleted, setIsCompleted] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            const response = await fetch('/api/returns/initiate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    orderNumber: orderNumber.trim(),
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Erreur lors de la génération de l\'étiquette de retour');
            }

            setSuccess(true);
            setReturnLabel(data.returnLabel);
        } catch (err: any) {
            setError(err.message || 'Une erreur est survenue. Veuillez réessayer.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCompleteReturn = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!trackingNumber.trim()) {
            setError('Veuillez entrer le numéro de suivi');
            return;
        }

        setError(null);
        setIsCompleting(true);

        try {
            const response = await fetch('/api/returns/complete', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    returnLabel: returnLabel,
                    trackingNumber: trackingNumber.trim(),
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Erreur lors de la finalisation du retour');
            }

            setIsCompleted(true);
        } catch (err: any) {
            setError(err.message || 'Une erreur est survenue. Veuillez réessayer.');
        } finally {
            setIsCompleting(false);
        }
    };

    const handleReset = () => {
        setOrderNumber('');
        setError(null);
        setSuccess(false);
        setReturnLabel(null);
        setTrackingNumber('');
        setIsCompleted(false);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Retours de Produits" icon="↩️">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* Main Info */}
                <div style={{ padding: '1.25rem', background: '#f0fdf4', borderRadius: '0.75rem', border: '1px solid #86efac' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                        <span style={{ fontSize: '2rem' }}>↩️</span>
                        <div>
                            <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#065f46', marginBottom: '0.25rem' }}>
                                Retours sous 30 Jours
                            </div>
                            <div style={{ fontSize: '0.9rem', color: '#047857' }}>
                                Vous pouvez retourner vos articles dans les 30 jours suivant la réception.
                            </div>
                        </div>
                    </div>
                </div>

                {/* Return Request Form */}
                <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.75rem', color: '#111827' }}>
                        {!success ? 'Initier un Retour' : isCompleted ? 'Retour Finalisé' : 'Finaliser le Retour'}
                    </h3>
                    
                    {!success ? (
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label 
                                    htmlFor="orderNumber" 
                                    style={{ 
                                        display: 'block', 
                                        fontSize: '0.9rem', 
                                        fontWeight: 600, 
                                        marginBottom: '0.5rem',
                                        color: '#111827'
                                    }}
                                >
                                    Numéro de Commande *
                                </label>
                                <input
                                    type="text"
                                    id="orderNumber"
                                    value={orderNumber}
                                    onChange={(e) => setOrderNumber(e.target.value)}
                                    placeholder="Ex: ORD-001, TRACK-123456, ou code de commande"
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        border: '1px solid #e5e7eb',
                                        borderRadius: '0.5rem',
                                        fontSize: '0.95rem',
                                        transition: 'border-color 0.2s'
                                    }}
                                    onFocus={(e) => e.target.style.borderColor = '#111827'}
                                    onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                                />
                                <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '0.25rem' }}>
                                    Entrez votre numéro de confirmation, numéro de suivi ou code de commande
                                </div>
                            </div>

                            {error && (
                                <div style={{ 
                                    padding: '0.75rem', 
                                    background: '#fee2e2', 
                                    borderRadius: '0.5rem', 
                                    border: '1px solid #fca5a5',
                                    color: '#991b1b',
                                    fontSize: '0.9rem'
                                }}>
                                    ⚠️ {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isLoading || !orderNumber.trim()}
                                style={{
                                    padding: '0.75rem 1.5rem',
                                    background: isLoading ? '#9ca3af' : '#111827',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '0.5rem',
                                    fontSize: '1rem',
                                    fontWeight: 600,
                                    cursor: isLoading ? 'not-allowed' : 'pointer',
                                    transition: 'background-color 0.2s'
                                }}
                            >
                                {isLoading ? 'Génération en cours...' : 'Générer l\'étiquette de retour'}
                            </button>
                        </form>
                    ) : isCompleted ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ 
                                padding: '1rem', 
                                background: '#dcfce7', 
                                borderRadius: '0.5rem', 
                                border: '1px solid #86efac',
                                textAlign: 'center'
                            }}>
                                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✅</div>
                                <div style={{ fontWeight: 600, color: '#065f46', marginBottom: '0.25rem' }}>
                                    Retour Finalisé avec Succès
                                </div>
                                <div style={{ fontSize: '0.9rem', color: '#047857', marginBottom: '0.75rem' }}>
                                    Votre retour a été enregistré. L'administrateur a été notifié et suivra votre colis.
                                </div>
                                <button
                                    onClick={handleReset}
                                    style={{
                                        padding: '0.5rem 1rem',
                                        background: '#111827',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '0.5rem',
                                        fontSize: '0.9rem',
                                        fontWeight: 600,
                                        cursor: 'pointer'
                                    }}
                                >
                                    Nouveau retour
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ 
                                padding: '1rem', 
                                background: '#f0fdf4', 
                                borderRadius: '0.5rem', 
                                border: '1px solid #86efac',
                                textAlign: 'center'
                            }}>
                                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✓</div>
                                <div style={{ fontWeight: 600, color: '#065f46', marginBottom: '0.25rem' }}>
                                    Étiquette de Retour Générée
                                </div>
                                <div style={{ fontSize: '0.9rem', color: '#047857', marginBottom: '0.75rem' }}>
                                    Votre étiquette de retour a été générée avec succès.
                                </div>
                                {returnLabel && (
                                    <div style={{ 
                                        padding: '0.75rem', 
                                        background: 'white', 
                                        borderRadius: '0.5rem',
                                        fontFamily: 'monospace',
                                        fontSize: '0.9rem',
                                        fontWeight: 600,
                                        color: '#111827',
                                        marginBottom: '0.75rem'
                                    }}>
                                        {returnLabel}
                                    </div>
                                )}
                                <button
                                    onClick={() => window.print()}
                                    style={{
                                        padding: '0.5rem 1rem',
                                        background: '#111827',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '0.5rem',
                                        fontSize: '0.9rem',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        marginBottom: '0.5rem'
                                    }}
                                >
                                    📄 Imprimer l'étiquette
                                </button>
                            </div>

                            {/* Tracking Number Form */}
                            <div style={{ 
                                padding: '1rem', 
                                background: '#fef3c7', 
                                borderRadius: '0.5rem', 
                                border: '1px solid #fcd34d'
                            }}>
                                <div style={{ fontWeight: 600, marginBottom: '0.5rem', color: '#92400e' }}>
                                    📦 Ajouter le Numéro de Suivi
                                </div>
                                <div style={{ fontSize: '0.85rem', color: '#b45309', marginBottom: '0.75rem' }}>
                                    Après avoir déposé votre colis au bureau d'envoi, entrez le numéro de suivi que vous avez reçu.
                                </div>
                                
                                <form onSubmit={handleCompleteReturn} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    <div>
                                        <label 
                                            htmlFor="trackingNumber" 
                                            style={{ 
                                                display: 'block', 
                                                fontSize: '0.9rem', 
                                                fontWeight: 600, 
                                                marginBottom: '0.5rem',
                                                color: '#111827'
                                            }}
                                        >
                                            Numéro de Suivi *
                                        </label>
                                        <input
                                            type="text"
                                            id="trackingNumber"
                                            value={trackingNumber}
                                            onChange={(e) => setTrackingNumber(e.target.value)}
                                            placeholder="Ex: 1Z999AA10123456784"
                                            required
                                            style={{
                                                width: '100%',
                                                padding: '0.75rem',
                                                border: '1px solid #e5e7eb',
                                                borderRadius: '0.5rem',
                                                fontSize: '0.95rem',
                                                transition: 'border-color 0.2s'
                                            }}
                                            onFocus={(e) => e.target.style.borderColor = '#111827'}
                                            onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                                        />
                                    </div>

                                    {error && (
                                        <div style={{ 
                                            padding: '0.75rem', 
                                            background: '#fee2e2', 
                                            borderRadius: '0.5rem', 
                                            border: '1px solid #fca5a5',
                                            color: '#991b1b',
                                            fontSize: '0.9rem'
                                        }}>
                                            ⚠️ {error}
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={isCompleting || !trackingNumber.trim()}
                                        style={{
                                            padding: '0.75rem 1.5rem',
                                            background: isCompleting ? '#9ca3af' : '#f59e0b',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '0.5rem',
                                            fontSize: '1rem',
                                            fontWeight: 600,
                                            cursor: isCompleting ? 'not-allowed' : 'pointer',
                                            transition: 'background-color 0.2s'
                                        }}
                                    >
                                        {isCompleting ? 'Finalisation en cours...' : 'Terminer'}
                                    </button>
                                </form>
                            </div>
                        </div>
                    )}
                </div>

                {/* Rest of the modal content (conditions, instructions, etc.) */}
                {!success && (
                    <>
                        {/* Important Information */}
                        <div style={{ padding: '1rem', background: '#fef3c7', borderRadius: '0.5rem', border: '1px solid #fcd34d' }}>
                            <div style={{ fontWeight: 600, marginBottom: '0.5rem', color: '#92400e' }}>
                                ⚠️ Informations Importantes
                            </div>
                            <ul style={{ fontSize: '0.9rem', color: '#b45309', marginLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                <li>Le client est responsable des frais de retour</li>
                                <li>Le remboursement sera effectué après réception et vérification du produit</li>
                                <li>Le produit doit être en état neuf, non utilisé, avec son emballage intact</li>
                                <li>Le remboursement prend 5-7 jours ouvrables après vérification</li>
                            </ul>
                        </div>

                        {/* Conditions */}
                        <div>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.75rem', color: '#111827' }}>
                                Conditions de Retour
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                <div style={{ display: 'flex', alignItems: 'start', gap: '0.75rem' }}>
                                    <span style={{ fontSize: '1.25rem' }}>✓</span>
                                    <div style={{ fontSize: '0.9rem', color: '#4b5563' }}>
                                        Articles en état neuf, non portés, non lavés
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'start', gap: '0.75rem' }}>
                                    <span style={{ fontSize: '1.25rem' }}>✓</span>
                                    <div style={{ fontSize: '0.9rem', color: '#4b5563' }}>
                                        Avec leurs étiquettes d'origine
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'start', gap: '0.75rem' }}>
                                    <span style={{ fontSize: '1.25rem' }}>✓</span>
                                    <div style={{ fontSize: '0.9rem', color: '#4b5563' }}>
                                        Dans l'emballage d'origine si possible (emballage non déchiré)
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'start', gap: '0.75rem' }}>
                                    <span style={{ fontSize: '1.25rem' }}>✓</span>
                                    <div style={{ fontSize: '0.9rem', color: '#4b5563' }}>
                                        Retourné dans les 30 jours suivant la réception
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </Modal>
    );
}
