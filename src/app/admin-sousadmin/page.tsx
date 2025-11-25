'use client';

import { useState } from 'react';
import { mockOrders, getPendingOrders } from '@/lib/orders';
import { getSubAdminByCode } from '@/lib/mockData';
import OrderDetails from '@/components/subadmin/OrderDetails';
import { Order } from '@/lib/types';

export default function SubAdminPage() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [code, setCode] = useState('');
    const [subAdminName, setSubAdminName] = useState('');
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'processing'>('all');

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        const subAdmin = getSubAdminByCode(code);
        if (subAdmin) {
            setIsLoggedIn(true);
            setSubAdminName(subAdmin.name);
        } else {
            alert('Code invalide ou sous-admin inactif. Essayez: SA-001, SA-002, ou SA-003');
        }
    };

    if (!isLoggedIn) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            }}>
                <form onSubmit={handleLogin} style={{
                    background: 'white',
                    padding: '3rem',
                    borderRadius: '1.5rem',
                    boxShadow: '0 25px 50px rgba(0, 0, 0, 0.2)',
                    width: '100%',
                    maxWidth: '450px'
                }}>
                    <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                            Monican <span style={{ color: '#10b981' }}>Logistics</span>
                        </h1>
                        <p style={{ color: '#6b7280' }}>Accès Sous-admin</p>
                    </div>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: 600, color: '#374151' }}>
                            Code Unique
                        </label>
                        <input
                            type="text"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            placeholder="SA-XXX"
                            style={{
                                width: '100%',
                                padding: '1rem',
                                borderRadius: '0.75rem',
                                border: '2px solid #e5e7eb',
                                fontSize: '1rem',
                                transition: 'border-color 0.2s'
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#667eea'}
                            onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                            required
                        />
                        <p style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '0.5rem' }}>
                            💡 Codes de test: SA-001, SA-002, SA-003
                        </p>
                    </div>
                    <button type="submit" style={{
                        width: '100%',
                        padding: '1rem',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.75rem',
                        fontWeight: 600,
                        fontSize: '1rem',
                        cursor: 'pointer',
                        transition: 'transform 0.2s, box-shadow 0.2s'
                    }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 10px 20px rgba(102, 126, 234, 0.3)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = 'none';
                        }}>
                        Connexion
                    </button>
                </form>
            </div>
        );
    }

    const pendingOrders = getPendingOrders();
    const filteredOrders = filterStatus === 'all'
        ? pendingOrders
        : pendingOrders.filter(o => o.status === filterStatus);

    return (
        <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
            {/* Header */}
            <header style={{
                background: 'white',
                padding: '1.5rem 2rem',
                borderBottom: '1px solid #e5e7eb',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
            }}>
                <div style={{ fontWeight: 'bold', fontSize: '1.5rem' }}>
                    Monican <span style={{ color: '#10b981' }}>Logistics</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>Connecté en tant que</div>
                        <div style={{ fontWeight: 600 }}>{subAdminName} ({code})</div>
                    </div>
                    <button
                        onClick={() => setIsLoggedIn(false)}
                        style={{
                            color: '#ef4444',
                            background: '#fee2e2',
                            border: 'none',
                            padding: '0.75rem 1.5rem',
                            borderRadius: '0.5rem',
                            cursor: 'pointer',
                            fontWeight: 600,
                            transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#fecaca'}
                        onMouseLeave={(e) => e.currentTarget.style.background = '#fee2e2'}
                    >
                        Déconnexion
                    </button>
                </div>
            </header>

            <main style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
                {/* Stats Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
                    <div style={{ background: 'white', padding: '1.5rem', borderRadius: '1rem', border: '1px solid #e5e7eb' }}>
                        <div style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '0.5rem' }}>En Attente</div>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f59e0b' }}>
                            {pendingOrders.filter(o => o.status === 'pending').length}
                        </div>
                    </div>
                    <div style={{ background: 'white', padding: '1.5rem', borderRadius: '1rem', border: '1px solid #e5e7eb' }}>
                        <div style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '0.5rem' }}>En Traitement</div>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#3b82f6' }}>
                            {pendingOrders.filter(o => o.status === 'processing').length}
                        </div>
                    </div>
                    <div style={{ background: 'white', padding: '1.5rem', borderRadius: '1rem', border: '1px solid #e5e7eb' }}>
                        <div style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '0.5rem' }}>Total à Traiter</div>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10b981' }}>
                            {pendingOrders.length}
                        </div>
                    </div>
                </div>

                {/* Filters and Title */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', margin: 0 }}>Commandes à Traiter</h1>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                            onClick={() => setFilterStatus('all')}
                            style={{
                                padding: '0.5rem 1rem',
                                background: filterStatus === 'all' ? '#111827' : 'white',
                                color: filterStatus === 'all' ? 'white' : '#6b7280',
                                border: '1px solid #e5e7eb',
                                borderRadius: '0.5rem',
                                cursor: 'pointer',
                                fontWeight: 500
                            }}
                        >
                            Toutes
                        </button>
                        <button
                            onClick={() => setFilterStatus('pending')}
                            style={{
                                padding: '0.5rem 1rem',
                                background: filterStatus === 'pending' ? '#111827' : 'white',
                                color: filterStatus === 'pending' ? 'white' : '#6b7280',
                                border: '1px solid #e5e7eb',
                                borderRadius: '0.5rem',
                                cursor: 'pointer',
                                fontWeight: 500
                            }}
                        >
                            En Attente
                        </button>
                        <button
                            onClick={() => setFilterStatus('processing')}
                            style={{
                                padding: '0.5rem 1rem',
                                background: filterStatus === 'processing' ? '#111827' : 'white',
                                color: filterStatus === 'processing' ? 'white' : '#6b7280',
                                border: '1px solid #e5e7eb',
                                borderRadius: '0.5rem',
                                cursor: 'pointer',
                                fontWeight: 500
                            }}
                        >
                            En Traitement
                        </button>
                    </div>
                </div>

                {/* Orders Table */}
                <div style={{ background: 'white', borderRadius: '1rem', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead style={{ background: '#f9fafb' }}>
                            <tr>
                                <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontWeight: 600, fontSize: '0.85rem', color: '#6b7280', textTransform: 'uppercase' }}>ID Commande</th>
                                <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontWeight: 600, fontSize: '0.85rem', color: '#6b7280', textTransform: 'uppercase' }}>Client</th>
                                <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontWeight: 600, fontSize: '0.85rem', color: '#6b7280', textTransform: 'uppercase' }}>Pays</th>
                                <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontWeight: 600, fontSize: '0.85rem', color: '#6b7280', textTransform: 'uppercase' }}>Articles</th>
                                <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontWeight: 600, fontSize: '0.85rem', color: '#6b7280', textTransform: 'uppercase' }}>Total</th>
                                <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontWeight: 600, fontSize: '0.85rem', color: '#6b7280', textTransform: 'uppercase' }}>Statut</th>
                                <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid #e5e7eb', fontWeight: 600, fontSize: '0.85rem', color: '#6b7280', textTransform: 'uppercase' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredOrders.map(order => (
                                <tr key={order.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                    <td style={{ padding: '1rem', fontWeight: 600 }}>{order.id}</td>
                                    <td style={{ padding: '1rem' }}>{order.customerName}</td>
                                    <td style={{ padding: '1rem' }}>
                                        {order.shippingAddress.country === 'US' ? '🇺🇸 USA' :
                                            order.shippingAddress.country === 'CA' ? '🇨🇦 Canada' : '🇲🇽 Mexique'}
                                    </td>
                                    <td style={{ padding: '1rem' }}>{order.items.length} produit(s)</td>
                                    <td style={{ padding: '1rem', fontWeight: 600 }}>
                                        {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: order.currency }).format(order.total)}
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <span style={{
                                            padding: '0.375rem 0.875rem',
                                            borderRadius: '9999px',
                                            fontSize: '0.8rem',
                                            fontWeight: 600,
                                            background: order.status === 'pending' ? '#fef3c7' : '#dbeafe',
                                            color: order.status === 'pending' ? '#92400e' : '#1e40af'
                                        }}>
                                            {order.status === 'pending' ? 'En Attente' : 'En Traitement'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <button
                                            style={{
                                                padding: '0.625rem 1.25rem',
                                                background: '#111827',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '0.5rem',
                                                cursor: 'pointer',
                                                fontWeight: 600,
                                                fontSize: '0.9rem',
                                                transition: 'background 0.2s'
                                            }}
                                            onClick={() => setSelectedOrder(order)}
                                            onMouseEnter={(e) => e.currentTarget.style.background = '#000000'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = '#111827'}
                                        >
                                            Voir Détails
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filteredOrders.length === 0 && (
                        <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>
                            Aucune commande à afficher
                        </div>
                    )}
                </div>
            </main>

            {/* Order Details Modal */}
            {selectedOrder && (
                <OrderDetails
                    order={selectedOrder}
                    onClose={() => setSelectedOrder(null)}
                />
            )}
        </div>
    );
}
