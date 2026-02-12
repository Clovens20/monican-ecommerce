'use client';

import { useState } from 'react';
import Modal from '@/components/product/Modal';

interface WholesaleReplyModalProps {
    isOpen: boolean;
    onClose: () => void;
    orderId: string;
    recipientEmail: string;
    contactName: string;
    companyName: string;
    apiBase: '/api/admin/wholesale' | '/api/admin/subadmin/wholesale';
}

export default function WholesaleReplyModal({
    isOpen,
    onClose,
    orderId,
    recipientEmail,
    contactName,
    companyName,
    apiBase,
}: WholesaleReplyModalProps) {
    const [message, setMessage] = useState('');
    const [subject, setSubject] = useState(`Réponse à votre demande vente en gros - ${companyName}`);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSend = async () => {
        if (!message.trim()) {
            setError('Veuillez rédiger un message.');
            return;
        }
        setSending(true);
        setError(null);
        try {
            const res = await fetch(`${apiBase}/${orderId}/reply`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: message.trim(), subject: subject.trim() || undefined }),
            });
            const data = await res.json();

            if (data.success) {
                setMessage('');
                setSubject(`Réponse à votre demande vente en gros - ${companyName}`);
                onClose();
            } else {
                setError(data.error || 'Erreur lors de l\'envoi');
            }
        } catch (err) {
            console.error(err);
            setError('Erreur de connexion');
        } finally {
            setSending(false);
        }
    };

    const handleClose = () => {
        setMessage('');
        setError(null);
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title="Répondre par email"
            icon="✉️"
        >
            <div style={{ minWidth: 360 }}>
                <div style={{ marginBottom: '1rem', padding: '1rem', background: '#f9fafb', borderRadius: '8px', fontSize: '0.9rem' }}>
                    <div style={{ marginBottom: '0.5rem' }}>
                        <strong>Destinataire :</strong> {contactName} ({recipientEmail})
                    </div>
                    <div>
                        <strong>Société :</strong> {companyName}
                    </div>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>
                        Objet (optionnel)
                    </label>
                    <input
                        type="text"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '0.5rem 0.75rem',
                            border: '1px solid #e5e7eb',
                            borderRadius: '6px',
                            fontSize: '0.9rem',
                        }}
                    />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>
                        Message *
                    </label>
                    <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        rows={6}
                        placeholder="Rédigez votre message ici. Il sera envoyé à l'adresse email du demandant."
                        style={{
                            width: '100%',
                            padding: '0.75rem',
                            border: '1px solid #e5e7eb',
                            borderRadius: '6px',
                            fontSize: '0.9rem',
                            resize: 'vertical',
                        }}
                    />
                </div>

                {error && (
                    <div
                        style={{
                            padding: '0.75rem',
                            background: '#fef2f2',
                            color: '#991b1b',
                            borderRadius: '6px',
                            marginBottom: '1rem',
                            fontSize: '0.9rem',
                        }}
                    >
                        {error}
                    </div>
                )}

                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                    <button
                        type="button"
                        onClick={handleClose}
                        style={{
                            padding: '0.5rem 1rem',
                            background: '#f3f4f6',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                        }}
                    >
                        Annuler
                    </button>
                    <button
                        type="button"
                        onClick={handleSend}
                        disabled={sending || !message.trim()}
                        style={{
                            padding: '0.5rem 1.25rem',
                            background: sending || !message.trim() ? '#9ca3af' : '#10b981',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: sending || !message.trim() ? 'not-allowed' : 'pointer',
                            fontSize: '0.9rem',
                            fontWeight: 600,
                        }}
                    >
                        {sending ? '⏳ Envoi...' : 'Envoyer l\'email'}
                    </button>
                </div>
            </div>
        </Modal>
    );
}
