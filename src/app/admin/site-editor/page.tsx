'use client';

import { useState } from 'react';
import Link from 'next/link';
import PageEditor from '@/components/admin/site-editor/PageEditor';
import styles from './site-editor.module.css';

interface PageConfig {
  id: string;
  name: string;
  path: string;
  icon: string;
  description: string;
}

const sitePages: PageConfig[] = [
  {
    id: 'home',
    name: 'Page d\'Accueil',
    path: '/',
    icon: '🏠',
    description: 'Modifier le contenu de la page d\'accueil'
  },
  {
    id: 'catalog',
    name: 'Catalogue',
    path: '/catalog',
    icon: '📚',
    description: 'Gérer l\'affichage du catalogue'
  },
  {
    id: 'about',
    name: 'À Propos',
    path: '/about',
    icon: 'ℹ️',
    description: 'Modifier les informations sur l\'entreprise'
  },
  {
    id: 'contact',
    name: 'Contact',
    path: '/contact',
    icon: '📧',
    description: 'Gérer les informations de contact'
  },
  {
    id: 'faq',
    name: 'FAQ',
    path: '/faq',
    icon: '❓',
    description: 'Modifier les questions fréquentes'
  },
  {
    id: 'shipping',
    name: 'Livraison',
    path: '/shipping',
    icon: '🚚',
    description: 'Gérer les informations de livraison'
  },
  {
    id: 'returns',
    name: 'Retours',
    path: '/returns',
    icon: '↩️',
    description: 'Modifier la politique de retours'
  },
  {
    id: 'header',
    name: 'En-tête (Header)',
    path: '/',
    icon: '📋',
    description: 'Modifier le menu et la navigation'
  },
  {
    id: 'footer',
    name: 'Pied de page (Footer)',
    path: '/',
    icon: '📄',
    description: 'Modifier le footer et les liens'
  },
];

export default function SiteEditorPage() {
  const [selectedPage, setSelectedPage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPages = sitePages.filter(page =>
    page.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    page.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEditPage = (pageId: string) => {
    setSelectedPage(pageId);
    // Ici vous pouvez ouvrir un modal ou rediriger vers un éditeur détaillé
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Éditeur de Site</h1>
          <p className={styles.subtitle}>
            Modifiez le contenu et l'apparence de toutes les pages du site
          </p>
        </div>
      </div>

      <div className={styles.searchBar}>
        <span className={styles.searchIcon}>🔍</span>
        <input
          type="text"
          placeholder="Rechercher une page..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={styles.searchInput}
        />
      </div>

      <div className={styles.grid}>
        {filteredPages.map((page) => (
          <div key={page.id} className={styles.pageCard}>
            <div className={styles.pageIcon}>{page.icon}</div>
            <div className={styles.pageInfo}>
              <h3 className={styles.pageName}>{page.name}</h3>
              <p className={styles.pageDescription}>{page.description}</p>
              <div className={styles.pagePath}>
                <span className={styles.pathLabel}>Chemin:</span>
                <code className={styles.pathValue}>{page.path}</code>
              </div>
            </div>
            <div className={styles.pageActions}>
              <button
                onClick={() => handleEditPage(page.id)}
                className={styles.editBtn}
              >
                ✏️ Modifier
              </button>
              <Link
                href={page.path}
                target="_blank"
                className={styles.previewBtn}
              >
                👁️ Prévisualiser
              </Link>
            </div>
          </div>
        ))}
      </div>

      {selectedPage && (
        <PageEditor
          pageId={selectedPage}
          pageName={sitePages.find(p => p.id === selectedPage)?.name || ''}
          onClose={() => setSelectedPage(null)}
          onSave={() => {
            // Optionnel: Rafraîchir les données ou afficher un message
            console.log('Content saved');
          }}
        />
      )}
    </div>
  );
}

