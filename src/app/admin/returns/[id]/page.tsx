'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './detail.module.css';

interface ReturnItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  productId?: string;
  image?: string;
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

export default function ReturnDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  
  const [returnItem, setReturnItem] = useState<Return | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [adminNotes, setAdminNotes] = useState('');

  useEffect(() => {
    if (id) {
      fetchReturn();
    }
  }, [id]);

  async function fetchReturn() {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/returns/${id}`);
      const data = await response.json();
      
      if (data.success) {
        setReturnItem(data.return);
        setNewStatus(data.return.status);
        setAdminNotes(data.return.admin_notes || '');
      } else {
        setError(data.error || 'Erreur lors du chargement');
      }
    } catch (err) {
      console.error('Error fetching return:', err);
      setError('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  }

  const handleUpdateStatus = async () => {
    if (!returnItem) return;

    setUpdating(true);
    try {
      const response = await fetch(`/api/admin/returns/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
          admin_notes: adminNotes,
        }),
      });

      const data = await response.json();

      if (data.success) {
        fetchReturn();
        alert('Retour mis à jour avec succès');
      } else {
        alert(data.error || 'Erreur lors de la mise à jour');
      }
    } catch (err) {
      console.error('Error updating return:', err);
      alert('Erreur de connexion');
    } finally {
      setUpdating(false);
    }
  };

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

  if (loading) {
    return (
      <div className={styles.detailPage}>
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
          <p>Chargement...</p>
        </div>
      </div>
    );
  }

  if (error || !returnItem) {
    return (
      <div className={styles.detailPage}>
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⚠️</div>
          <p>{error || 'Retour non trouvé'}</p>
          <button onClick={() => router.back()} className={styles.backBtn}>
            Retour
          </button>
        </div>
      </div>
    );
  }

  const statusBadge = getStatusBadge(returnItem.status);

  return (
    <div className={styles.detailPage}>
      <div className={styles.pageHeader}>
        <button onClick={() => router.back()} className={styles.backBtn}>
          ← Retour
        </button>
        <div>
          <h1 className={styles.pageTitle}>Détails du Retour</h1>
          <p className={styles.pageSubtitle}>{returnItem.return_label}</p>
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.mainSection}>
          <div className={styles.infoCard}>
            <h2>Informations du Retour</h2>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Statut:</span>
                <span className={`${styles.statusBadge} ${styles[statusBadge.class]}`}>
                  {statusBadge.text}
                </span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Étiquette:</span>
                <span className={styles.infoValue}>{returnItem.return_label}</span>
              </div>
              {returnItem.tracking_number && (
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Suivi:</span>
                  <span className={styles.trackingNumber}>{returnItem.tracking_number}</span>
                </div>
              )}
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Commande:</span>
                <span className={styles.infoValue}>{returnItem.order_number || returnItem.order_id}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Client:</span>
                <span className={styles.infoValue}>{returnItem.customer_name || returnItem.customer_email}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Email:</span>
                <span className={styles.infoValue}>{returnItem.customer_email}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Raison:</span>
                <span className={styles.infoValue}>{returnItem.reason || 'Non spécifiée'}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Date de création:</span>
                <span className={styles.infoValue}>
                  {new Date(returnItem.created_at).toLocaleString('fr-FR')}
                </span>
              </div>
              {returnItem.shipped_at && (
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Date d'envoi:</span>
                  <span className={styles.infoValue}>
                    {new Date(returnItem.shipped_at).toLocaleString('fr-FR')}
                  </span>
                </div>
              )}
              {returnItem.received_at && (
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Date de réception:</span>
                  <span className={styles.infoValue}>
                    {new Date(returnItem.received_at).toLocaleString('fr-FR')}
                  </span>
                </div>
              )}
              {returnItem.refunded_at && (
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Date de remboursement:</span>
                  <span className={styles.infoValue}>
                    {new Date(returnItem.refunded_at).toLocaleString('fr-FR')}
                  </span>
                </div>
              )}
              {returnItem.refund_amount && (
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Montant remboursé:</span>
                  <span className={styles.refundAmount}>
                    {new Intl.NumberFormat('fr-FR', {
                      style: 'currency',
                      currency: returnItem.currency,
                    }).format(returnItem.refund_amount)}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className={styles.infoCard}>
            <h2>Articles Retournés</h2>
            <div className={styles.itemsList}>
              {Array.isArray(returnItem.items) && returnItem.items.length > 0 ? (
                returnItem.items.map((item, index) => (
                  <div key={index} className={styles.itemCard}>
                    {item.image && (
                      <img src={item.image} alt={item.name} className={styles.itemImage} />
                    )}
                    <div className={styles.itemInfo}>
                      <h4>{item.name}</h4>
                      <p>Quantité: {item.quantity}</p>
                      <p className={styles.itemPrice}>
                        {new Intl.NumberFormat('fr-FR', {
                          style: 'currency',
                          currency: returnItem.currency,
                        }).format((item.price || 0) * (item.quantity || 1))}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p>Aucun article</p>
              )}
            </div>
          </div>

          {returnItem.product_photo_url && (
            <div className={styles.infoCard}>
              <h2>Photo du Produit</h2>
              <img 
                src={returnItem.product_photo_url} 
                alt="Photo du produit retourné" 
                className={styles.productPhoto}
              />
            </div>
          )}

          {returnItem.notes && (
            <div className={styles.infoCard}>
              <h2>Notes du Client</h2>
              <p className={styles.notes}>{returnItem.notes}</p>
            </div>
          )}
        </div>

        <div className={styles.sidebar}>
          <div className={styles.actionCard}>
            <h2>Actions</h2>
            
            <div className={styles.formGroup}>
              <label className={styles.label}>Mettre à jour le statut</label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className={styles.select}
              >
                <option value="pending">En attente</option>
                <option value="in_transit">En transit</option>
                <option value="received">Reçu</option>
                <option value="inspected">Inspecté</option>
                <option value="approved">Approuvé</option>
                <option value="refunded">Remboursé</option>
                <option value="rejected">Rejeté</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Notes Admin</label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={5}
                className={styles.textarea}
                placeholder="Ajoutez des notes sur l'inspection ou le traitement..."
              />
            </div>

            <button
              onClick={handleUpdateStatus}
              disabled={updating}
              className={styles.updateBtn}
            >
              {updating ? '⏳ Mise à jour...' : 'Mettre à jour'}
            </button>

            {returnItem.status === 'inspected' || returnItem.status === 'approved' ? (
              <Link
                href={`/admin/returns/refund?orderId=${returnItem.order_id}`}
                className={styles.refundBtn}
              >
                💰 Rembourser
              </Link>
            ) : null}
          </div>

          {returnItem.return_address && (
            <div className={styles.infoCard}>
              <h3>Adresse de Retour</h3>
              <div className={styles.address}>
                <div><strong>{returnItem.return_address.name}</strong></div>
                <div>{returnItem.return_address.street}</div>
                <div>{returnItem.return_address.city}, {returnItem.return_address.state} {returnItem.return_address.zip}</div>
                <div>{returnItem.return_address.country}</div>
                {returnItem.return_address.phone && (
                  <div>Tel: {returnItem.return_address.phone}</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

