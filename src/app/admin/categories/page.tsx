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

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    </div>
  );
}

