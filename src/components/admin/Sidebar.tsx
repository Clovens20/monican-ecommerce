// CHEMIN: src/components/admin/Sidebar.tsx
// ACTION: REMPLACER TOUT LE CONTENU

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './Sidebar.module.css';

const navItems = [
    { name: 'Dashboard', path: '/admin', icon: '📊' },
    { name: 'Commandes', path: '/admin/orders', icon: '📦' },
    { name: 'Produits', path: '/admin/products', icon: '🏷️' },
    { name: 'Import CSV', path: '/admin/products/import', icon: '📥' },
    { name: 'Clients', path: '/admin/customers', icon: '👥' },
    { name: 'Finances', path: '/admin/finances', icon: '💰' },
    { name: 'Paramètres', path: '/admin/settings', icon: '⚙️' },
];

export default function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className={styles.sidebar}>
            <div className={styles.logo}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Monican Admin</h2>
            </div>

            <nav className={styles.nav}>
                {navItems.map((item) => (
                    <Link
                        key={item.path}
                        href={item.path}
                        className={`${styles.navLink} ${pathname === item.path ? styles.active : ''}`}
                    >
                        <span className={styles.icon}>{item.icon}</span>
                        {item.name}
                    </Link>
                ))}
            </nav>

            <div className={styles.user}>
                <div className={styles.avatar}>AD</div>
                <div className={styles.userInfo}>
                    <span className={styles.userName}>Admin Principal</span>
                    <span className={styles.userRole}>Super Admin</span>
                </div>
            </div>
        </aside>
    );
}