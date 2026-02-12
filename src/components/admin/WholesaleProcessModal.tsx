'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/product/Modal';

interface StockInfoItem {
    productId?: string;
    productName: string;
    size: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    availableStock: number;
    ok: boolean;
}

interface WholesaleProcessModalProps {
    isOpen: boolean;
    onClose: () => void;
    orderId: string;
    apiBase: '/api/admin/wholesale' | '/api/admin/subadmin/wholesale';
    onSuccess: () => void;
}

export default function WholesaleProcessModal({
    isOpen,
    onClose,
    orderId,
    apiBase,
    onSuccess,
}: WholesaleProcessModalProps) {
    const [loading, setLoading] = useState(true);
    const [executing, setExecuting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [stockInfo, setStockInfo] = useState<StockInfoItem[]>([]);
    const [canExecute, setCanExecute] = useState(false);
    const [order, setOrder] = useState<any>(null);

    useEffect(() => {
        if (isOpen && orderId) {
            setLoading(true);
            setError(null);
            fetch(`${apiBase}/${orderId}/process-info`)
                .then((res) => res.json())
                .then((data) => {
                    if (data.success) {
                        setStockInfo(data.stockInfo || []);
                        setCanExecute(data.canExecute ?? false);
                        setOrder(data.order);
                    } else {
                        setError(data.error || 'Erreur de chargement');
                    }
                })
                .catch((err) => {
                    console.error(err);
                    setError('Erreur de connexion');
                })
                .finally(() => setLoading(false));
        }
    }, [isOpen, orderId, apiBase]);

    const formatPrice = (amount: number) =>
        new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'USD' }).format(amount);

    const handleFinalize = async () => {
        setExecuting(true);
        setError(null);
        try {
            const res = await fetch(`${apiBase}/${orderId}/execute`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });
            const data = await res.json();

            if (data.success) {
                onSuccess();
                onClose();
            } else {
                if (data.details && Array.isArray(data.details)) {
                    const msg = data.details
                        .map(
                            (d: any) =>
                                `${d.product} taille ${d.size}: demandé ${d.requested}, disponible ${d.available}`
                        )
                        .join('\n');
                    setError(`Stock insuffisant:\n${msg}`);
                } else {
                    setError(data.error || 'Erreur lors de l\'exécution');
                }
            }
        } catch (err) {
            console.error(err);
            setError('Erreur de connexion');
        } finally {
            setExecuting(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Exécuter la commande"
            icon="📦"
        >
            <div style={{ minWidth: 320 }}>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '2rem' }}>
                        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⏳</div>
                        <p>Chargement des produits et du stock...</p>
                    </div>
                ) : error && !stockInfo.length ? (
                    <div style={{ textAlign: 'center', padding: '2rem', color: '#dc2626' }}>
                        <p>{error}</p>
                    </div>
                ) : (
                    <>
                        {order && (
                            <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#f9fafb', borderRadius: '8px' }}>
                                <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>{order.company_name}</div>
                                <div style={{ fontSize: '0.9rem', color: '#6b7280' }}>
                                    {order.contact_name} • {order.email}
                                </div>
                                <div style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '0.25rem' }}>
                                    {order.address}, {order.city}, {order.state} {order.zip}, {order.country}
                                </div>
                            </div>
                        )}

                        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1.5rem' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                                    <th style={{ padding: '0.5rem 0.5rem 0.5rem 0', textAlign: 'left', fontSize: '0.85rem' }}>Produit</th>
                                    <th style={{ padding: '0.5rem', textAlign: 'center', fontSize: '0.85rem' }}>Taille</th>
                                    <th style={{ padding: '0.5rem', textAlign: 'center', fontSize: '0.85rem' }}>Demandé</th>
                                    <th style={{ padding: '0.5rem', textAlign: 'center', fontSize: '0.85rem' }}>Stock</th>
                                    <th style={{ padding: '0.5rem 0 0.5rem 0.5rem', textAlign: 'right', fontSize: '0.85rem' }}>Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stockInfo.map((item, i) => (
                                    <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                        <td style={{ padding: '0.75rem 0.5rem 0.75rem 0' }}>{item.productName}</td>
                                        <td style={{ padding: '0.75rem', textAlign: 'center' }}>{item.size}</td>
                                        <td style={{ padding: '0.75rem', textAlign: 'center' }}>{item.quantity}</td>
                                        <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                                            <span
                                                style={{
                                                    padding: '0.2rem 0.5rem',
                                                    borderRadius: '4px',
                                                    fontSize: '0.85rem',
                                                    background: item.ok ? '#d1fae5' : '#fee2e2',
                                                    color: item.ok ? '#065f46' : '#991b1b',
                                                }}
                                            >
                                                {item.availableStock} dispo.
                                            </span>
                                        </td>
                                        <td style={{ padding: '0.75rem 0 0.75rem 0.5rem', textAlign: 'right' }}>
                                            {formatPrice(item.totalPrice)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {order && (
                            <div style={{ marginBottom: '1rem', fontWeight: 600, fontSize: '1rem' }}>
                                Total : {formatPrice(order.total)}
                            </div>
                        )}

                        {error && (
                            <div
                                style={{
                                    padding: '1rem',
                                    background: '#fef2f2',
                                    color: '#991b1b',
                                    borderRadius: '8px',
                                    marginBottom: '1rem',
                                    fontSize: '0.9rem',
                                    whiteSpace: 'pre-line',
                                }}
                            >
                                {error}
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                            <button
                                type="button"
                                onClick={onClose}
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
                                onClick={handleFinalize}
                                disabled={!canExecute || executing}
                                style={{
                                    padding: '0.5rem 1.25rem',
                                    background: canExecute && !executing ? '#059669' : '#9ca3af',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: canExecute && !executing ? 'pointer' : 'not-allowed',
                                    fontSize: '0.9rem',
                                    fontWeight: 600,
                                }}
                            >
                                {executing ? '⏳ Exécution...' : '✓ Finaliser la commande'}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </Modal>
    );
}
