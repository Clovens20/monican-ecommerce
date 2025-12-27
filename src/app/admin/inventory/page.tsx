'use client';

import { useState, useEffect } from 'react';
import styles from './inventory.module.css';

interface InventorySummary {
  totalValue: number;
  totalItems: number;
  totalProducts: number;
}

interface ProductInventory {
  productId: string;
  productName: string;
  category: string;
  price: number;
  stock: number;
  reserved: number;
  available: number;
  value: number;
}

interface InventoryData {
  summary: InventorySummary;
  products: ProductInventory[];
}

export default function InventoryPage() {
  const [data, setData] = useState<InventoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchInventory = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/admin/inventory/value');
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors du chargement de l\'inventaire');
      }

      if (result.success) {
        setData(result);
        setLastUpdated(new Date());
      } else {
        throw new Error('Réponse invalide du serveur');
      }
    } catch (err) {
      console.error('Error fetching inventory:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
    
    // Rafraîchir automatiquement toutes les 30 secondes
    const interval = setInterval(fetchInventory, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(date);
  };

  if (loading && !data) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Chargement de l'inventaire...</div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <p>Erreur: {error}</p>
          <button onClick={fetchInventory} className={styles.retryButton}>
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Inventaire</h1>
          <p className={styles.subtitle}>
            Valeur totale des produits en stock
          </p>
        </div>
        <div className={styles.headerActions}>
          <button 
            onClick={fetchInventory} 
            className={styles.refreshButton}
            disabled={loading}
          >
            {loading ? '⏳' : '🔄'} Actualiser
          </button>
          <span className={styles.lastUpdated}>
            Dernière mise à jour: {formatDate(lastUpdated)}
          </span>
        </div>
      </div>

      {error && (
        <div className={styles.errorBanner}>
          <span>⚠️ {error}</span>
        </div>
      )}

      {data && (
        <>
          {/* Résumé */}
          <div className={styles.summaryCards}>
            <div className={styles.summaryCard}>
              <div className={styles.summaryCardIcon}>💰</div>
              <div className={styles.summaryCardContent}>
                <div className={styles.summaryCardLabel}>Valeur Totale</div>
                <div className={styles.summaryCardValue}>
                  {formatCurrency(data.summary.totalValue)}
                </div>
              </div>
            </div>

            <div className={styles.summaryCard}>
              <div className={styles.summaryCardIcon}>📦</div>
              <div className={styles.summaryCardContent}>
                <div className={styles.summaryCardLabel}>Unités en Stock</div>
                <div className={styles.summaryCardValue}>
                  {data.summary.totalItems.toLocaleString('fr-FR')}
                </div>
              </div>
            </div>

            <div className={styles.summaryCard}>
              <div className={styles.summaryCardIcon}>🏷️</div>
              <div className={styles.summaryCardContent}>
                <div className={styles.summaryCardLabel}>Produits</div>
                <div className={styles.summaryCardValue}>
                  {data.summary.totalProducts}
                </div>
              </div>
            </div>
          </div>

          {/* Liste des produits */}
          <div className={styles.productsSection}>
            <h2 className={styles.sectionTitle}>Détail par Produit</h2>
            
            {data.products.length === 0 ? (
              <div className={styles.emptyState}>
                <p>Aucun produit en stock</p>
              </div>
            ) : (
              <div className={styles.tableContainer}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Produit</th>
                      <th>Catégorie</th>
                      <th>Prix unitaire</th>
                      <th>Stock total</th>
                      <th>Réservé</th>
                      <th>Disponible</th>
                      <th>Valeur</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.products.map((product) => (
                      <tr key={product.productId}>
                        <td className={styles.productName}>{product.productName}</td>
                        <td className={styles.category}>{product.category}</td>
                        <td className={styles.price}>{formatCurrency(product.price)}</td>
                        <td className={styles.stock}>{product.stock}</td>
                        <td className={styles.reserved}>{product.reserved}</td>
                        <td className={styles.available}>
                          <span className={product.available > 0 ? styles.availableBadge : styles.outOfStockBadge}>
                            {product.available}
                          </span>
                        </td>
                        <td className={styles.value}>{formatCurrency(product.value)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

