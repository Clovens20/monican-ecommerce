// CHEMIN: src/app/admin/products/page.tsx
// ACTION: REMPLACER TOUT LE CONTENU

'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import styles from './products.module.css';
import { filterVariantsByCategory } from '@/lib/product-utils';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  images: Array<{ url: string; alt?: string }>;
  isNew: boolean;
  isFeatured: boolean;
  isActive: boolean;
  variants?: Array<{ size: string; stock: number; sku: string }>;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [updatingProducts, setUpdatingProducts] = useState<Set<string>>(new Set());
  const [deletingProducts, setDeletingProducts] = useState<Set<string>>(new Set());
  const [physicalSaleModal, setPhysicalSaleModal] = useState<{
    open: boolean;
    product: Product | null;
    inventory: Array<{ size: string; color: string | null; stock: number }> | null;
  }>({
    open: false,
    product: null,
    inventory: null,
  });
  const [physicalSaleData, setPhysicalSaleData] = useState({
    quantity: 1,
    size: '',
    color: '',
  });
  const [recordingSale, setRecordingSale] = useState(false);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const response = await fetch('/api/admin/products');
        const data = await response.json();
        
        if (data.success) {
          setProducts(data.products);
        } else {
          setError(data.error || 'Erreur lors du chargement des produits');
        }
      } catch (err) {
        console.error('Error fetching products:', err);
        setError('Erreur de connexion au serveur');
      } finally {
        setLoading(false);
      }
    }
    
    fetchProducts();
  }, []);

  const categories = ['all', 'jeans', 'maillot', 'chemise', 'tennis'];
  
  const filteredProducts = products.filter(product => {
    const matchesCategory = filter === 'all' || product.category === filter;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesActiveFilter = showInactive ? true : (product.isActive !== false);
    return matchesCategory && matchesSearch && matchesActiveFilter;
  });

  const handleToggleActive = async (productId: string, currentStatus: boolean) => {
    try {
      setUpdatingProducts(prev => new Set(prev).add(productId));
      
      const response = await fetch(`/api/admin/products/${productId}/toggle-active`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      const data = await response.json();

      if (data.success) {
        // Mettre à jour l'état local
        setProducts(prevProducts =>
          prevProducts.map(p =>
            p.id === productId ? { ...p, isActive: !currentStatus } : p
          )
        );
      } else {
        alert(data.error || 'Erreur lors de la mise à jour');
      }
    } catch (err) {
      console.error('Error toggling product status:', err);
      alert('Erreur de connexion au serveur');
    } finally {
      setUpdatingProducts(prev => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });
    }
  };

  const handleOpenPhysicalSaleModal = async (product: Product) => {
    try {
      // Récupérer l'inventaire du produit pour afficher les tailles/couleurs disponibles
      const response = await fetch(`/api/admin/products/${product.id}`);
      const data = await response.json();
      
      if (data.success && data.product) {
        // Construire la liste des entrées d'inventaire disponibles
        const inventoryEntries: Array<{ size: string; color: string | null; stock: number }> = [];
        
        if (data.product.colorSizeStocks && data.product.colorSizeStocks.length > 0) {
          data.product.colorSizeStocks.forEach((entry: any) => {
            if (entry.stock > 0) {
              inventoryEntries.push({
                size: entry.size,
                color: entry.color || null,
                stock: entry.stock,
              });
            }
          });
        } else if (data.product.variants && data.product.variants.length > 0) {
          data.product.variants.forEach((variant: any) => {
            if (variant.stock > 0) {
              inventoryEntries.push({
                size: variant.size,
                color: null,
                stock: variant.stock,
              });
            }
          });
        }

        setPhysicalSaleModal({
          open: true,
          product,
          inventory: inventoryEntries.length > 0 ? inventoryEntries : null,
        });
        setPhysicalSaleData({
          quantity: 1,
          size: inventoryEntries.length > 0 ? inventoryEntries[0].size : '',
          color: inventoryEntries.length > 0 && inventoryEntries[0].color ? inventoryEntries[0].color : '',
        });
      } else {
        alert('Erreur lors du chargement des informations du produit');
      }
    } catch (err) {
      console.error('Error opening physical sale modal:', err);
      alert('Erreur lors du chargement des informations du produit');
    }
  };

  const handleClosePhysicalSaleModal = () => {
    setPhysicalSaleModal({ open: false, product: null, inventory: null });
    setPhysicalSaleData({ quantity: 1, size: '', color: '' });
  };

  const handleRecordPhysicalSale = async () => {
    if (!physicalSaleModal.product) return;

    if (physicalSaleData.quantity <= 0) {
      alert('La quantité doit être supérieure à 0');
      return;
    }

    try {
      setRecordingSale(true);

      const response = await fetch(`/api/admin/products/${physicalSaleModal.product.id}/physical-sale`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quantity: physicalSaleData.quantity,
          size: physicalSaleData.size || undefined,
          color: physicalSaleData.color || undefined,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert(`✅ ${data.message}\nStock restant: ${data.remainingStock || 'Voir détails'}`);
        handleClosePhysicalSaleModal();
        // Rafraîchir la liste des produits
        const refreshResponse = await fetch('/api/admin/products');
        const refreshData = await refreshResponse.json();
        if (refreshData.success) {
          setProducts(refreshData.products);
        }
      } else {
        alert(data.error || 'Erreur lors de l\'enregistrement de la vente');
      }
    } catch (err) {
      console.error('Error recording physical sale:', err);
      alert('Erreur de connexion au serveur');
    } finally {
      setRecordingSale(false);
    }
  };

  const handleDelete = async (productId: string, productName: string) => {
    // Demander confirmation avant de supprimer
    const confirmed = window.confirm(
      `Êtes-vous sûr de vouloir supprimer le produit "${productName}" ?\n\nCette action désactivera le produit (soft delete).`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingProducts(prev => new Set(prev).add(productId));
      
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        // Retirer le produit de la liste
        setProducts(prevProducts =>
          prevProducts.filter(p => p.id !== productId)
        );
        alert('Produit supprimé avec succès');
      } else {
        alert(data.error || 'Erreur lors de la suppression');
      }
    } catch (err) {
      console.error('Error deleting product:', err);
      alert('Erreur de connexion au serveur');
    } finally {
      setDeletingProducts(prev => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });
    }
  };

  if (loading) {
    return (
      <div className={styles.productsPage}>
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
          <p>Chargement des produits...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.productsPage}>
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⚠️</div>
          <p>{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            style={{ marginTop: '1rem', padding: '0.5rem 1rem', background: '#10b981', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer' }}
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.productsPage}>
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Produits</h1>
          <p className={styles.pageSubtitle}>Gérez votre catalogue de produits</p>
        </div>
        <div className={styles.headerActions}>
          <Link href="/admin/products/import" className={styles.btnSecondary}>
            📥 Importer CSV
          </Link>
          <Link href="/admin/products/new" className={styles.btnPrimary}>
            ➕ Nouveau produit
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        <div className={styles.searchBox}>
          <span className={styles.searchIcon}>🔍</span>
          <input
            type="search"
            placeholder="Rechercher un produit..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <div className={styles.categoryFilters}>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`${styles.filterBtn} ${filter === cat ? styles.active : ''}`}
            >
              {cat === 'all' ? 'Tous' : cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>

        <div className={styles.toggleSection}>
          <label className={styles.toggleLabel}>
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className={styles.toggleCheckbox}
            />
            <span>Afficher les produits désactivés</span>
          </label>
        </div>
      </div>

      {/* Stats Bar */}
      <div className={styles.statsBar}>
        <div className={styles.stat}>
          <span className={styles.statValue}>{filteredProducts.length}</span>
          <span className={styles.statLabel}>Produits</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statValue}>
            {filteredProducts.reduce((sum, p) => {
              if (p.variants && Array.isArray(p.variants)) {
                return sum + p.variants.reduce((s, v) => s + (v.stock || 0), 0);
              }
              return sum;
            }, 0)}
          </span>
          <span className={styles.statLabel}>En stock</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statValue}>4</span>
          <span className={styles.statLabel}>Catégories</span>
        </div>
      </div>

      {/* Products Grid */}
      <div className={styles.productsGrid}>
        {filteredProducts.map(product => (
          <div key={product.id} className={`${styles.productCard} ${product.isActive === false ? styles.inactiveProduct : ''}`}>
            <div className={styles.productImage}>
              <div className={styles.imagePlaceholder}>
                {product.images && product.images.length > 0 ? (
                  <img src={product.images[0].url} alt={product.images[0].alt || product.name} />
                ) : (
                  <span className={styles.noImage}>📷</span>
                )}
              </div>
              <div className={styles.productBadges}>
                <span className={styles.badge}>{product.category}</span>
                {product.isNew && <span className={`${styles.badge} ${styles.new}`}>Nouveau</span>}
                {product.isFeatured && <span className={`${styles.badge} ${styles.featured}`}>Vedette</span>}
                {product.variants && Array.isArray(product.variants) && product.variants.reduce((s, v) => s + (v.stock || 0), 0) < 10 && (
                  <span className={`${styles.badge} ${styles.warning}`}>Stock bas</span>
                )}
              </div>
            </div>

            <div className={styles.productInfo}>
              <h3 className={styles.productName}>{product.name}</h3>
              <p className={styles.productDescription}>{product.description}</p>

              <div className={styles.productMeta}>
                <div className={styles.productPrice}>
                  {new Intl.NumberFormat('fr-FR', {
                    style: 'currency',
                    currency: 'USD'
                  }).format(product.price)}
                </div>
                <div className={styles.productStock}>
                  {product.variants && Array.isArray(product.variants) 
                    ? `${product.variants.reduce((s, v) => s + (v.stock || 0), 0)} en stock`
                    : 'Stock non disponible'}
                </div>
              </div>

              {product.variants && Array.isArray(product.variants) && product.variants.length > 0 && (
                <div className={styles.productSizes}>
                  {filterVariantsByCategory(product.variants, product.category).map((v, idx) => (
                    <span key={v.sku || idx} className={styles.sizeTag}>
                      {v.size || 'N/A'}
                    </span>
                  ))}
                </div>
              )}

              <div className={styles.productStatus}>
                <label className={styles.toggleSwitch}>
                  <input
                    type="checkbox"
                    checked={product.isActive !== false}
                    onChange={() => handleToggleActive(product.id, product.isActive !== false)}
                    disabled={updatingProducts.has(product.id)}
                    className={styles.toggleInput}
                  />
                  <span className={`${styles.toggleSlider} ${product.isActive !== false ? styles.active : styles.inactive}`}>
                    <span className={styles.toggleText}>
                      {product.isActive !== false ? 'Actif' : 'Inactif'}
                    </span>
                  </span>
                </label>
                {updatingProducts.has(product.id) && (
                  <span className={styles.updatingIndicator}>⏳</span>
                )}
              </div>

              <div className={styles.productActions}>
                <Link href={`/product/${product.id}`} className={styles.actionBtn}>
                  👁️ Voir
                </Link>
                <Link href={`/admin/products/edit/${product.id}`} className={styles.actionBtn}>
                  ✏️ Modifier
                </Link>
                <button 
                  className={`${styles.actionBtn} ${styles.physicalSale}`}
                  onClick={() => handleOpenPhysicalSaleModal(product)}
                  title="Enregistrer une vente en magasin physique"
                >
                  🏪 Vente physique
                </button>
                <button 
                  className={`${styles.actionBtn} ${styles.danger}`}
                  onClick={() => handleDelete(product.id, product.name)}
                  disabled={deletingProducts.has(product.id)}
                >
                  {deletingProducts.has(product.id) ? '⏳ Suppression...' : '🗑️ Supprimer'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>📦</div>
          <h3 className={styles.emptyTitle}>Aucun produit trouvé</h3>
          <p className={styles.emptyText}>
            {searchQuery 
              ? `Aucun produit ne correspond à "${searchQuery}"`
              : 'Commencez par ajouter votre premier produit'}
          </p>
          <Link href="/admin/products/new" className={styles.btnPrimary}>
            ➕ Ajouter un produit
          </Link>
        </div>
      )}

      {/* Modal pour enregistrer une vente physique */}
      {physicalSaleModal.open && physicalSaleModal.product && (
        <div className={styles.modalOverlay} onClick={handleClosePhysicalSaleModal}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Enregistrer une vente physique</h2>
              <button 
                className={styles.modalClose}
                onClick={handleClosePhysicalSaleModal}
              >
                ✕
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.modalProductInfo}>
                <h3>{physicalSaleModal.product.name}</h3>
                <p className={styles.modalProductCategory}>{physicalSaleModal.product.category}</p>
              </div>

              <div className={styles.modalForm}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    Quantité vendue <span className={styles.required}>*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    className={styles.formInput}
                    value={physicalSaleData.quantity}
                    onChange={(e) => setPhysicalSaleData({
                      ...physicalSaleData,
                      quantity: parseInt(e.target.value) || 1
                    })}
                    required
                  />
                </div>

                {physicalSaleModal.inventory && physicalSaleModal.inventory.length > 0 && (
                  <>
                    {/* Si plusieurs tailles disponibles */}
                    {new Set(physicalSaleModal.inventory.map(i => i.size)).size > 1 && (
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Taille (optionnel)</label>
                        <select
                          className={styles.formInput}
                          value={physicalSaleData.size}
                          onChange={(e) => setPhysicalSaleData({
                            ...physicalSaleData,
                            size: e.target.value
                          })}
                        >
                          <option value="">Toutes les tailles</option>
                          {Array.from(new Set(physicalSaleModal.inventory.map(i => i.size))).map(size => (
                            <option key={size} value={size}>
                              {size} ({physicalSaleModal.inventory!.filter(i => i.size === size).reduce((sum, i) => sum + i.stock, 0)} en stock)
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Si plusieurs couleurs disponibles */}
                    {new Set(physicalSaleModal.inventory.map(i => i.color).filter(Boolean)).size > 1 && (
                      <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Couleur (optionnel)</label>
                        <select
                          className={styles.formInput}
                          value={physicalSaleData.color}
                          onChange={(e) => setPhysicalSaleData({
                            ...physicalSaleData,
                            color: e.target.value
                          })}
                        >
                          <option value="">Toutes les couleurs</option>
                          {Array.from(new Set(physicalSaleModal.inventory.map(i => i.color).filter(Boolean))).map(color => (
                            <option key={color} value={color || ''}>
                              {color} ({physicalSaleModal.inventory!.filter(i => i.color === color).reduce((sum, i) => sum + i.stock, 0)} en stock)
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </>
                )}

                <div className={styles.modalInfo}>
                  <p>💡 Le stock en ligne sera automatiquement déduit après l'enregistrement.</p>
                </div>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button
                className={styles.modalBtnSecondary}
                onClick={handleClosePhysicalSaleModal}
                disabled={recordingSale}
              >
                Annuler
              </button>
              <button
                className={styles.modalBtnPrimary}
                onClick={handleRecordPhysicalSale}
                disabled={recordingSale || physicalSaleData.quantity <= 0}
              >
                {recordingSale ? '⏳ Enregistrement...' : '✅ Enregistrer la vente'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}