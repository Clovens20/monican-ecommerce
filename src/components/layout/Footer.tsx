'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './Footer.module.css';
import { useLanguage } from '@/contexts/LanguageContext';

interface FooterLink {
  label: string;
  href: string;
}

interface FooterContent {
  brandDescription: string;
  shopLinks: FooterLink[];
  helpLinks: FooterLink[];
  legalLinks: FooterLink[];
  contact: {
    email: string;
    phone: string;
  };
  socialLinks?: {
    facebook?: string;
    whatsapp?: string;
    tiktok?: string;
  };
}

export default function Footer() {
  const { t, language } = useLanguage();
  const [content, setContent] = useState<FooterContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeCategories, setActiveCategories] = useState<Array<{slug: string, name_key: string}>>([]);

  // Charger les catégories actives
  useEffect(() => {
    async function fetchActiveCategories() {
      try {
        const response = await fetch('/api/categories');
        if (response.ok) {
          const data = await response.json();
          // Prendre seulement les 4 premières catégories actives pour le footer
          setActiveCategories((data.categories || []).slice(0, 4));
        }
      } catch (err) {
        console.error('Error fetching categories for footer:', err);
      }
    }
    fetchActiveCategories();

    // Écouter les mises à jour
    const handleCategoriesUpdate = () => {
      fetchActiveCategories();
    };
    window.addEventListener('categories-updated', handleCategoriesUpdate);
    return () => {
      window.removeEventListener('categories-updated', handleCategoriesUpdate);
    };
  }, []);

  useEffect(() => {
    fetchContent();
    
    // Recharger le contenu toutes les 30 secondes pour avoir les mises à jour en temps réel
    const interval = setInterval(() => {
      fetchContent();
    }, 30000); // 30 secondes
    
    // Écouter les événements de sauvegarde depuis l'admin
    const handleContentUpdate = () => {
      fetchContent();
    };
    window.addEventListener('footer-content-updated', handleContentUpdate);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('footer-content-updated', handleContentUpdate);
    };
  }, [language, activeCategories]);

  async function fetchContent() {
    try {
      setLoading(true);
      // Ajouter un timestamp pour éviter le cache navigateur
      const timestamp = new Date().getTime();
      const [footerResponse, contactResponse] = await Promise.all([
        fetch(`/api/legal-content?pageId=footer&language=${language}&_t=${timestamp}`, {
          cache: 'no-store',
        }),
        fetch(`/api/site-content?pageId=contact&language=${language}`, {
          cache: 'no-store',
        }),
      ]);
      
      const footerData = await footerResponse.json();
      const contactData = await contactResponse.json();
      
      if (footerData.success && footerData.content) {
        // Prioriser ABSOLUMENT le contenu de la base de données, ne fusionner que pour les champs réellement absents
        const defaultContent = getDefaultContent();
        const dbContent = footerData.content;
        
        // Récupérer les informations de contact depuis l'API site-content
        let contactInfo = defaultContent.contact;
        if (contactData.success && contactData.data?.content) {
          contactInfo = {
            email: contactData.data.content.email || defaultContent.contact.email,
            phone: contactData.data.content.phone || defaultContent.contact.phone,
          };
        }
        
               // Utiliser les catégories actives pour shopLinks (priorité sur DB)
               const shopLinksFromCategories = activeCategories.length > 0
                 ? activeCategories.map(cat => ({
                     label: t(cat.name_key),
                     href: `/catalog?category=${cat.slug}`,
                   }))
                 : ((dbContent.shopLinks && Array.isArray(dbContent.shopLinks) && dbContent.shopLinks.length > 0) 
                     ? dbContent.shopLinks 
                     : defaultContent.shopLinks);

               const mergedContent: FooterContent = {
                 // Prioriser les données de la base, sinon utiliser les valeurs par défaut
                 brandDescription: dbContent.brandDescription !== undefined ? dbContent.brandDescription : defaultContent.brandDescription,
                 shopLinks: shopLinksFromCategories, // Utiliser les catégories actives
          helpLinks: (dbContent.helpLinks && Array.isArray(dbContent.helpLinks) && dbContent.helpLinks.length > 0) 
            ? dbContent.helpLinks 
            : defaultContent.helpLinks,
          legalLinks: (dbContent.legalLinks && Array.isArray(dbContent.legalLinks) && dbContent.legalLinks.length > 0) 
            ? dbContent.legalLinks 
            : defaultContent.legalLinks,
          contact: contactInfo,
          socialLinks: {
            facebook: dbContent.socialLinks?.facebook !== undefined ? dbContent.socialLinks.facebook : (defaultContent.socialLinks?.facebook || 'https://www.facebook.com/share/15pBVyu1Fd/'),
            whatsapp: dbContent.socialLinks?.whatsapp !== undefined ? dbContent.socialLinks.whatsapp : (defaultContent.socialLinks?.whatsapp || 'https://wa.me/17178801479'),
            tiktok: dbContent.socialLinks?.tiktok !== undefined ? dbContent.socialLinks.tiktok : (defaultContent.socialLinks?.tiktok || 'https://www.tiktok.com/@monican072'),
          },
        };
        
        // Debug: Log pour vérifier que les données sont bien récupérées
        if (process.env.NODE_ENV === 'development') {
          console.log('Footer content loaded from DB:', {
            dbContact: dbContent.contact,
            mergedContact: mergedContent.contact
          });
        }
        
        setContent(mergedContent);
      } else {
        // Fallback vers le contenu par défaut
        setContent(getDefaultContent());
      }
    } catch (err) {
      console.error('Error fetching footer content:', err);
      setContent(getDefaultContent());
    } finally {
      setLoading(false);
    }
  }

  function getDefaultContent(): FooterContent {
    // Construire les liens de boutique dynamiquement avec les catégories actives
    const shopLinks = activeCategories.length > 0
      ? activeCategories.map(cat => ({
          label: t(cat.name_key),
          href: `/catalog?category=${cat.slug}`,
        }))
      : [
          // Fallback si aucune catégorie active
          { label: t('tennis'), href: '/catalog?category=tennis' },
          { label: t('shirts'), href: '/catalog?category=chemises' },
          { label: t('jeans'), href: '/catalog?category=jeans' },
          { label: t('jerseys'), href: '/catalog?category=maillots' },
        ];

    return {
      brandDescription: t('brandDescription'),
      shopLinks,
      helpLinks: [
        { label: t('trackOrder'), href: '/track-order' },
        { label: t('delivery'), href: '/shipping' },
        { label: t('returns'), href: '/returns' },
        { label: t('returnProduct'), href: '/return-product' },
        { label: t('faq'), href: '/faq' },
      ],
      legalLinks: [
        { label: t('terms'), href: '/terms' },
        { label: t('privacy'), href: '/privacy' },
        { label: t('contact'), href: '/contact' },
      ],
      contact: {
        email: content?.contact?.email || 'support@monican.shop',
        phone: content?.contact?.phone || '717-880-1479',
      },
      socialLinks: {
        facebook: 'https://www.facebook.com/share/15pBVyu1Fd/',
        whatsapp: 'https://wa.me/17178801479',
        tiktok: 'https://www.tiktok.com/@monican072',
      },
    };
  }

  if (loading || !content) {
    // Afficher le footer par défaut pendant le chargement
    const defaultContent = getDefaultContent();
    return (
      <footer className={styles.footer}>
        <div className={styles.container}>
          <div className={styles.brandCol}>
            <Image
              src="/logo.png"
              alt="Monican Logo"
              width={100}
              height={33}
              style={{ objectFit: 'contain', opacity: 0.8 }}
            />
            <p className={styles.brandDesc}>
              {defaultContent.brandDescription}
            </p>
            
            {/* Social Media Links */}
            {(defaultContent.socialLinks?.facebook || defaultContent.socialLinks?.whatsapp || defaultContent.socialLinks?.tiktok) && (
              <div className={styles.socialLinks}>
                {defaultContent.socialLinks.facebook && (
                  <a
                    href={defaultContent.socialLinks.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.socialLink}
                    aria-label="Facebook"
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </a>
                )}
                {defaultContent.socialLinks.whatsapp && (
                  <a
                    href={defaultContent.socialLinks.whatsapp}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.socialLink}
                    aria-label="WhatsApp"
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                    </svg>
                  </a>
                )}
                {defaultContent.socialLinks.tiktok && (
                  <a
                    href={defaultContent.socialLinks.tiktok}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.socialLink}
                    aria-label="TikTok"
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                    </svg>
                  </a>
                )}
              </div>
            )}
          </div>

          <div className={styles.linksGrid}>
            <div>
              <h4 className={styles.colTitle}>{t('shopTitle')}</h4>
              <ul className={styles.linkList}>
                {defaultContent.shopLinks.map((link, index) => (
                  <li key={index}>
                    <Link href={link.href} className={styles.link}>{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className={styles.colTitle}>{t('helpTitle')}</h4>
              <ul className={styles.linkList}>
                {defaultContent.helpLinks.map((link, index) => (
                  <li key={index}>
                    <Link href={link.href} className={styles.link}>{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className={styles.colTitle}>{t('legalTitle')}</h4>
              <ul className={styles.linkList}>
                {defaultContent.legalLinks.map((link, index) => (
                  <li key={index}>
                    <Link href={link.href} className={styles.link}>{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>

            {defaultContent.contact && (
              <div>
                <h4 className={styles.colTitle}>{t('contactInfo')}</h4>
                <ul className={styles.linkList}>
                  <li>
                    <a href={`mailto:${defaultContent.contact.email}`} className={styles.link}>
                      {defaultContent.contact.email}
                    </a>
                  </li>
                  <li>
                    <a href={`tel:${defaultContent.contact.phone.replace(/\D/g, '')}`} className={styles.link}>
                      {defaultContent.contact.phone}
                    </a>
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>

        <div className={styles.bottom}>
          <p>&copy; {new Date().getFullYear()} Monican LLC. {t('allRightsReserved')}</p>
        </div>
      </footer>
    );
  }

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.brandCol}>
          <Image
            src="/logo.png"
            alt="Monican Logo"
            width={100}
            height={33}
            style={{ objectFit: 'contain', opacity: 0.8 }}
          />
          <p className={styles.brandDesc}>
            {content.brandDescription}
          </p>
          
          {/* Social Media Links */}
          {(content.socialLinks?.facebook || content.socialLinks?.whatsapp || content.socialLinks?.tiktok) && (
            <div className={styles.socialLinks}>
              {content.socialLinks.facebook && (
                <a
                  href={content.socialLinks.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.socialLink}
                  aria-label="Facebook"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
              )}
              {content.socialLinks.whatsapp && (
                <a
                  href={content.socialLinks.whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.socialLink}
                  aria-label="WhatsApp"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                  </svg>
                </a>
              )}
              {content.socialLinks.tiktok && (
                <a
                  href={content.socialLinks.tiktok}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.socialLink}
                  aria-label="TikTok"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                  </svg>
                </a>
              )}
            </div>
          )}
        </div>

        <div className={styles.linksGrid}>
          <div>
            <h4 className={styles.colTitle}>{t('shopTitle')}</h4>
            <ul className={styles.linkList}>
              {(content.shopLinks || []).map((link, index) => (
                <li key={index}>
                  <Link href={link.href} className={styles.link}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className={styles.colTitle}>{t('helpTitle')}</h4>
            <ul className={styles.linkList}>
              {(content.helpLinks || []).map((link, index) => (
                <li key={index}>
                  <Link href={link.href} className={styles.link}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className={styles.colTitle}>{t('legalTitle')}</h4>
            <ul className={styles.linkList}>
              {(content.legalLinks || []).map((link, index) => (
                <li key={index}>
                  <Link href={link.href} className={styles.link}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {content.contact && (
            <div>
              <h4 className={styles.colTitle}>{t('contactInfo')}</h4>
              <ul className={styles.linkList}>
                <li>
                  <a href={`mailto:${content.contact.email}`} className={styles.link}>
                    {content.contact.email}
                  </a>
                </li>
                <li>
                  <a href={`tel:${content.contact.phone.replace(/\D/g, '')}`} className={styles.link}>
                    {content.contact.phone}
                  </a>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>

      <div className={styles.bottom}>
        <p>&copy; {new Date().getFullYear()} Monican LLC. {t('allRightsReserved')}</p>
      </div>
    </footer>
  );
}
