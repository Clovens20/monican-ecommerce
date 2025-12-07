'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import styles from './page.module.css';

interface TermsContent {
  title: string;
  sections: Array<{
    title: string;
    content: string;
  }>;
  contact: {
    email: string;
    phone: string;
  };
}

export default function TermsPage() {
  const { language } = useLanguage();
  const [content, setContent] = useState<TermsContent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContent();
  }, [language]);

  async function fetchContent() {
    try {
      setLoading(true);
      const response = await fetch(`/api/legal-content?pageId=terms&language=${language}`);
      const data = await response.json();
      
      if (data.success && data.content) {
        setContent(data.content);
      } else {
        setContent(getDefaultContent());
      }
    } catch (err) {
      console.error('Error fetching terms content:', err);
      setContent(getDefaultContent());
    } finally {
      setLoading(false);
    }
  }

  function getDefaultContent(): TermsContent {
    return {
      title: 'CONDITIONS GÉNÉRALES D\'UTILISATION',
      sections: [
        {
          title: '1. Acceptation des Conditions',
          content: 'En accédant au site www.monican.shop et en utilisant ses services, vous acceptez l\'ensemble des présentes conditions générales.\n\nSi vous n\'êtes pas d\'accord avec ces conditions, veuillez ne pas utiliser le site.',
        },
        {
          title: '2. Utilisation du Site',
          content: 'Vous vous engagez à utiliser le site de manière légale et respectueuse.\n\nToute tentative de fraude, de piratage, ou d\'utilisation abusive entraînera des mesures légales appropriées.',
        },
        {
          title: '3. Commandes et Paiements',
          content: 'Toutes les commandes sont soumises à validation préalable par Monican, sous réserve de disponibilité des produits.\n\nLes prix sont affichés en USD, CAD ou MXN, selon votre pays de navigation.\n\nNous nous réservons le droit de refuser ou d\'annuler toute commande en cas :\n• d\'erreur de prix\n• de rupture de stock\n• de soupçon de fraude',
        },
        {
          title: '4. Propriété Intellectuelle',
          content: 'L\'ensemble des contenus présents sur le site (textes, logos, images, vidéos, design) est la propriété exclusive de Monican et est protégé par les lois sur la propriété intellectuelle.\n\nToute reproduction sans autorisation écrite est strictement interdite.',
        },
        {
          title: '5. Limitation de Responsabilité',
          content: 'Monican ne pourra être tenue responsable des dommages indirects causés par l\'utilisation du site, y compris les interruptions de service ou dysfonctionnements indépendants de notre volonté.',
        },
        {
          title: '6. Contact',
          content: 'Pour toute question concernant ces conditions générales, veuillez nous contacter.',
        },
      ],
      contact: {
        email: 'support@monican.com',
        phone: '717-472-07380',
      },
    };
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
          <p>Chargement...</p>
        </div>
      </div>
    );
  }

  if (!content) {
    return (
      <div className={styles.container}>
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <p>Erreur de chargement</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>{content.title}</h1>
      </div>

      <div className={styles.content}>
        {content.sections.map((section, index) => (
          <section key={index} className={styles.section}>
            <h2 className={styles.sectionTitle}>{section.title}</h2>
            <div className={styles.sectionContent}>
              <p style={{ whiteSpace: 'pre-line' }}>{section.content}</p>
              {index === content.sections.length - 1 && (
                <div className={styles.contactInfo}>
                  <p>📧 {content.contact.email}</p>
                  <p>📞 {content.contact.phone}</p>
                </div>
              )}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
