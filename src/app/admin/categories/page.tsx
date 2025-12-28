'use client';

import { useState, useEffect } from 'react';
import styles from './categories.module.css';

interface Category {
  id: string;
  slug: string;
  name_key: string;
  icon: string | null;
  color: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Catégories prédéfinies avec leurs slugs et icônes
const PREDEFINED_CATEGORIES = [
  { name: 'Électronique', slug: 'electronique', icon: '📱', color: '#3B82F6' },
  { name: 'Cuisine', slug: 'cuisine', icon: '🍳', color: '#F59E0B' },
  { name: 'Salon', slug: 'salon', icon: '🛋️', color: '#8B5CF6' },
  { name: 'Chambre', slug: 'chambre', icon: '🛏️', color: '#EC4899' },
  { name: 'Salle de bain', slug: 'salle-de-bain', icon: '🚿', color: '#10B981' },
  { name: 'Jardin', slug: 'jardin', icon: '🌳', color: '#059669' },
  { name: 'Bureau', slug: 'bureau', icon: '💼', color: '#6366F1' },
  { name: 'Décoration', slug: 'decoration', icon: '🖼️', color: '#F97316' },
  { name: 'Éclairage', slug: 'eclairage', icon: '💡', color: '#FBBF24' },
  { name: 'Textile', slug: 'textile', icon: '🧵', color: '#EF4444' },
  { name: 'Accessoires', slug: 'accessoires', icon: '👜', color: '#EC4899' },
  { name: 'Sport', slug: 'sport', icon: '⚽', color: '#10B981' },
  { name: 'Mode', slug: 'mode', icon: '👗', color: '#8B5CF6' },
  { name: 'Beauté', slug: 'beaute', icon: '💄', color: '#F472B6' },
  { name: 'Jouets', slug: 'jouets', icon: '🧸', color: '#F59E0B' },
  { name: 'Livres', slug: 'livres', icon: '📚', color: '#6366F1' },
  { name: 'Musique', slug: 'musique', icon: '🎵', color: '#8B5CF6' },
  { name: 'Automobile', slug: 'automobile', icon: '🚗', color: '#3B82F6' },
  { name: 'Bricolage', slug: 'bricolage', icon: '🔨', color: '#F97316' },
  { name: 'Animaux', slug: 'animaux', icon: '🐾', color: '#10B981' },
];

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedPredefinedCategory, setSelectedPredefinedCategory] = useState<string>('');
  const [newCategory, setNewCategory] = useState({
    slug: '',
    name_key: '',
    icon: '',
    color: '#3B82F6',
    display_order: 0,
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/admin/categories');
      const data = await response.json();

      if (data.success) {
        setCategories(data.categories || []);
      } else {
        setError(data.error || 'Erreur lors du chargement des catégories');
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  const handlePredefinedCategoryChange = (value: string) => {
    setSelectedPredefinedCategory(value);
    
    if (value === 'custom') {
      // Réinitialiser les champs pour une catégorie personnalisée
      setNewCategory({
        slug: '',
        name_key: '',
        icon: '',
        color: '#3B82F6',
        display_order: 0,
      });
    } else {
      // Remplir automatiquement avec la catégorie prédéfinie
      const predefined = PREDEFINED_CATEGORIES.find(cat => cat.slug === value);
      if (predefined) {
        setNewCategory({
          slug: predefined.slug,
          name_key: predefined.name,
          icon: predefined.icon,
          color: predefined.color,
          display_order: 0,
        });
      }
    }
  };

  const handleAddCategory = async () => {
    // Valider les champs requis
    if (!newCategory.slug || !newCategory.name_key) {
      alert('Veuillez remplir au moins le slug et le nom de la catégorie');
      return;
    }

    // Valider le format du slug (minuscules, tirets, pas d'espaces)
    const slugRegex = /^[a-z0-9-]+$/;
    if (!slugRegex.test(newCategory.slug)) {
      alert('Le slug doit contenir uniquement des lettres minuscules, chiffres et tirets');
      return;
    }

    setCreating(true);
    try {
      const response = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          slug: newCategory.slug,
          name_key: newCategory.name_key,
          icon: newCategory.icon || null,
          color: newCategory.color || null,
          display_order: newCategory.display_order || 0,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Réinitialiser le formulaire
        setNewCategory({
          slug: '',
          name_key: '',
          icon: '',
          color: '#3B82F6',
          display_order: 0,
        });
        setSelectedPredefinedCategory('');
        setShowAddModal(false);
        
        // Rafraîchir la liste
        fetchCategories();
        
        // Déclencher un événement pour mettre à jour le site en temps réel
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('categories-updated'));
        }
        
        alert('✅ Catégorie créée avec succès !');
      } else {
        alert(data.error || 'Erreur lors de la création de la catégorie');
      }
    } catch (err) {
      console.error('Error creating category:', err);
      alert('Erreur de connexion au serveur');
    } finally {
      setCreating(false);
    }
  };

  const handleToggleActive = async (slug: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/categories/${slug}/toggle-active`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      const data = await response.json();

      if (data.success) {
        // Mettre à jour l'état local
        setCategories(prevCategories =>
          prevCategories.map(cat =>
            cat.slug === slug ? { ...cat, is_active: !currentStatus } : cat
          )
        );
        
        // Déclencher un événement pour mettre à jour le site en temps réel
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('categories-updated'));
        }
      } else {
        alert(data.error || 'Erreur lors de la mise à jour');
      }
    } catch (err) {
      console.error('Error toggling category:', err);
      alert('Erreur de connexion au serveur');
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>⏳ Chargement...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>❌ {error}</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Gestion des Catégories</h1>
          <p className={styles.subtitle}>
            Activez ou désactivez les catégories pour contrôler leur visibilité sur le site
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className={styles.addButton}
        >
          ➕ Ajouter une catégorie
        </button>
      </div>

      <div className={styles.infoBox}>
        <p>💡 <strong>Note:</strong> Les catégories désactivées ne seront plus visibles dans:</p>
        <ul>
          <li>Le catalogue</li>
          <li>Les catégories vedettes de la page d'accueil</li>
          <li>Le footer</li>
          <li>Les filtres de navigation</li>
        </ul>
        <p>Les produits de ces catégories restent accessibles directement par leur URL.</p>
      </div>

      <div className={styles.categoriesGrid}>
        {categories.map((category) => (
          <div
            key={category.id}
            className={`${styles.categoryCard} ${!category.is_active ? styles.inactive : ''}`}
          >
            <div className={styles.categoryHeader}>
              <div className={styles.categoryIcon}>
                {category.icon || '📦'}
              </div>
              <div className={styles.categoryInfo}>
                <h3 className={styles.categoryName}>
                  {category.name_key}
                </h3>
                <span className={styles.categorySlug}>/{category.slug}</span>
              </div>
            </div>

            <div className={styles.categoryDetails}>
              {category.color && (
                <div className={styles.colorPreview}>
                  <span>Couleur:</span>
                  <div
                    className={styles.colorBox}
                    style={{ backgroundColor: category.color }}
                  />
                  <span className={styles.colorCode}>{category.color}</span>
                </div>
              )}
              <div className={styles.displayOrder}>
                Ordre d'affichage: <strong>{category.display_order}</strong>
              </div>
            </div>

            <div className={styles.categoryActions}>
              <div className={styles.statusBadge}>
                <span className={`${styles.statusDot} ${category.is_active ? styles.active : styles.inactive}`}></span>
                <span>{category.is_active ? 'Actif' : 'Inactif'}</span>
              </div>

              <button
                onClick={() => handleToggleActive(category.slug, category.is_active)}
                className={`${styles.toggleBtn} ${category.is_active ? styles.active : styles.inactive}`}
                title={category.is_active ? 'Désactiver la catégorie' : 'Activer la catégorie'}
              >
                {category.is_active ? (
                  <>
                    <span>🔴</span> Désactiver
                  </>
                ) : (
                  <>
                    <span>🟢</span> Activer
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      {categories.length === 0 && (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>📦</div>
          <h3>Aucune catégorie trouvée</h3>
          <p>Les catégories seront créées automatiquement lors de l'exécution de la migration SQL.</p>
        </div>
      )}

      {/* Modal pour ajouter une catégorie */}
      {showAddModal && (
        <div className={styles.modalOverlay} onClick={() => setShowAddModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Ajouter une nouvelle catégorie</h2>
              <button 
                className={styles.modalClose}
                onClick={() => setShowAddModal(false)}
              >
                ✕
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  Type de catégorie <span className={styles.required}>*</span>
                </label>
                <select
                  className={styles.formInput}
                  value={selectedPredefinedCategory}
                  onChange={(e) => handlePredefinedCategoryChange(e.target.value)}
                  required
                >
                  <option value="">-- Sélectionner une catégorie --</option>
                  {PREDEFINED_CATEGORIES.map((cat) => (
                    <option key={cat.slug} value={cat.slug}>
                      {cat.icon} {cat.name}
                    </option>
                  ))}
                  <option value="custom">➕ Personnalisé (créer manuellement)</option>
                </select>
                <small className={styles.formHint}>Choisissez une catégorie prédéfinie ou créez-en une personnalisée</small>
              </div>

              {selectedPredefinedCategory === 'custom' && (
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    Slug (URL) <span className={styles.required}>*</span>
                  </label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={newCategory.slug}
                    onChange={(e) => setNewCategory({ ...newCategory, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                    placeholder="ex: chaussures-sport"
                    required
                  />
                  <small className={styles.formHint}>Utilisé dans l'URL (minuscules, tirets uniquement)</small>
                </div>
              )}

              {selectedPredefinedCategory && selectedPredefinedCategory !== 'custom' && (
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    Slug (URL) <span className={styles.required}>*</span>
                  </label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={newCategory.slug}
                    readOnly
                    style={{ background: '#f3f4f6', cursor: 'not-allowed' }}
                  />
                  <small className={styles.formHint}>Rempli automatiquement</small>
                </div>
              )}

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  Nom de la catégorie <span className={styles.required}>*</span>
                </label>
                <input
                  type="text"
                  className={styles.formInput}
                  value={newCategory.name_key}
                  onChange={(e) => setNewCategory({ ...newCategory, name_key: e.target.value })}
                  placeholder="ex: Chaussures de Sport"
                  required
                />
                <small className={styles.formHint}>
                  {selectedPredefinedCategory && selectedPredefinedCategory !== 'custom' 
                    ? 'Rempli automatiquement (modifiable si nécessaire)' 
                    : 'Nom affiché sur le site'}
                </small>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Icône (Emoji)</label>
                <input
                  type="text"
                  className={styles.formInput}
                  value={newCategory.icon}
                  onChange={(e) => setNewCategory({ ...newCategory, icon: e.target.value })}
                  placeholder="ex: 👟"
                  maxLength={2}
                />
                <small className={styles.formHint}>
                  {selectedPredefinedCategory && selectedPredefinedCategory !== 'custom' 
                    ? 'Rempli automatiquement (modifiable si nécessaire)' 
                    : 'Un emoji pour représenter la catégorie'}
                </small>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Couleur</label>
                <div className={styles.colorInputGroup}>
                  <input
                    type="color"
                    className={styles.colorPicker}
                    value={newCategory.color}
                    onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
                  />
                  <input
                    type="text"
                    className={styles.formInput}
                    value={newCategory.color}
                    onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
                    placeholder="#3B82F6"
                    pattern="^#[0-9A-Fa-f]{6}$"
                  />
                </div>
                <small className={styles.formHint}>
                  {selectedPredefinedCategory && selectedPredefinedCategory !== 'custom' 
                    ? 'Rempli automatiquement (modifiable)' 
                    : 'Code couleur hexadécimal'}
                </small>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Ordre d'affichage</label>
                <input
                  type="number"
                  className={styles.formInput}
                  value={newCategory.display_order}
                  onChange={(e) => setNewCategory({ ...newCategory, display_order: parseInt(e.target.value) || 0 })}
                  min="0"
                />
                <small className={styles.formHint}>Plus le nombre est petit, plus la catégorie apparaît en premier</small>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button
                className={styles.modalBtnSecondary}
                onClick={() => setShowAddModal(false)}
                disabled={creating}
              >
                Annuler
              </button>
              <button
                className={styles.modalBtnPrimary}
                onClick={handleAddCategory}
                disabled={creating || !newCategory.slug || !newCategory.name_key}
              >
                {creating ? '⏳ Création...' : '✅ Créer la catégorie'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

