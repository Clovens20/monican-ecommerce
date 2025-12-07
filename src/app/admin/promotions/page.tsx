'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './promotions.module.css';

interface Promotion {
  id: string;
  name: string;
  description: string | null;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  applies_to: 'all' | 'category' | 'product' | 'products';
  category: string | null;
  product_ids: string[];
  start_date: string;
  end_date: string;
  is_active: boolean;
  priority: number;
  promo_code: string | null;
  min_purchase_amount: number;
  max_uses: number | null;
  current_uses: number;
  banner_image_url: string | null;
  banner_text: string | null;
  created_at: string;
  updated_at: string;
}

export default function PromotionsPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    discount_type: 'percentage' as 'percentage' | 'fixed',
    discount_value: 0,
    applies_to: 'all' as 'all' | 'category' | 'product' | 'products',
    category: '',
    product_ids: [] as string[],
    start_date: '',
    end_date: '',
    is_active: true,
    priority: 0,
    promo_code: '',
    min_purchase_amount: 0,
    max_uses: null as number | null,
    banner_text: '',
  });

  useEffect(() => {
    fetchPromotions();
  }, []);

  async function fetchPromotions() {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/promotions');
      const data = await response.json();
      
      if (data.success) {
        setPromotions(data.promotions || []);
      } else {
        setError(data.error || 'Erreur lors du chargement des promotions');
      }
    } catch (err) {
      console.error('Error fetching promotions:', err);
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingPromotion 
        ? `/api/admin/promotions/${editingPromotion.id}`
        : '/api/admin/promotions';
      
      const method = editingPromotion ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setShowModal(false);
        setEditingPromotion(null);
        resetForm();
        fetchPromotions();
      } else {
        alert(data.error || 'Erreur lors de la sauvegarde');
      }
    } catch (err) {
      console.error('Error saving promotion:', err);
      alert('Erreur de connexion au serveur');
    }
  };

  const handleEdit = (promotion: Promotion) => {
    setEditingPromotion(promotion);
    setFormData({
      name: promotion.name,
      description: promotion.description || '',
      discount_type: promotion.discount_type,
      discount_value: promotion.discount_value,
      applies_to: promotion.applies_to,
      category: promotion.category || '',
      product_ids: promotion.product_ids || [],
      start_date: promotion.start_date.split('T')[0],
      end_date: promotion.end_date.split('T')[0],
      is_active: promotion.is_active,
      priority: promotion.priority,
      promo_code: promotion.promo_code || '',
      min_purchase_amount: promotion.min_purchase_amount,
      max_uses: promotion.max_uses,
      banner_text: promotion.banner_text || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette promotion ?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/promotions/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        fetchPromotions();
      } else {
        alert(data.error || 'Erreur lors de la suppression');
      }
    } catch (err) {
      console.error('Error deleting promotion:', err);
      alert('Erreur de connexion au serveur');
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/promotions/${id}/toggle-active`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      const data = await response.json();

      if (data.success) {
        fetchPromotions();
      } else {
        alert(data.error || 'Erreur lors de la mise à jour');
      }
    } catch (err) {
      console.error('Error toggling promotion:', err);
      alert('Erreur de connexion au serveur');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      discount_type: 'percentage',
      discount_value: 0,
      applies_to: 'all',
      category: '',
      product_ids: [],
      start_date: '',
      end_date: '',
      is_active: true,
      priority: 0,
      promo_code: '',
      min_purchase_amount: 0,
      max_uses: null,
      banner_text: '',
    });
  };

  const getStatus = (promotion: Promotion) => {
    const now = new Date();
    const start = new Date(promotion.start_date);
    const end = new Date(promotion.end_date);

    if (!promotion.is_active) return { text: 'Inactive', class: 'inactive' };
    if (now < start) return { text: 'À venir', class: 'upcoming' };
    if (now > end) return { text: 'Expirée', class: 'expired' };
    return { text: 'Active', class: 'active' };
  };

  const formatDiscount = (promotion: Promotion) => {
    if (promotion.discount_type === 'percentage') {
      return `${promotion.discount_value}%`;
    }
    return `$${promotion.discount_value.toFixed(2)}`;
  };

  if (loading) {
    return (
      <div className={styles.promotionsPage}>
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
          <p>Chargement des promotions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.promotionsPage}>
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Promotions</h1>
          <p className={styles.pageSubtitle}>Gérez les promotions et réductions</p>
        </div>
        <button 
          onClick={() => {
            resetForm();
            setEditingPromotion(null);
            setShowModal(true);
          }}
          className={styles.btnPrimary}
        >
          ➕ Nouvelle promotion
        </button>
      </div>

      {/* Stats Bar */}
      <div className={styles.statsBar}>
        <div className={styles.stat}>
          <span className={styles.statValue}>{promotions.length}</span>
          <span className={styles.statLabel}>Total</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statValue}>
            {promotions.filter(p => {
              const now = new Date();
              const start = new Date(p.start_date);
              const end = new Date(p.end_date);
              return p.is_active && now >= start && now <= end;
            }).length}
          </span>
          <span className={styles.statLabel}>Actives</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statValue}>
            {promotions.filter(p => {
              const now = new Date();
              const start = new Date(p.start_date);
              return p.is_active && now < start;
            }).length}
          </span>
          <span className={styles.statLabel}>À venir</span>
        </div>
      </div>

      {/* Promotions List */}
      <div className={styles.promotionsGrid}>
        {promotions.map(promotion => {
          const status = getStatus(promotion);
          return (
            <div key={promotion.id} className={styles.promotionCard}>
              <div className={styles.promotionHeader}>
                <div>
                  <h3 className={styles.promotionName}>{promotion.name}</h3>
                  {promotion.description && (
                    <p className={styles.promotionDescription}>{promotion.description}</p>
                  )}
                </div>
                <div className={styles.promotionBadge}>
                  <span className={`${styles.statusBadge} ${styles[status.class]}`}>
                    {status.text}
                  </span>
                </div>
              </div>

              <div className={styles.promotionDetails}>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Réduction:</span>
                  <span className={styles.discountValue}>{formatDiscount(promotion)}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Appliquée à:</span>
                  <span className={styles.detailValue}>
                    {promotion.applies_to === 'all' && 'Tous les produits'}
                    {promotion.applies_to === 'category' && `Catégorie: ${promotion.category}`}
                    {promotion.applies_to === 'products' && `${promotion.product_ids?.length || 0} produit(s)`}
                  </span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Période:</span>
                  <span className={styles.detailValue}>
                    {new Date(promotion.start_date).toLocaleDateString('fr-FR')} - {new Date(promotion.end_date).toLocaleDateString('fr-FR')}
                  </span>
                </div>
                {promotion.promo_code && (
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Code promo:</span>
                    <span className={styles.promoCode}>{promotion.promo_code}</span>
                  </div>
                )}
                {promotion.max_uses && (
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Utilisations:</span>
                    <span className={styles.detailValue}>
                      {promotion.current_uses} / {promotion.max_uses}
                    </span>
                  </div>
                )}
              </div>

              <div className={styles.promotionActions}>
                <label className={styles.toggleSwitch}>
                  <input
                    type="checkbox"
                    checked={promotion.is_active}
                    onChange={() => handleToggleActive(promotion.id, promotion.is_active)}
                    className={styles.toggleInput}
                  />
                  <span className={`${styles.toggleSlider} ${promotion.is_active ? styles.active : styles.inactive}`}>
                    <span className={styles.toggleText}>
                      {promotion.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </span>
                </label>
                <button 
                  onClick={() => handleEdit(promotion)}
                  className={styles.actionBtn}
                >
                  ✏️ Modifier
                </button>
                <button 
                  onClick={() => handleDelete(promotion.id)}
                  className={`${styles.actionBtn} ${styles.danger}`}
                >
                  🗑️ Supprimer
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {promotions.length === 0 && (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>🎁</div>
          <h3 className={styles.emptyTitle}>Aucune promotion</h3>
          <p className={styles.emptyText}>
            Créez votre première promotion pour attirer plus de clients
          </p>
          <button 
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className={styles.btnPrimary}
          >
            ➕ Créer une promotion
          </button>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>{editingPromotion ? 'Modifier la promotion' : 'Nouvelle promotion'}</h2>
              <button 
                onClick={() => {
                  setShowModal(false);
                  setEditingPromotion(null);
                  resetForm();
                }}
                className={styles.closeBtn}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className={styles.modalForm}>
              <div className={styles.formGroup}>
                <label>Nom de la promotion *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="Ex: Soldes d'été"
                />
              </div>

              <div className={styles.formGroup}>
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  placeholder="Description de la promotion"
                />
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Type de réduction *</label>
                  <select
                    value={formData.discount_type}
                    onChange={(e) => setFormData({ ...formData, discount_type: e.target.value as 'percentage' | 'fixed' })}
                    required
                  >
                    <option value="percentage">Pourcentage (%)</option>
                    <option value="fixed">Montant fixe ($)</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label>Valeur de la réduction *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.discount_value}
                    onChange={(e) => setFormData({ ...formData, discount_value: parseFloat(e.target.value) || 0 })}
                    required
                    placeholder={formData.discount_type === 'percentage' ? 'Ex: 20' : 'Ex: 10.00'}
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>Appliquer à *</label>
                <select
                  value={formData.applies_to}
                  onChange={(e) => setFormData({ ...formData, applies_to: e.target.value as any })}
                  required
                >
                  <option value="all">Tous les produits</option>
                  <option value="category">Une catégorie</option>
                  <option value="products">Produits spécifiques</option>
                </select>
              </div>

              {formData.applies_to === 'category' && (
                <div className={styles.formGroup}>
                  <label>Catégorie *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    required
                  >
                    <option value="">Sélectionner une catégorie</option>
                    <option value="tennis">Tennis</option>
                    <option value="chemises">Chemises</option>
                    <option value="jeans">Jeans</option>
                    <option value="maillots">Maillots</option>
                    <option value="accessoires">Accessoires</option>
                    <option value="chaussures">Chaussures</option>
                  </select>
                </div>
              )}

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Date de début *</label>
                  <input
                    type="datetime-local"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Date de fin *</label>
                  <input
                    type="datetime-local"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Code promo (optionnel)</label>
                  <input
                    type="text"
                    value={formData.promo_code}
                    onChange={(e) => setFormData({ ...formData, promo_code: e.target.value.toUpperCase() })}
                    placeholder="Ex: SUMMER2024"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Priorité</label>
                  <input
                    type="number"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
                    min="0"
                  />
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Montant minimum d'achat</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.min_purchase_amount}
                    onChange={(e) => setFormData({ ...formData, min_purchase_amount: parseFloat(e.target.value) || 0 })}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Utilisations max (optionnel)</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.max_uses || ''}
                    onChange={(e) => setFormData({ ...formData, max_uses: e.target.value ? parseInt(e.target.value) : null })}
                    placeholder="Illimité si vide"
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>Texte du bandeau (optionnel)</label>
                <input
                  type="text"
                  value={formData.banner_text}
                  onChange={(e) => setFormData({ ...formData, banner_text: e.target.value })}
                  placeholder="Ex: Soldes d'été - Jusqu'à 50% de réduction!"
                />
              </div>

              <div className={styles.formGroup}>
                <label>
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  />
                  <span>Promotion active</span>
                </label>
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingPromotion(null);
                    resetForm();
                  }}
                  className={styles.btnSecondary}
                >
                  Annuler
                </button>
                <button type="submit" className={styles.btnPrimary}>
                  {editingPromotion ? 'Mettre à jour' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

