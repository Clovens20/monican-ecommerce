'use client';

import { useState, useEffect } from 'react';
import styles from './PageEditor.module.css';

interface PageEditorProps {
  pageId: string;
  pageName: string;
  onClose: () => void;
  onSave?: () => void;
}

// Configuration des champs pour chaque type de page
const pageFields: Record<string, Array<{ key: string; label: string; type: 'text' | 'textarea' | 'rich' }>> = {
  home: [
    { key: 'heroTitle', label: 'Titre principal (Hero)', type: 'text' },
    { key: 'heroSubtitle', label: 'Sous-titre (Hero)', type: 'textarea' },
    { key: 'heroButtonText', label: 'Texte du bouton principal', type: 'text' },
    { key: 'heroButtonLink', label: 'Lien du bouton principal', type: 'text' },
  ],
  about: [
    { key: 'title', label: 'Titre de la page', type: 'text' },
    { key: 'missionTitle', label: 'Titre - Notre Mission', type: 'text' },
    { key: 'missionText', label: 'Texte - Notre Mission', type: 'textarea' },
    { key: 'historyTitle', label: 'Titre - Notre Histoire', type: 'text' },
    { key: 'historyText', label: 'Texte - Notre Histoire', type: 'textarea' },
    { key: 'whyChooseUsTitle', label: 'Titre - Pourquoi nous choisir', type: 'text' },
  ],
  contact: [
    { key: 'title', label: 'Titre de la page', type: 'text' },
    { key: 'subtitle', label: 'Sous-titre', type: 'textarea' },
    { key: 'email', label: 'Email de contact', type: 'text' },
    { key: 'phone', label: 'Téléphone', type: 'text' },
    { key: 'address', label: 'Adresse', type: 'textarea' },
    { key: 'openingHours', label: 'Heures d\'ouverture', type: 'textarea' },
  ],
  catalog: [
    { key: 'heroTitle', label: 'Titre principal', type: 'text' },
    { key: 'heroSubtitle', label: 'Sous-titre', type: 'textarea' },
  ],
  faq: [
    { key: 'title', label: 'Titre de la page', type: 'text' },
    { key: 'subtitle', label: 'Sous-titre', type: 'textarea' },
  ],
  shipping: [
    { key: 'title', label: 'Titre de la page', type: 'text' },
    { key: 'subtitle', label: 'Sous-titre', type: 'textarea' },
    { key: 'content', label: 'Contenu principal', type: 'textarea' },
  ],
  returns: [
    { key: 'title', label: 'Titre de la page', type: 'text' },
    { key: 'subtitle', label: 'Sous-titre', type: 'textarea' },
    { key: 'content', label: 'Contenu principal', type: 'textarea' },
  ],
};

export default function PageEditor({ pageId, pageName, onClose, onSave }: PageEditorProps) {
  const [content, setContent] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const fields = pageFields[pageId] || [];

  useEffect(() => {
    loadContent();
  }, [pageId]);

  const loadContent = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/site-content?pageId=${pageId}&language=fr`);
      const data = await response.json();

      if (data.success && data.data?.content) {
        setContent(data.data.content);
      } else {
        // Initialiser avec des valeurs vides
        const initialContent: Record<string, string> = {};
        fields.forEach(field => {
          initialContent[field.key] = '';
        });
        setContent(initialContent);
      }
    } catch (err) {
      console.error('Error loading content:', err);
      setError('Erreur lors du chargement du contenu');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key: string, value: string) => {
    setContent(prev => ({ ...prev, [key]: value }));
    setError(null);
    setSuccess(false);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      const response = await fetch('/api/admin/site-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pageId,
          language: 'fr',
          content,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        if (onSave) onSave();
        setTimeout(() => {
          setSuccess(false);
        }, 3000);
      } else {
        setError(data.error || 'Erreur lors de la sauvegarde');
      }
    } catch (err) {
      console.error('Error saving content:', err);
      setError('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.modal}>
        <div className={styles.modalContent}>
          <div className={styles.loading}>Chargement...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.modal} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>Modifier: {pageName}</h2>
          <button onClick={onClose} className={styles.closeBtn}>
            ✕
          </button>
        </div>

        <div className={styles.modalBody}>
          {error && (
            <div className={styles.errorMessage}>
              {error}
            </div>
          )}

          {success && (
            <div className={styles.successMessage}>
              ✓ Contenu sauvegardé avec succès !
            </div>
          )}

          {fields.length === 0 ? (
            <div className={styles.noFields}>
              <p>Cette page n'a pas encore de champs configurables.</p>
              <p>L'édition sera disponible prochainement.</p>
            </div>
          ) : (
            <div className={styles.form}>
              {fields.map((field) => (
                <div key={field.key} className={styles.formGroup}>
                  <label className={styles.label}>{field.label}</label>
                  {field.type === 'textarea' ? (
                    <textarea
                      className={styles.textarea}
                      value={content[field.key] || ''}
                      onChange={(e) => handleChange(field.key, e.target.value)}
                      rows={4}
                    />
                  ) : (
                    <input
                      type="text"
                      className={styles.input}
                      value={content[field.key] || ''}
                      onChange={(e) => handleChange(field.key, e.target.value)}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={styles.modalFooter}>
          <button onClick={onClose} className={styles.cancelBtn}>
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={saving || fields.length === 0}
            className={styles.saveBtn}
          >
            {saving ? 'Sauvegarde...' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  );
}

