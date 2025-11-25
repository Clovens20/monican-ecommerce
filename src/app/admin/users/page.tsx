'use client';

import { useState } from 'react';
import styles from '../orders/page.module.css'; // Reuse styles

interface SubAdmin {
    id: string;
    code: string;
    name: string;
    active: boolean;
    ordersProcessed: number;
}

const mockSubAdmins: SubAdmin[] = [
    { id: '1', code: 'SA-8821', name: 'Sophie Martin', active: true, ordersProcessed: 145 },
    { id: '2', code: 'SA-9932', name: 'Luc Tremblay', active: true, ordersProcessed: 89 },
    { id: '3', code: 'SA-1102', name: 'Marc Dubois', active: false, ordersProcessed: 12 },
];

export default function UsersPage() {
    const [admins, setAdmins] = useState(mockSubAdmins);

    const generateCode = () => {
        const random = Math.floor(1000 + Math.random() * 9000);
        return `SA-${random}`;
    };

    const handleCreate = () => {
        const name = prompt('Nom du nouveau sous-admin :');
        if (name) {
            const newAdmin: SubAdmin = {
                id: Date.now().toString(),
                code: generateCode(),
                name,
                active: true,
                ordersProcessed: 0
            };
            setAdmins([...admins, newAdmin]);
            alert(`Nouveau sous-admin créé !\nCode d'accès : ${newAdmin.code}`);
        }
    };

    const toggleStatus = (id: string) => {
        setAdmins(admins.map(a => a.id === id ? { ...a, active: !a.active } : a));
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Gestion des Sous-administrateurs</h1>
                <button
                    className={styles.actionBtn}
                    style={{ background: 'var(--primary)', color: 'white', border: 'none' }}
                    onClick={handleCreate}
                >
                    + Nouveau Sous-admin
                </button>
            </div>

            <table className={styles.table}>
                <thead>
                    <tr>
                        <th className={styles.th}>Code Unique</th>
                        <th className={styles.th}>Nom</th>
                        <th className={styles.th}>Statut</th>
                        <th className={styles.th}>Commandes Traitées</th>
                        <th className={styles.th}>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {admins.map((admin) => (
                        <tr key={admin.id}>
                            <td className={styles.td} style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{admin.code}</td>
                            <td className={styles.td}>{admin.name}</td>
                            <td className={styles.td}>
                                <span style={{
                                    padding: '0.25rem 0.75rem',
                                    borderRadius: '999px',
                                    fontSize: '0.8rem',
                                    background: admin.active ? '#d1fae5' : '#f3f4f6',
                                    color: admin.active ? '#065f46' : '#6b7280'
                                }}>
                                    {admin.active ? 'Actif' : 'Inactif'}
                                </span>
                            </td>
                            <td className={styles.td}>{admin.ordersProcessed}</td>
                            <td className={styles.td}>
                                <button
                                    className={styles.actionBtn}
                                    onClick={() => toggleStatus(admin.id)}
                                >
                                    {admin.active ? 'Désactiver' : 'Activer'}
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
