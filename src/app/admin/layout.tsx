// CHEMIN: src/app/admin/layout.tsx
// ACTION: REMPLACER TOUT LE CONTENU

'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ReactNode, useState, useEffect } from 'react';
import styles from './admin.module.css';

interface AdminLayoutProps {
  children: ReactNode;
}

interface Counters {
  pendingOrders: number;
  pendingReturns: number;
  totalNotifications: number;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [counters, setCounters] = useState<Counters>({
    pendingOrders: 0,
    pendingReturns: 0,
    totalNotifications: 0,
  });
  const [loading, setLoading] = useState(true);

  // Don't show layout on login page or sousadmin page
  if (pathname === '/admin/login' || pathname === '/admin/sousadmin') {
    return <>{children}</>;
  }

  // Fonction pour récupérer les compteurs en temps réel
  const fetchCounters = async () => {
    try {
      const response = await fetch('/api/admin/counters');
      const data = await response.json();
      
      if (data.success && data.counters) {
        setCounters(data.counters);
      }
    } catch (error) {
      console.error('Error fetching counters:', error);
    } finally {
      setLoading(false);
    }
  };

  // Charger les compteurs au montage
  useEffect(() => {
    fetchCounters();
  }, []);

  // Mettre à jour en temps réel toutes les 10 secondes
  useEffect(() => {
    const interval = setInterval(() => {
      fetchCounters();
    }, 10000); // Mise à jour toutes les 10 secondes

    return () => clearInterval(interval);
  }, []);

  // Réactualiser aussi quand on change de page (en cas de modification)
  useEffect(() => {
    fetchCounters();
  }, [pathname]);

  const handleLogout = () => {
    document.cookie = 'admin_token=; path=/; max-age=0';
    router.push('/admin/login');
  };

  const isActive = (path: string) => pathname === path || pathname.startsWith(path + '/');

  return (
    <div className={styles.adminLayout}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.logo}>
          <div className={styles.logoIcon}>M</div>
          <span className={styles.logoText}>MONICAN</span>
          <span className={styles.adminBadge}>Admin</span>
        </div>

        <nav className={styles.nav}>
          <div className={styles.navSection}>
            <span className={styles.navLabel}>Menu Principal</span>
            
            <Link 
              href="/admin" 
              className={`${styles.navItem} ${isActive('/admin') && !pathname.includes('/admin/') ? styles.active : ''}`}
            >
              <span className={styles.navIcon}>📊</span>
              <span>Tableau de bord</span>
            </Link>

            <Link 
              href="/admin/orders" 
              className={`${styles.navItem} ${isActive('/admin/orders') ? styles.active : ''}`}
            >
              <span className={styles.navIcon}>📦</span>
              <span>Commandes</span>
              {counters.pendingOrders > 0 && (
                <span className={styles.badge}>{counters.pendingOrders}</span>
              )}
            </Link>

            <Link 
              href="/admin/products" 
              className={`${styles.navItem} ${isActive('/admin/products') ? styles.active : ''}`}
            >
              <span className={styles.navIcon}>🏷️</span>
              <span>Produits</span>
            </Link>

            <Link 
              href="/admin/categories" 
              className={`${styles.navItem} ${isActive('/admin/categories') ? styles.active : ''}`}
            >
              <span className={styles.navIcon}>📂</span>
              <span>Catégories</span>
            </Link>

            <Link 
              href="/admin/returns" 
              className={`${styles.navItem} ${isActive('/admin/returns') ? styles.active : ''}`}
            >
              <span className={styles.navIcon}>↩️</span>
              <span>Retours</span>
            </Link>

            <Link 
              href="/admin/users" 
              className={`${styles.navItem} ${isActive('/admin/users') ? styles.active : ''}`}
            >
              <span className={styles.navIcon}>👥</span>
              <span>Utilisateurs</span>
            </Link>

            <Link 
              href="/admin/finances" 
              className={`${styles.navItem} ${isActive('/admin/finances') ? styles.active : ''}`}
            >
              <span className={styles.navIcon}>💰</span>
              <span>Finances</span>
            </Link>

            <Link 
              href="/admin/promotions" 
              className={`${styles.navItem} ${isActive('/admin/promotions') ? styles.active : ''}`}
            >
              <span className={styles.navIcon}>🎁</span>
              <span>Promotions</span>
            </Link>

            <Link 
              href="/admin/newsletter" 
              className={`${styles.navItem} ${isActive('/admin/newsletter') ? styles.active : ''}`}
            >
              <span className={styles.navIcon}>📧</span>
              <span>Newsletter</span>
            </Link>

            <Link 
              href="/admin/settings" 
              className={`${styles.navItem} ${isActive('/admin/settings') ? styles.active : ''}`}
            >
              <span className={styles.navIcon}>⚙️</span>
              <span>Paramètres</span>
            </Link>
          </div>

          <div className={styles.navSection}>
            <span className={styles.navLabel}>Outils</span>
            
            <Link 
              href="/admin/products/import" 
              className={`${styles.navItem} ${isActive('/admin/products/import') ? styles.active : ''}`}
            >
              <span className={styles.navIcon}>📥</span>
              <span>Import CSV</span>
            </Link>

            <Link 
              href="/admin/site-editor" 
              className={`${styles.navItem} ${isActive('/admin/site-editor') ? styles.active : ''}`}
            >
              <span className={styles.navIcon}>🎨</span>
              <span>Éditeur de Site</span>
            </Link>

            <Link 
              href="/admin/legal-editor" 
              className={`${styles.navItem} ${isActive('/admin/legal-editor') ? styles.active : ''}`}
            >
              <span className={styles.navIcon}>📜</span>
              <span>Contenu Légal</span>
            </Link>
          </div>
        </nav>

        <div className={styles.sidebarFooter}>
          <button onClick={handleLogout} className={styles.logoutBtn}>
            <span className={styles.navIcon}>🚪</span>
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={styles.mainContent}>
        <header className={styles.topBar}>
          <div className={styles.searchBar}>
            <span className={styles.searchIcon}>🔍</span>
            <input 
              type="search" 
              placeholder="Rechercher..." 
              className={styles.searchInput}
            />
          </div>
          
          <div className={styles.topBarActions}>
            <button className={styles.iconBtn} title="Notifications">
              <span className={styles.notifIcon}>🔔</span>
              {counters.totalNotifications > 0 && (
                <span className={styles.notifBadge}>
                  {counters.totalNotifications > 99 ? '99+' : counters.totalNotifications}
                </span>
              )}
            </button>
            
            <div className={styles.userProfile}>
              <div className={styles.avatar}>A</div>
              <div className={styles.userInfo}>
                <div className={styles.userName}>Admin</div>
                <div className={styles.userRole}>Administrateur</div>
              </div>
            </div>
          </div>
        </header>

        <div className={styles.content}>
          {children}
        </div>
      </main>
    </div>
  );
}