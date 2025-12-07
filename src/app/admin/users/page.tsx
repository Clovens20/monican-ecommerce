'use client';

import { useState, useEffect } from 'react';
import styles from '../orders/page.module.css';
import userStyles from './users.module.css';

interface User {
    id: string;
    code: string | null;
    name: string;
    email: string;
    role: string;
    active: boolean;
    ordersProcessed: number;
    createdAt: string;
}

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [creating, setCreating] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
    });

    useEffect(() => {
        fetchUsers();
    }, []);

    async function fetchUsers() {
        try {
            const response = await fetch('/api/admin/users');
            const data = await response.json();
            
            if (data.success) {
                setUsers(data.users);
            } else {
                setError(data.error || 'Erreur lors du chargement des utilisateurs');
            }
        } catch (err) {
            console.error('Error fetching users:', err);
            setError('Erreur de connexion au serveur');
        } finally {
            setLoading(false);
        }
    }

    const handleCreateSubAdmin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim() || !formData.email.trim()) {
            alert('Veuillez remplir tous les champs');
            return;
        }

        setCreating(true);
        try {
            const response = await fetch('/api/admin/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: formData.name.trim(),
                    email: formData.email.trim(),
                    role: 'subadmin',
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                // Afficher les détails de l'erreur si disponibles
                const errorMessage = data.error || 'Erreur lors de la création du sous-admin';
                const errorDetails = data.details ? `\n\nDétails: ${JSON.stringify(data.details)}` : '';
                alert(errorMessage + errorDetails);
                return;
            }

            if (data.success) {
                alert(`Sous-admin créé avec succès !\nCode unique: ${data.user.code}\n\nIMPORTANT: Notez ce code, il sera nécessaire pour la connexion.`);
                setShowCreateModal(false);
                setFormData({ name: '', email: '' });
                fetchUsers(); // Rafraîchir la liste
            } else {
                const errorMessage = data.error || 'Erreur lors de la création du sous-admin';
                const errorDetails = data.details ? `\n\nDétails: ${JSON.stringify(data.details)}` : '';
                alert(errorMessage + errorDetails);
            }
        } catch (err) {
            console.error('Error creating subadmin:', err);
            alert('Erreur de connexion au serveur');
        } finally {
            setCreating(false);
        }
    };

    const toggleStatus = async (id: string, currentStatus: boolean) => {
        try {
            const response = await fetch(`/api/admin/users/${id}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    isActive: !currentStatus,
                }),
            });

            const data = await response.json();

            if (data.success) {
                fetchUsers(); // Rafraîchir la liste
            } else {
                alert(data.error || 'Erreur lors de la mise à jour du statut');
            }
        } catch (err) {
            console.error('Error toggling status:', err);
            alert('Erreur de connexion au serveur');
        }
    };

    if (loading) {
        return (
            <div className={styles.container}>
                <div style={{ textAlign: 'center', padding: '3rem' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
                    <p>Chargement des utilisateurs...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.container}>
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

    // Filtrer pour ne montrer que les sous-admins (ou tous les utilisateurs admin/subadmin)
    const subAdmins = users.filter(u => u.role === 'subadmin');
    const admins = users.filter(u => u.role === 'admin');

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Gestion des Utilisateurs</h1>
                    <p style={{ fontSize: '0.9rem', color: '#6b7280', marginTop: '0.5rem' }}>
                        Gérez les administrateurs et sous-administrateurs
                    </p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className={userStyles.createBtn}
                >
                    ➕ Créer un Sous-admin
                </button>
            </div>

            {/* Admins Section */}
            {admins.length > 0 && (
                <div style={{ marginBottom: '2rem' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>Administrateurs</h2>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th className={styles.th}>Nom</th>
                                <th className={styles.th}>Email</th>
                                <th className={styles.th}>Rôle</th>
                                <th className={styles.th}>Statut</th>
                                <th className={styles.th}>Créé le</th>
                            </tr>
                        </thead>
                        <tbody>
                            {admins.map((user) => (
                                <tr key={user.id}>
                                    <td className={styles.td}>{user.name}</td>
                                    <td className={styles.td}>{user.email}</td>
                                    <td className={styles.td}>
                                        <span style={{
                                            padding: '0.25rem 0.75rem',
                                            borderRadius: '999px',
                                            fontSize: '0.8rem',
                                            background: '#dbeafe',
                                            color: '#1e40af'
                                        }}>
                                            Admin
                                        </span>
                                    </td>
                                    <td className={styles.td}>
                                        <span style={{
                                            padding: '0.25rem 0.75rem',
                                            borderRadius: '999px',
                                            fontSize: '0.8rem',
                                            background: user.active ? '#d1fae5' : '#f3f4f6',
                                            color: user.active ? '#065f46' : '#6b7280'
                                        }}>
                                            {user.active ? 'Actif' : 'Inactif'}
                                        </span>
                                    </td>
                                    <td className={styles.td}>
                                        {new Date(user.createdAt).toLocaleDateString('fr-FR')}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Sous-admins Section */}
            <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Sous-administrateurs</h2>
                    <span style={{ fontSize: '0.9rem', color: '#6b7280' }}>
                        {subAdmins.length} sous-admin{subAdmins.length > 1 ? 's' : ''}
                    </span>
                </div>
                {subAdmins.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280', background: '#f9fafb', borderRadius: '8px', border: '1px dashed #e5e7eb' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.3 }}>👥</div>
                        <p style={{ marginBottom: '0.5rem', fontWeight: 600 }}>Aucun sous-administrateur</p>
                        <p style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>Créez votre premier sous-admin pour commencer</p>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className={userStyles.createBtn}
                            style={{ margin: '0 auto' }}
                        >
                            ➕ Créer un Sous-admin
                        </button>
                    </div>
                ) : (
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th className={styles.th}>Code Unique</th>
                                <th className={styles.th}>Nom</th>
                                <th className={styles.th}>Email</th>
                                <th className={styles.th}>Statut</th>
                                <th className={styles.th}>Commandes Traitées</th>
                                <th className={styles.th}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {subAdmins.map((user) => (
                                <tr key={user.id}>
                                    <td className={styles.td} style={{ fontFamily: 'monospace', fontWeight: 'bold', color: '#667eea' }}>
                                        {user.code || 'N/A'}
                                    </td>
                                    <td className={styles.td}>{user.name}</td>
                                    <td className={styles.td}>{user.email}</td>
                                    <td className={styles.td}>
                                        <span style={{
                                            padding: '0.25rem 0.75rem',
                                            borderRadius: '999px',
                                            fontSize: '0.8rem',
                                            background: user.active ? '#d1fae5' : '#f3f4f6',
                                            color: user.active ? '#065f46' : '#6b7280'
                                        }}>
                                            {user.active ? 'Actif' : 'Inactif'}
                                        </span>
                                    </td>
                                    <td className={styles.td}>{user.ordersProcessed}</td>
                                    <td className={styles.td}>
                                        <button
                                            className={styles.actionBtn}
                                            onClick={() => toggleStatus(user.id, user.active)}
                                        >
                                            {user.active ? 'Désactiver' : 'Activer'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Modal de création */}
            {showCreateModal && (
                <div className={userStyles.modalOverlay} onClick={() => !creating && setShowCreateModal(false)}>
                    <div className={userStyles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <div className={userStyles.modalHeader}>
                            <h2 className={userStyles.modalTitle}>Créer un Sous-admin</h2>
                            <button
                                onClick={() => !creating && setShowCreateModal(false)}
                                className={userStyles.modalClose}
                                disabled={creating}
                            >
                                ×
                            </button>
                        </div>

                        <form onSubmit={handleCreateSubAdmin} className={userStyles.modalForm}>
                            <div className={userStyles.formGroup}>
                                <label className={userStyles.label}>
                                    Nom complet *
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Ex: Jean Dupont"
                                    required
                                    disabled={creating}
                                    className={userStyles.input}
                                />
                            </div>

                            <div className={userStyles.formGroup}>
                                <label className={userStyles.label}>
                                    Email *
                                </label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="Ex: jean.dupont@example.com"
                                    required
                                    disabled={creating}
                                    className={userStyles.input}
                                />
                                <small className={userStyles.helpText}>
                                    Un code unique sera généré automatiquement pour ce sous-admin
                                </small>
                            </div>

                            <div className={userStyles.modalActions}>
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    disabled={creating}
                                    className={userStyles.cancelBtn}
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    disabled={creating || !formData.name.trim() || !formData.email.trim()}
                                    className={userStyles.submitBtn}
                                >
                                    {creating ? '⏳ Création...' : '✅ Créer'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
