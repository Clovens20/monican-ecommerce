'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import styles from './refund.module.css';

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  productId?: string;
  image?: string;
}

interface Order {
  id: string;
  order_number: string;
  tracking_number: string | null;
  customer_name: string;
  customer_email: string;
  items: OrderItem[];
  total: number;
  currency: string;
  payment_method: string;
  payment_id: string | null;
}

interface ReturnItem {
  returnId: string;
  orderId: string;
  items: OrderItem[];
}

function RefundPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState<'search' | 'select' | 'confirm'>('search');
  const [searchValue, setSearchValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [returnItems, setReturnItems] = useState<ReturnItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [refundAmount, setRefundAmount] = useState(0);
  const [refundMethod, setRefundMethod] = useState<'original' | 'manual'>('original');
  const [processing, setProcessing] = useState(false);

  const handleAutoSearch = async (identifier: string) => {
    setError(null);
    setLoading(true);

    try {
      const response = await fetch(`/api/admin/orders/search?identifier=${encodeURIComponent(identifier)}`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Commande non trouvée');
      }

      setOrder(data.order);

      // Vérifier s'il y a des retours pour cette commande
      const returnsResponse = await fetch(`/api/admin/returns?orderId=${data.order.id}`);
      const returnsData = await returnsResponse.json();

      if (returnsData.success && returnsData.returns && returnsData.returns.length > 0) {
        const returnedItems: ReturnItem[] = returnsData.returns.map((ret: any) => ({
          returnId: ret.id,
          orderId: ret.order_id,
          items: Array.isArray(ret.items) ? ret.items : [],
        }));
        setReturnItems(returnedItems);
        setStep('select');
      } else {
        setReturnItems([{
          returnId: '',
          orderId: data.order.id,
          items: data.order.items || [],
        }]);
        setStep('select');
      }

    } catch (err: any) {
      setError(err.message || 'Erreur lors de la recherche');
    } finally {
      setLoading(false);
    }
  };

  // Si orderId est dans les paramètres, rechercher automatiquement
  useEffect(() => {
    const orderId = searchParams.get('orderId');
    if (orderId) {
      setSearchValue(orderId);
      handleAutoSearch(orderId);
    }
     
  }, [searchParams]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchValue.trim()) {
      setError('Veuillez entrer un numéro de commande ou de suivi');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const response = await fetch(`/api/admin/orders/search?identifier=${encodeURIComponent(searchValue.trim())}`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Commande non trouvée');
      }

      setOrder(data.order);

      // Vérifier s'il y a des retours pour cette commande
      const returnsResponse = await fetch(`/api/admin/returns?orderId=${data.order.id}`);
      const returnsData = await returnsResponse.json();

      if (returnsData.success && returnsData.returns && returnsData.returns.length > 0) {
        // Il y a des retours, afficher les produits retournés
        const returnedItems: ReturnItem[] = returnsData.returns.map((ret: any) => ({
          returnId: ret.id,
          orderId: ret.order_id,
          items: Array.isArray(ret.items) ? ret.items : [],
        }));
        setReturnItems(returnedItems);
        setStep('select');
      } else {
        // Pas de retour, afficher tous les produits de la commande
        setReturnItems([{
          returnId: '',
          orderId: data.order.id,
          items: data.order.items || [],
        }]);
        setStep('select');
      }

    } catch (err: any) {
      setError(err.message || 'Erreur lors de la recherche');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = () => {
    if (!order) return;
    
    const allItemIds = new Set<string>();
    returnItems.forEach(returnItem => {
      returnItem.items.forEach(item => {
        allItemIds.add(item.productId || item.id);
      });
    });

    if (selectedItems.size === allItemIds.size) {
      setSelectedItems(new Set());
      setRefundAmount(0);
    } else {
      setSelectedItems(allItemIds);
      calculateRefund(allItemIds);
    }
  };

  const handleSelectItem = (itemId: string, price: number, quantity: number) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
    calculateRefund(newSelected);
  };

  const calculateRefund = (selected: Set<string>) => {
    let total = 0;
    returnItems.forEach(returnItem => {
      returnItem.items.forEach(item => {
        const itemId = item.productId || item.id;
        if (selected.has(itemId)) {
          total += (item.price || 0) * (item.quantity || 1);
        }
      });
    });
    setRefundAmount(total);
  };

  const handleRefund = async () => {
    if (selectedItems.size === 0) {
      setError('Veuillez sélectionner au moins un produit à rembourser');
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const itemsToRefund = returnItems.flatMap(returnItem => 
        returnItem.items.filter(item => {
          const itemId = item.productId || item.id;
          return selectedItems.has(itemId);
        })
      );

      const response = await fetch('/api/admin/returns/refund', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: order!.id,
          returnIds: returnItems.map(r => r.returnId).filter(Boolean),
          items: itemsToRefund,
          refundAmount,
          refundMethod,
          currency: order!.currency,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Erreur lors du remboursement');
      }

      alert(`Remboursement effectué avec succès ! Montant: ${new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: order!.currency,
      }).format(refundAmount)}`);
      
      router.push('/admin/returns');

    } catch (err: any) {
      setError(err.message || 'Erreur lors du remboursement');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className={styles.refundPage}>
      <div className={styles.pageHeader}>
        <button
          onClick={() => router.back()}
          className={styles.backBtn}
        >
          ← Retour
        </button>
        <div>
          <h1 className={styles.pageTitle}>Rembourser un Client</h1>
          <p className={styles.pageSubtitle}>
            Recherchez une commande et sélectionnez les produits à rembourser
          </p>
        </div>
      </div>

      {step === 'search' && (
        <div className={styles.searchSection}>
          <form onSubmit={handleSearch} className={styles.searchForm}>
            <div className={styles.formGroup}>
              <label className={styles.label}>
                Numéro de Commande / Numéro de Suivi *
              </label>
              <input
                type="text"
                value={searchValue}
                onChange={(e) => {
                  setSearchValue(e.target.value);
                  setError(null);
                }}
                placeholder="Ex: ORD-001, TRACK-123456"
                required
                className={styles.input}
              />
              <small className={styles.helpText}>
                Entrez le numéro de commande ou le numéro de suivi
              </small>
            </div>

            {error && (
              <div className={styles.error}>
                ⚠️ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !searchValue.trim()}
              className={styles.submitBtn}
            >
              {loading ? '⏳ Recherche...' : 'Rechercher'}
            </button>
          </form>
        </div>
      )}

      {step === 'select' && order && (
        <div className={styles.selectSection}>
          <div className={styles.orderInfo}>
            <h2>Commande: {order.order_number}</h2>
            <div className={styles.customerInfo}>
              <p><strong>Client:</strong> {order.customer_name}</p>
              <p><strong>Email:</strong> {order.customer_email}</p>
              <p><strong>Méthode de paiement:</strong> {order.payment_method}</p>
            </div>
          </div>

          <div className={styles.productsSection}>
            <div className={styles.sectionHeader}>
              <h3>Produits {returnItems.some(r => r.returnId) ? 'Retournés' : 'de la Commande'}</h3>
              <button
                onClick={handleSelectAll}
                className={styles.selectAllBtn}
              >
                {selectedItems.size === returnItems.flatMap(r => r.items).length 
                  ? 'Tout désélectionner' 
                  : 'Tout sélectionner'}
              </button>
            </div>

            <div className={styles.productsList}>
              {returnItems.flatMap(returnItem => 
                returnItem.items.map((item, index) => {
                  const itemId = item.productId || item.id;
                  const isSelected = selectedItems.has(itemId);
                  const itemTotal = (item.price || 0) * (item.quantity || 1);

                  return (
                    <div
                      key={`${returnItem.returnId}-${itemId}-${index}`}
                      className={`${styles.productCard} ${isSelected ? styles.selected : ''}`}
                      onClick={() => handleSelectItem(itemId, item.price || 0, item.quantity || 1)}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleSelectItem(itemId, item.price || 0, item.quantity || 1)}
                        className={styles.checkbox}
                      />
                      {item.image && (
                        <img src={item.image} alt={item.name} className={styles.productImage} />
                      )}
                      <div className={styles.productInfo}>
                        <h4>{item.name}</h4>
                        <p>Quantité: {item.quantity}</p>
                        <p className={styles.productPrice}>
                          {new Intl.NumberFormat('fr-FR', {
                            style: 'currency',
                            currency: order.currency,
                          }).format(itemTotal)}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {selectedItems.size > 0 && (
              <div className={styles.refundSummary}>
                <h3>Résumé du Remboursement</h3>
                <div className={styles.summaryRow}>
                  <span>Produits sélectionnés:</span>
                  <span>{selectedItems.size}</span>
                </div>
                <div className={styles.summaryRow}>
                  <span>Montant total:</span>
                  <span className={styles.refundAmount}>
                    {new Intl.NumberFormat('fr-FR', {
                      style: 'currency',
                      currency: order.currency,
                    }).format(refundAmount)}
                  </span>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Méthode de remboursement</label>
                  <select
                    value={refundMethod}
                    onChange={(e) => setRefundMethod(e.target.value as 'original' | 'manual')}
                    className={styles.select}
                  >
                    <option value="original">Méthode de paiement originale</option>
                    <option value="manual">Remboursement manuel</option>
                  </select>
                </div>

                {error && (
                  <div className={styles.error}>
                    ⚠️ {error}
                  </div>
                )}

                <button
                  onClick={handleRefund}
                  disabled={processing || selectedItems.size === 0}
                  className={styles.refundBtn}
                >
                  {processing ? '⏳ Traitement...' : `💰 Rembourser ${new Intl.NumberFormat('fr-FR', {
                    style: 'currency',
                    currency: order.currency,
                  }).format(refundAmount)}`}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function RefundPage() {
  return (
    <Suspense fallback={<div className={styles.refundPage}>Chargement...</div>}>
      <RefundPageContent />
    </Suspense>
  );
}

