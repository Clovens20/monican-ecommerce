'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './returns.module.css';

interface ReturnItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  productId?: string;
}

interface Return {
  id: string;
  order_id: string;
  return_label: string;
  tracking_number: string | null;
  status: string;
  customer_email: string;
  customer_name: string | null;
  reason: string | null;
  items: ReturnItem[];
  product_photo_url: string | null;
  qr_code_url: string | null;
  return_address: any;
  refund_amount: number | null;
  currency: string;
  notes: string | null;
  admin_notes: string | null;
  created_at: string;
  shipped_at: string | null;
  received_at: string | null;
  inspected_at: string | null;
  refunded_at: string | null;
  order_number?: string;
}

export default function ReturnsPage() {
  const [returns, setReturns] = useState<Return[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'in_transit' | 'received' | 'inspected' | 'approved' | 'refunded' | 'rejected'>('all');

  useEffect(() => {
    fetchReturns();
  }, []);

  async function fetchReturns() {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/returns');
      const data = await response.json();
      
      if (data.success) {
        setReturns(data.returns || []);
      } else {
        setError(data.error || 'Erreur lors du chargement des retours');
      }
    } catch (err) {
      console.error('Error fetching returns:', err);
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  }

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { text: string; class: string }> = {
      pending: { text: 'En attente', class: 'pending' },
      in_transit: { text: 'En transit', class: 'inTransit' },
      received: { text: 'Reçu', class: 'received' },
      inspected: { text: 'Inspecté', class: 'inspected' },
      approved: { text: 'Approuvé', class: 'approved' },
      refunded: { text: 'Remboursé', class: 'refunded' },
      rejected: { text: 'Rejeté', class: 'rejected' },
    };
    return badges[status] || { text: status, class: 'unknown' };
  };

  const filteredReturns = returns.filter(r => filter === 'all' || r.status === filter);

  if (loading) {
    return (
      <div className={styles.returnsPage}>
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
          <p>Chargement des retours...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.returnsPage}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Retours</h1>
          <p className={styles.pageSubtitle}>Gérez les retours de produits</p>
        </div>
        <Link href="/admin/returns/refund" className={styles.btnPrimary}>
          💰 Rembourser un Client
        </Link>
      </div>

      <div className={styles.statsBar}>
        <div className={styles.stat}>
          <span className={styles.statValue}>{returns.length}</span>
          <span className={styles.statLabel}>Total</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statValue}>
            {returns.filter(r => r.status === 'pending' || r.status === 'in_transit').length}
          </span>
          <span className={styles.statLabel}>En attente</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statValue}>
            {returns.filter(r => r.status === 'received' || r.status === 'inspected').length}
          </span>
          <span className={styles.statLabel}>À traiter</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statValue}>
            {returns.filter(r => r.status === 'refunded').length}
          </span>
          <span className={styles.statLabel}>Remboursés</span>
        </div>
      </div>

      <div className={styles.filters}>
        <button
          onClick={() => setFilter('all')}
          className={`${styles.filterBtn} ${filter === 'all' ? styles.active : ''}`}
        >
          Tous
        </button>
        <button
          onClick={() => setFilter('pending')}
          className={`${styles.filterBtn} ${filter === 'pending' ? styles.active : ''}`}
        >
          En attente
        </button>
        <button
          onClick={() => setFilter('in_transit')}
          className={`${styles.filterBtn} ${filter === 'in_transit' ? styles.active : ''}`}
        >
          En transit
        </button>
        <button
          onClick={() => setFilter('received')}
          className={`${styles.filterBtn} ${filter === 'received' ? styles.active : ''}`}
        >
          Reçus
        </button>
        <button
          onClick={() => setFilter('inspected')}
          className={`${styles.filterBtn} ${filter === 'inspected' ? styles.active : ''}`}
        >
          Inspectés
        </button>
        <button
          onClick={() => setFilter('refunded')}
          className={`${styles.filterBtn} ${filter === 'refunded' ? styles.active : ''}`}
        >
          Remboursés
        </button>
      </div>

      <div className={styles.returnsList}>
        {filteredReturns.map(returnItem => {
          const statusBadge = getStatusBadge(returnItem.status);
          return (
            <Link
              key={returnItem.id}
              href={`/admin/returns/${returnItem.id}`}
              className={styles.returnCard}
            >
              <div className={styles.returnHeader}>
                <div>
                  <h3 className={styles.returnLabel}>{returnItem.return_label}</h3>
                  <p className={styles.customerInfo}>
                    {returnItem.customer_name || returnItem.customer_email}
                  </p>
                  {returnItem.order_number && (
                    <p className={styles.orderNumber}>Commande: {returnItem.order_number}</p>
                  )}
                </div>
                <span className={`${styles.statusBadge} ${styles[statusBadge.class]}`}>
                  {statusBadge.text}
                </span>
              </div>

              <div className={styles.returnDetails}>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Raison:</span>
                  <span className={styles.detailValue}>{returnItem.reason || 'Non spécifiée'}</span>
                </div>
                {returnItem.tracking_number && (
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Suivi:</span>
                    <span className={styles.trackingNumber}>{returnItem.tracking_number}</span>
                  </div>
                )}
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Articles:</span>
                  <span className={styles.detailValue}>
                    {Array.isArray(returnItem.items) ? returnItem.items.length : 0} article(s)
                  </span>
                </div>
                {returnItem.refund_amount && (
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Remboursement:</span>
                    <span className={styles.refundAmount}>
                      {new Intl.NumberFormat('fr-FR', {
                        style: 'currency',
                        currency: returnItem.currency,
                      }).format(returnItem.refund_amount)}
                    </span>
                  </div>
                )}
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Date:</span>
                  <span className={styles.detailValue}>
                    {new Date(returnItem.created_at).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              </div>

              {returnItem.product_photo_url && (
                <div className={styles.photoPreview}>
                  <img src={returnItem.product_photo_url} alt="Photo du produit" />
                </div>
              )}
            </Link>
          );
        })}
      </div>

      {filteredReturns.length === 0 && (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>📦</div>
          <h3 className={styles.emptyTitle}>Aucun retour trouvé</h3>
          <p className={styles.emptyText}>
            {filter === 'all' 
              ? 'Aucun retour pour le moment'
              : `Aucun retour avec le statut "${getStatusBadge(filter).text}"`}
          </p>
        </div>
      )}
    </div>
  );
}

