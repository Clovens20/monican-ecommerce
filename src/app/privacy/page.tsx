'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import styles from './page.module.css';

interface PrivacyContent {
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

export default function PrivacyPage() {
  const { language } = useLanguage();
  const [content, setContent] = useState<PrivacyContent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContent();
  }, [language]);

  async function fetchContent() {
    try {
      setLoading(true);
      const response = await fetch(`/api/legal-content?pageId=privacy&language=${language}`);
      const data = await response.json();
      
      if (data.success && data.content) {
        setContent(data.content);
      } else {
        setContent(getDefaultContent());
      }
    } catch (err) {
      console.error('Error fetching privacy content:', err);
      setContent(getDefaultContent());
    } finally {
      setLoading(false);
    }
  }

  function getDefaultContent(): PrivacyContent {
    return {
      title: 'POLITIQUE DE CONFIDENTIALITÉ',
      sections: [
        {
          title: '1. Collecte des Données',
          content: 'Monican collecte uniquement les informations nécessaires au traitement des commandes :\n\n• Nom et prénom\n• Adresse email\n• Numéro de téléphone\n• Adresse de livraison et facturation\n• Informations de paiement (gérées par plateformes sécurisées)',
        },
        {
          title: '2. Utilisation des Données',
          content: 'Vos données servent à :\n\n• Traiter vos commandes\n• Vous contacter concernant votre commande\n• Répondre à vos demandes d\'assistance\n• Optimiser votre expérience utilisateur\n• Vous envoyer des communications promotionnelles si vous y avez consenti',
        },
        {
          title: '3. Protection des Données',
          content: 'Nous utilisons des mesures de sécurité conformes aux standards internationaux afin de protéger vos informations contre l\'accès non autorisé, la perte ou la divulgation.',
        },
        {
          title: '4. Partage des Données',
          content: 'Vos données ne sont jamais revendues.\n\nElles peuvent être transmises uniquement à nos partenaires essentiels :\n• Prestataires de paiement\n• Transporteurs\n• Services techniques',
        },
        {
          title: '5. Vos Droits',
          content: 'Vous pouvez demander à tout moment :\n\n• L\'accès à vos données\n• La correction ou suppression de celles-ci\n• La désinscription aux emails marketing',
        },
        {
          title: '6. Cookies',
          content: 'Nous utilisons des cookies pour :\n\n• Optimiser la navigation\n• Mesurer la performance du site\n• Personnaliser l\'expérience utilisateur\n\nVous pouvez gérer vos préférences directement dans votre navigateur.',
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
