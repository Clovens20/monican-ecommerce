// CHEMIN: src/app/admin/layout.tsx
// ACTION: REMPLACER TOUT LE CONTENU

'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ReactNode, useState, useEffect, useCallback, useRef } from 'react';
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
  
  // ✅ TOUS LES HOOKS DOIVENT ÊTRE ICI, AVANT TOUT RETURN CONDITIONNEL
  const [counters, setCounters] = useState<Counters>({
    pendingOrders: 0,
    pendingReturns: 0,
    totalNotifications: 0,
  });
  const [loading, setLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastFetchRef = useRef<number>(0);

  // Fonction pour récupérer les compteurs en temps réel (optimisée avec debounce)
  const fetchCounters = useCallback(async (force = false) => {
    const now = Date.now();
    const timeSinceLastFetch = now - lastFetchRef.current;
    
    // Éviter les appels trop fréquents (minimum 5 secondes entre les appels)
    if (!force && timeSinceLastFetch < 5000) {
      return;
    }

    try {
      const response = await fetch('/api/admin/counters', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      const data = await response.json();
      
      if (data.success && data.counters) {
        setCounters(data.counters);
        lastFetchRef.current = Date.now();
      }
    } catch (error) {
      console.error('Error fetching counters:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fonction de déconnexion améliorée avec API
  const handleLogout = useCallback(async () => {
    if (isLoggingOut) return;
    
    setIsLoggingOut(true);
    
    try {
      // Appeler l'API de déconnexion
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        // Nettoyer le cookie côté client aussi (pour sécurité)
        document.cookie = 'admin_token=; path=/; max-age=0; SameSite=Lax';
        
        // Rediriger vers la page de login
        router.push('/admin/login');
        router.refresh();
      } else {
        console.error('Erreur lors de la déconnexion');
        // Même en cas d'erreur, rediriger vers login
        document.cookie = 'admin_token=; path=/; max-age=0; SameSite=Lax';
        router.push('/admin/login');
      }
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      // Même en cas d'erreur, rediriger vers login
      document.cookie = 'admin_token=; path=/; max-age=0; SameSite=Lax';
      router.push('/admin/login');
    } finally {
      setIsLoggingOut(false);
    }
  }, [router, isLoggingOut]);

  // Mémoiser la fonction isActive pour éviter les recalculs
  const isActive = useCallback((path: string) => {
    return pathname === path || pathname.startsWith(path + '/');
  }, [pathname]);

  // Charger les compteurs au montage
  useEffect(() => {
    fetchCounters(true);
  }, [fetchCounters]);

  // Mettre à jour en temps réel toutes les 15 secondes (optimisé de 10 à 15)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchCounters(false);
    }, 15000); // Mise à jour toutes les 15 secondes

    return () => clearInterval(interval);
  }, [fetchCounters]);

  // Réactualiser avec debounce quand on change de page
  useEffect(() => {
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }
    
    fetchTimeoutRef.current = setTimeout(() => {
      fetchCounters(true);
    }, 500); // Debounce de 500ms

    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
    };
  }, [pathname, fetchCounters]);

  // ✅ MAINTENANT LES RETURNS CONDITIONNELS APRÈS TOUS LES HOOKS
  
  // Don't show layout on login page or sousadmin page
  if (pathname === '/admin/login' || pathname === '/admin/sousadmin') {
    return <>{children}</>;
  }

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
          <button 
            onClick={handleLogout} 
            className={styles.logoutBtn}
            disabled={isLoggingOut}
            aria-label="Déconnexion"
          >
            <span className={styles.navIcon}>🚪</span>
            <span>{isLoggingOut ? 'Déconnexion...' : 'Déconnexion'}</span>
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