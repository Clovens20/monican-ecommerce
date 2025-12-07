'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import styles from './page.module.css';

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQContent {
  title: string;
  subtitle: string;
  faqs: FAQItem[];
}

export default function FAQPage() {
  const { t, language } = useLanguage();
  const [content, setContent] = useState<FAQContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  useEffect(() => {
    fetchContent();
  }, [language]);

  async function fetchContent() {
    try {
      setLoading(true);
      const response = await fetch(`/api/legal-content?pageId=faq&language=${language}`);
      const data = await response.json();
      
      if (data.success && data.content) {
        setContent(data.content);
      } else {
        // Fallback vers le contenu par défaut
        setContent(getDefaultContent());
      }
    } catch (err) {
      console.error('Error fetching FAQ content:', err);
      setContent(getDefaultContent());
    } finally {
      setLoading(false);
    }
  }

  function getDefaultContent(): FAQContent {
    return {
      title: 'Questions Fréquentes',
      subtitle: 'Trouvez rapidement les réponses aux questions les plus courantes concernant vos achats sur Monican.',
      faqs: [
        {
          question: '📦 Dans quels pays livrez-vous ?',
          answer: 'Nous livrons actuellement aux États-Unis, au Canada et au Mexique.\n\nLes délais de livraison peuvent varier selon votre localisation exacte et la méthode de livraison choisie.',
        },
        {
          question: '⏳ Quels sont les délais de livraison ?',
          answer: 'États-Unis : 3 à 7 jours ouvrables\nCanada : 4 à 10 jours ouvrables\nMexique : 5 à 14 jours ouvrables\n\nDes délais supplémentaires peuvent survenir durant les périodes de forte demande.',
        },
        {
          question: '🔄 Quelle est votre politique de retour ?',
          answer: 'Vous pouvez effectuer un retour dans un délai de 30 jours suivant la réception de votre commande.\n\n⚠️ Les frais de retour sont à la charge du client.\n\n👉 Consultez notre Politique de retour complète pour connaître les étapes via QR code.',
        },
        {
          question: '📍 Comment puis-je suivre ma commande ?',
          answer: 'Une fois votre commande expédiée, un email contenant votre numéro de suivi vous est envoyé.\n\nAucun compte n\'est requis pour suivre votre commande : utilisez simplement le lien de suivi fourni dans votre email.',
        },
        {
          question: '💳 Quels modes de paiement acceptez-vous ?',
          answer: 'Nous acceptons les paiements par :\n\n• Visa\n• Mastercard\n• American Express\n\nTous les paiements sont traités via des plateformes sécurisées.',
        },
        {
          question: '🚚 Offrez-vous la livraison gratuite ?',
          answer: 'Nous proposons uniquement des tarifs standard calculés selon votre destination.\n\nLes frais de livraison sont affichés avant la validation de votre commande.',
        },
        {
          question: '❌ Puis-je modifier ou annuler ma commande ?',
          answer: 'Vous pouvez modifier ou annuler une commande dans un délai de 3 heures maximum après la validation du paiement.\n\nPassé ce délai, la commande étant transmise en préparation logistique, aucune modification ni annulation ne sera possible.',
        },
        {
          question: '🛒 Comment fonctionne la vente en gros ?',
          answer: 'Pour les commandes de 12 articles et plus, nous proposons des remises automatiques :\n\n• 12 à 23 articles : –30 %\n• 24 à 47 articles : –40 %\n• 48 articles et + : –50 %\n\n👉 Rendez-vous sur notre page Vente en gros pour plus d\'informations.',
        },
        {
          question: '👤 Dois-je créer un compte pour commander ou retourner un article ?',
          answer: 'Non, aucun compte n\'est requis pour effectuer un achat, suivre votre livraison ou retourner un article.\n\nToutes les démarches se font via votre email de commande ou le formulaire de retour accessible depuis le pied de page du site.',
        },
      ],
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
        <p className={styles.subtitle}>{content.subtitle}</p>
      </div>

      <div className={styles.faqList}>
        {content.faqs.map((faq, index) => (
          <div
            key={index}
            className={`${styles.faqItem} ${openIndex === index ? styles.open : ''}`}
          >
            <button
              className={styles.faqQuestion}
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
            >
              <span className={styles.questionText}>{faq.question}</span>
              <span className={styles.arrow}>{openIndex === index ? '▲' : '▼'}</span>
            </button>
            {openIndex === index && (
              <div className={styles.faqAnswer}>
                <p style={{ whiteSpace: 'pre-line' }}>{faq.answer}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
