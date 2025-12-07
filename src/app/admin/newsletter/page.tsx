'use client';

import { useState, useEffect } from 'react';
import styles from './newsletter.module.css';

interface Subscriber {
  id: string;
  email: string;
  status: 'active' | 'unsubscribed' | 'bounced';
  subscribed_at: string;
  unsubscribed_at: string | null;
  source: string;
  notes: string | null;
  created_at: string;
}

export default function NewsletterPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'unsubscribed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubscribers, setSelectedSubscribers] = useState<Set<string>>(new Set());
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailData, setEmailData] = useState({
    subject: '',
    message: '',
    recipients: 'selected' as 'selected' | 'all' | 'active',
  });

  useEffect(() => {
    fetchSubscribers();
  }, []);

  async function fetchSubscribers() {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/newsletter/subscribers');
      const data = await response.json();
      
      if (data.success) {
        setSubscribers(data.subscribers || []);
      } else {
        setError(data.error || 'Erreur lors du chargement des abonnés');
      }
    } catch (err) {
      console.error('Error fetching subscribers:', err);
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  }

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'unsubscribed' : 'active';
      
      const response = await fetch(`/api/admin/newsletter/subscribers/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();

      if (data.success) {
        fetchSubscribers();
      } else {
        alert(data.error || 'Erreur lors de la mise à jour');
      }
    } catch (err) {
      console.error('Error updating subscriber status:', err);
      alert('Erreur de connexion au serveur');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet abonné ?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/newsletter/subscribers/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        fetchSubscribers();
      } else {
        alert(data.error || 'Erreur lors de la suppression');
      }
    } catch (err) {
      console.error('Error deleting subscriber:', err);
      alert('Erreur de connexion au serveur');
    }
  };

  const handleSelectAll = () => {
    const filtered = getFilteredSubscribers();
    if (selectedSubscribers.size === filtered.length) {
      setSelectedSubscribers(new Set());
    } else {
      setSelectedSubscribers(new Set(filtered.map(s => s.id)));
    }
  };

  const handleSelectSubscriber = (id: string) => {
    const newSelected = new Set(selectedSubscribers);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedSubscribers(newSelected);
  };

  const handleSendEmail = async () => {
    if (!emailData.subject || !emailData.message) {
      alert('Veuillez remplir tous les champs');
      return;
    }

    let recipientIds: string[] = [];
    
    if (emailData.recipients === 'selected') {
      recipientIds = Array.from(selectedSubscribers);
      if (recipientIds.length === 0) {
        alert('Veuillez sélectionner au moins un destinataire');
        return;
      }
    } else if (emailData.recipients === 'active') {
      recipientIds = subscribers.filter(s => s.status === 'active').map(s => s.id);
    } else {
      recipientIds = subscribers.map(s => s.id);
    }

    try {
      const response = await fetch('/api/admin/newsletter/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subject: emailData.subject,
          message: emailData.message,
          recipientIds,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert(`Email envoyé à ${data.sentCount} destinataire(s)`);
        setShowEmailModal(false);
        setEmailData({ subject: '', message: '', recipients: 'selected' });
        setSelectedSubscribers(new Set());
      } else {
        alert(data.error || 'Erreur lors de l\'envoi');
      }
    } catch (err) {
      console.error('Error sending email:', err);
      alert('Erreur de connexion au serveur');
    }
  };

  const getFilteredSubscribers = () => {
    return subscribers.filter(subscriber => {
      const matchesFilter = filter === 'all' || subscriber.status === filter;
      const matchesSearch = subscriber.email.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  };

  const filteredSubscribers = getFilteredSubscribers();
  const activeCount = subscribers.filter(s => s.status === 'active').length;
  const totalCount = subscribers.length;

  if (loading) {
    return (
      <div className={styles.newsletterPage}>
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
          <p>Chargement des abonnés...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.newsletterPage}>
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Newsletter</h1>
          <p className={styles.pageSubtitle}>Gérez les abonnés et envoyez des emails</p>
        </div>
        <button 
          onClick={() => setShowEmailModal(true)}
          className={styles.btnPrimary}
          disabled={subscribers.length === 0}
        >
          📧 Envoyer un email
        </button>
      </div>

      {/* Stats Bar */}
      <div className={styles.statsBar}>
        <div className={styles.stat}>
          <span className={styles.statValue}>{totalCount}</span>
          <span className={styles.statLabel}>Total abonnés</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statValue}>{activeCount}</span>
          <span className={styles.statLabel}>Actifs</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statValue}>{subscribers.length - activeCount}</span>
          <span className={styles.statLabel}>Désinscrits</span>
        </div>
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        <div className={styles.searchBox}>
          <span className={styles.searchIcon}>🔍</span>
          <input
            type="search"
            placeholder="Rechercher un email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <div className={styles.filterButtons}>
          <button
            onClick={() => setFilter('all')}
            className={`${styles.filterBtn} ${filter === 'all' ? styles.active : ''}`}
          >
            Tous
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`${styles.filterBtn} ${filter === 'active' ? styles.active : ''}`}
          >
            Actifs
          </button>
          <button
            onClick={() => setFilter('unsubscribed')}
            className={`${styles.filterBtn} ${filter === 'unsubscribed' ? styles.active : ''}`}
          >
            Désinscrits
          </button>
        </div>
      </div>

      {/* Subscribers Table */}
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  checked={filteredSubscribers.length > 0 && selectedSubscribers.size === filteredSubscribers.length}
                  onChange={handleSelectAll}
                  className={styles.checkbox}
                />
              </th>
              <th>Email</th>
              <th>Statut</th>
              <th>Date d'inscription</th>
              <th>Source</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredSubscribers.map(subscriber => (
              <tr key={subscriber.id}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedSubscribers.has(subscriber.id)}
                    onChange={() => handleSelectSubscriber(subscriber.id)}
                    className={styles.checkbox}
                  />
                </td>
                <td className={styles.emailCell}>{subscriber.email}</td>
                <td>
                  <span className={`${styles.statusBadge} ${styles[subscriber.status]}`}>
                    {subscriber.status === 'active' ? 'Actif' : subscriber.status === 'unsubscribed' ? 'Désinscrit' : 'Bounced'}
                  </span>
                </td>
                <td>{new Date(subscriber.subscribed_at).toLocaleDateString('fr-FR')}</td>
                <td>{subscriber.source}</td>
                <td>
                  <div className={styles.actions}>
                    <button
                      onClick={() => handleToggleStatus(subscriber.id, subscriber.status)}
                      className={styles.actionBtn}
                      title={subscriber.status === 'active' ? 'Désactiver' : 'Activer'}
                    >
                      {subscriber.status === 'active' ? '🚫' : '✅'}
                    </button>
                    <button
                      onClick={() => handleDelete(subscriber.id)}
                      className={`${styles.actionBtn} ${styles.danger}`}
                      title="Supprimer"
                    >
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredSubscribers.length === 0 && (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>📧</div>
          <h3 className={styles.emptyTitle}>Aucun abonné trouvé</h3>
          <p className={styles.emptyText}>
            {searchQuery 
              ? `Aucun email ne correspond à "${searchQuery}"`
              : 'Aucun abonné pour le moment'}
          </p>
        </div>
      )}

      {/* Email Modal */}
      {showEmailModal && (
        <div className={styles.modalOverlay} onClick={() => setShowEmailModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Envoyer un email</h2>
              <button 
                onClick={() => setShowEmailModal(false)}
                className={styles.closeBtn}
              >
                ✕
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.formGroup}>
                <label>Destinataires *</label>
                <select
                  value={emailData.recipients}
                  onChange={(e) => setEmailData({ ...emailData, recipients: e.target.value as any })}
                  className={styles.select}
                >
                  <option value="selected">
                    Sélectionnés ({selectedSubscribers.size})
                  </option>
                  <option value="active">Tous les actifs ({activeCount})</option>
                  <option value="all">Tous les abonnés ({totalCount})</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>Sujet *</label>
                <input
                  type="text"
                  value={emailData.subject}
                  onChange={(e) => setEmailData({ ...emailData, subject: e.target.value })}
                  placeholder="Ex: Nouveaux produits disponibles !"
                  className={styles.input}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>Message *</label>
                <textarea
                  value={emailData.message}
                  onChange={(e) => setEmailData({ ...emailData, message: e.target.value })}
                  placeholder="Écrivez votre message ici..."
                  rows={10}
                  className={styles.textarea}
                  required
                />
              </div>
            </div>

            <div className={styles.modalActions}>
              <button
                onClick={() => setShowEmailModal(false)}
                className={styles.btnSecondary}
              >
                Annuler
              </button>
              <button
                onClick={handleSendEmail}
                className={styles.btnPrimary}
              >
                📧 Envoyer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

