'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import Link from 'next/link';
import styles from './page.module.css';

interface ReturnsContent {
  title: string;
  sections: Array<{
    title: string;
    content: string | string[];
    type?: 'list' | 'text';
  }>;
  contact: {
    email: string;
    phone: string;
  };
}

export default function ReturnsPage() {
  const { language } = useLanguage();
  const [content, setContent] = useState<ReturnsContent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContent();
  }, [language]);

  async function fetchContent() {
    try {
      setLoading(true);
      const response = await fetch(`/api/legal-content?pageId=returns&language=${language}`);
      const data = await response.json();
      
      if (data.success && data.content) {
        setContent(data.content);
      } else {
        setContent(getDefaultContent());
      }
    } catch (err) {
      console.error('Error fetching returns content:', err);
      setContent(getDefaultContent());
    } finally {
      setLoading(false);
    }
  }

  function getDefaultContent(): ReturnsContent {
    return {
      title: 'POLITIQUE DE RETOUR',
      sections: [
        {
          title: '🧾 Délai de retour',
          content: 'Les retours sont acceptés dans un délai de 30 jours après réception de votre commande.',
          type: 'text',
        },
        {
          title: '✅ Conditions d\'acceptation',
          content: 'Les articles retournés doivent :\n\n• Être neufs, non portés et non lavés\n• Conserver leurs étiquettes d\'origine\n• Être retournés dans leur emballage d\'origine',
          type: 'text',
        },
        {
          title: '🔄 Procédure de retour (sans création de compte requise)',
          content: [
            'Cliquez sur le bouton « Retourner un article » situé dans le footer du site.',
            'Remplissez le formulaire de retour à l\'aide de votre numéro de commande et de vos coordonnées.',
            'Un QR Code de retour vous sera automatiquement fourni.',
            'Présentez ce QR code dans un bureau d\'expédition de votre choix.',
            'Le bureau scannera le QR Code afin d\'obtenir l\'adresse officielle de retour et procédera à l\'envoi du colis.',
          ],
          type: 'list',
        },
        {
          title: '💸 Frais de retour',
          content: '⚠️ Les frais de transport pour le retour sont entièrement à la charge du client.\n\nMonican ne propose pas de retours gratuits.',
          type: 'text',
        },
        {
          title: '💳 Remboursement',
          content: 'Le remboursement sera effectué :\n\n• Après réception et inspection du colis\n• Dans un délai de 5 à 7 jours ouvrables\n• Sur le mode de paiement initial',
          type: 'text',
        },
        {
          title: '❌ Articles non retournables',
          content: [
            'Produits personnalisés ou sur mesure',
            'Articles portés, lavés ou endommagés',
            'Articles sans étiquettes',
            'Retours effectués après le délai de 30 jours',
          ],
          type: 'list',
        },
        {
          title: '📞 Support Client',
          content: 'Pour toute question concernant les retours, veuillez nous contacter.',
          type: 'text',
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
              {section.type === 'list' && Array.isArray(section.content) ? (
                <ol className={styles.steps}>
                  {section.content.map((item, itemIndex) => (
                    <li key={itemIndex}>{item}</li>
                  ))}
                </ol>
              ) : (
                <p style={{ whiteSpace: 'pre-line' }}>{section.content}</p>
              )}
              {section.title === '📞 Support Client' && (
                <div className={styles.contactInfo}>
                  <p>📧 {content.contact.email}</p>
                  <p>📞 {content.contact.phone}</p>
                  <p style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#6b7280' }}>
                    📍 Boutique exclusivement en ligne, basée aux États-Unis
                  </p>
                </div>
              )}
            </div>
          </section>
        ))}

        <div className={styles.ctaSection}>
          <Link href="/return-product" className={styles.ctaButton}>
            Retourner un Produit
          </Link>
        </div>
      </div>
    </div>
  );
}
