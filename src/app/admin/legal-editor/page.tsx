'use client';

import { useState, useEffect } from 'react';
import styles from './legal-editor.module.css';

interface PageConfig {
  id: string;
  name: string;
  icon: string;
  description: string;
}

const legalPages: PageConfig[] = [
  {
    id: 'faq',
    name: 'FAQ - Questions Fréquentes',
    icon: '❓',
    description: 'Modifier les questions et réponses fréquentes',
  },
  {
    id: 'terms',
    name: 'Conditions Générales',
    icon: '📜',
    description: 'Modifier les conditions générales d\'utilisation',
  },
  {
    id: 'privacy',
    name: 'Politique de Confidentialité',
    icon: '🔒',
    description: 'Modifier la politique de confidentialité',
  },
  {
    id: 'returns',
    name: 'Politique de Retour',
    icon: '↩️',
    description: 'Modifier la politique de retour',
  },
  {
    id: 'footer',
    name: 'Footer - Pied de Page',
    icon: '📄',
    description: 'Modifier le contenu du footer',
  },
];

export default function LegalEditorPage() {
  const [selectedPage, setSelectedPage] = useState<string | null>(null);
  const [content, setContent] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [language, setLanguage] = useState('fr');

  useEffect(() => {
    if (selectedPage) {
      fetchContent();
    }
  }, [selectedPage, language]);

  async function fetchContent() {
    if (!selectedPage) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/legal-content?pageId=${selectedPage}&language=${language}`);
      const data = await response.json();

      if (data.success) {
        if (data.content) {
          // Si du contenu existe en base de données, l'utiliser
          setContent(data.content);
        } else {
          // Sinon, charger le contenu par défaut réel des pages publiques
          // Cela permet d'avoir le vrai contenu actuel pour faciliter les modifications
          setContent(getDefaultContent(selectedPage));
        }
      } else {
        // En cas d'erreur, charger quand même le contenu par défaut
        setContent(getDefaultContent(selectedPage));
      }
    } catch (err) {
      console.error('Error fetching content:', err);
      // En cas d'erreur de connexion, charger le contenu par défaut
      setContent(getDefaultContent(selectedPage));
    } finally {
      setLoading(false);
    }
  }

  function getDefaultContent(pageId: string): any {
    switch (pageId) {
      case 'faq':
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
      case 'terms':
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
            phone: '717-880-1479',
          },
        };
      case 'privacy':
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
            phone: '717-880-1479',
          },
        };
      case 'returns':
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
            phone: '717-880-1479',
          },
        };
      case 'footer':
        return {
          brandDescription: 'Votre destination mode multi-pays. Qualité, style et service exceptionnel pour USA, Canada et Mexique.',
          shopLinks: [
            { label: 'Tennis', href: '/catalog?category=tennis' },
            { label: 'Chemises', href: '/catalog?category=chemises' },
            { label: 'Jeans', href: '/catalog?category=jeans' },
            { label: 'Maillots', href: '/catalog?category=maillots' },
          ],
          helpLinks: [
            { label: 'Suivre ma commande', href: '/track-order' },
            { label: 'Livraison', href: '/shipping' },
            { label: 'Retours', href: '/returns' },
            { label: 'Retourner un Produit', href: '/return-product' },
            { label: 'FAQ', href: '/faq' },
          ],
          legalLinks: [
            { label: 'Conditions générales', href: '/terms' },
            { label: 'Confidentialité', href: '/privacy' },
            { label: 'Contact', href: '/contact' },
          ],
          contact: {
            email: 'support@monican.com',
            phone: '717-880-1479',
          },
          socialLinks: {
            facebook: 'https://www.facebook.com/share/15pBVyu1Fd/',
            whatsapp: 'https://wa.me/17178801479',
            tiktok: 'https://www.tiktok.com/@monican072',
          },
        };
      default:
        return {};
    }
  }

  async function handleSave() {
    if (!selectedPage || !content) {
      setError('Veuillez sélectionner une page et remplir le contenu');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch('/api/legal-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pageId: selectedPage,
          language,
          content,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
        
        // Déclencher un événement pour recharger le footer sur toutes les pages
        if (selectedPage === 'footer') {
          window.dispatchEvent(new CustomEvent('footer-content-updated'));
          // Aussi déclencher un événement global pour forcer le rechargement
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('storage'));
          }
        }
      } else {
        setError(data.error || 'Erreur lors de la sauvegarde');
      }
    } catch (err) {
      console.error('Error saving content:', err);
      setError('Erreur de connexion');
    } finally {
      setSaving(false);
    }
  }

  const renderEditor = () => {
    if (!selectedPage || !content) return null;

    switch (selectedPage) {
      case 'faq':
        return (
          <div className={styles.editorContent}>
            <div className={styles.formGroup}>
              <label>Titre</label>
              <input
                type="text"
                value={content.title || ''}
                onChange={(e) => setContent({ ...content, title: e.target.value })}
                className={styles.input}
              />
            </div>
            <div className={styles.formGroup}>
              <label>Sous-titre</label>
              <input
                type="text"
                value={content.subtitle || ''}
                onChange={(e) => setContent({ ...content, subtitle: e.target.value })}
                className={styles.input}
              />
            </div>
            <div className={styles.formGroup}>
              <label>Questions Fréquentes</label>
              {(content.faqs || []).map((faq: any, index: number) => (
                <div key={index} className={styles.faqEditor}>
                  <input
                    type="text"
                    placeholder="Question"
                    value={faq.question || ''}
                    onChange={(e) => {
                      const newFaqs = [...(content.faqs || [])];
                      newFaqs[index] = { ...newFaqs[index], question: e.target.value };
                      setContent({ ...content, faqs: newFaqs });
                    }}
                    className={styles.input}
                  />
                  <textarea
                    placeholder="Réponse"
                    value={faq.answer || ''}
                    onChange={(e) => {
                      const newFaqs = [...(content.faqs || [])];
                      newFaqs[index] = { ...newFaqs[index], answer: e.target.value };
                      setContent({ ...content, faqs: newFaqs });
                    }}
                    rows={4}
                    className={styles.textarea}
                  />
                  <button
                    onClick={() => {
                      const newFaqs = (content.faqs || []).filter((_: any, i: number) => i !== index);
                      setContent({ ...content, faqs: newFaqs });
                    }}
                    className={styles.removeBtn}
                  >
                    Supprimer
                  </button>
                </div>
              ))}
              <button
                onClick={() => {
                  setContent({
                    ...content,
                    faqs: [...(content.faqs || []), { question: '', answer: '' }],
                  });
                }}
                className={styles.addBtn}
              >
                + Ajouter une question
              </button>
            </div>
          </div>
        );

      case 'terms':
      case 'privacy':
        return (
          <div className={styles.editorContent}>
            <div className={styles.formGroup}>
              <label>Titre</label>
              <input
                type="text"
                value={content.title || ''}
                onChange={(e) => setContent({ ...content, title: e.target.value })}
                className={styles.input}
              />
            </div>
            <div className={styles.formGroup}>
              <label>Sections</label>
              {(content.sections || []).map((section: any, index: number) => (
                <div key={index} className={styles.sectionEditor}>
                  <input
                    type="text"
                    placeholder="Titre de la section"
                    value={section.title || ''}
                    onChange={(e) => {
                      const newSections = [...(content.sections || [])];
                      newSections[index] = { ...newSections[index], title: e.target.value };
                      setContent({ ...content, sections: newSections });
                    }}
                    className={styles.input}
                  />
                  <textarea
                    placeholder="Contenu de la section"
                    value={section.content || ''}
                    onChange={(e) => {
                      const newSections = [...(content.sections || [])];
                      newSections[index] = { ...newSections[index], content: e.target.value };
                      setContent({ ...content, sections: newSections });
                    }}
                    rows={6}
                    className={styles.textarea}
                  />
                  <button
                    onClick={() => {
                      const newSections = (content.sections || []).filter((_: any, i: number) => i !== index);
                      setContent({ ...content, sections: newSections });
                    }}
                    className={styles.removeBtn}
                  >
                    Supprimer
                  </button>
                </div>
              ))}
              <button
                onClick={() => {
                  setContent({
                    ...content,
                    sections: [...(content.sections || []), { title: '', content: '' }],
                  });
                }}
                className={styles.addBtn}
              >
                + Ajouter une section
              </button>
            </div>
            <div className={styles.formGroup}>
              <label>Email de contact</label>
              <input
                type="email"
                value={content.contact?.email || ''}
                onChange={(e) => setContent({
                  ...content,
                  contact: { ...content.contact, email: e.target.value },
                })}
                className={styles.input}
              />
            </div>
            <div className={styles.formGroup}>
              <label>Téléphone de contact</label>
              <input
                type="text"
                value={content.contact?.phone || ''}
                onChange={(e) => setContent({
                  ...content,
                  contact: { ...content.contact, phone: e.target.value },
                })}
                className={styles.input}
              />
            </div>
          </div>
        );

      case 'returns':
        return (
          <div className={styles.editorContent}>
            <div className={styles.formGroup}>
              <label>Titre</label>
              <input
                type="text"
                value={content.title || ''}
                onChange={(e) => setContent({ ...content, title: e.target.value })}
                className={styles.input}
              />
            </div>
            <div className={styles.formGroup}>
              <label>Sections</label>
              {(content.sections || []).map((section: any, index: number) => (
                <div key={index} className={styles.sectionEditor}>
                  <input
                    type="text"
                    placeholder="Titre de la section"
                    value={section.title || ''}
                    onChange={(e) => {
                      const newSections = [...(content.sections || [])];
                      newSections[index] = { ...newSections[index], title: e.target.value };
                      setContent({ ...content, sections: newSections });
                    }}
                    className={styles.input}
                  />
                  <select
                    value={section.type || 'text'}
                    onChange={(e) => {
                      const newSections = [...(content.sections || [])];
                      newSections[index] = { ...newSections[index], type: e.target.value };
                      setContent({ ...content, sections: newSections });
                    }}
                    className={styles.select}
                  >
                    <option value="text">Texte</option>
                    <option value="list">Liste</option>
                  </select>
                  {section.type === 'list' ? (
                    <div>
                      {(Array.isArray(section.content) ? section.content : []).map((item: string, itemIndex: number) => (
                        <div key={itemIndex} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                          <input
                            type="text"
                            value={item}
                            onChange={(e) => {
                              const newSections = [...(content.sections || [])];
                              const newContent = [...(newSections[index].content || [])];
                              newContent[itemIndex] = e.target.value;
                              newSections[index] = { ...newSections[index], content: newContent };
                              setContent({ ...content, sections: newSections });
                            }}
                            className={styles.input}
                            placeholder={`Élément ${itemIndex + 1}`}
                          />
                          <button
                            onClick={() => {
                              const newSections = [...(content.sections || [])];
                              const newContent = (newSections[index].content || []).filter((_: any, i: number) => i !== itemIndex);
                              newSections[index] = { ...newSections[index], content: newContent };
                              setContent({ ...content, sections: newSections });
                            }}
                            className={styles.removeBtn}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => {
                          const newSections = [...(content.sections || [])];
                          const newContent = [...(newSections[index].content || []), ''];
                          newSections[index] = { ...newSections[index], content: newContent };
                          setContent({ ...content, sections: newSections });
                        }}
                        className={styles.addBtn}
                      >
                        + Ajouter un élément
                      </button>
                    </div>
                  ) : (
                    <textarea
                      placeholder="Contenu de la section"
                      value={typeof section.content === 'string' ? section.content : ''}
                      onChange={(e) => {
                        const newSections = [...(content.sections || [])];
                        newSections[index] = { ...newSections[index], content: e.target.value };
                        setContent({ ...content, sections: newSections });
                      }}
                      rows={6}
                      className={styles.textarea}
                    />
                  )}
                  <button
                    onClick={() => {
                      const newSections = (content.sections || []).filter((_: any, i: number) => i !== index);
                      setContent({ ...content, sections: newSections });
                    }}
                    className={styles.removeBtn}
                  >
                    Supprimer cette section
                  </button>
                </div>
              ))}
              <button
                onClick={() => {
                  setContent({
                    ...content,
                    sections: [...(content.sections || []), { title: '', content: '', type: 'text' }],
                  });
                }}
                className={styles.addBtn}
              >
                + Ajouter une section
              </button>
            </div>
            <div className={styles.formGroup}>
              <label>Email de contact</label>
              <input
                type="email"
                value={content.contact?.email || ''}
                onChange={(e) => setContent({
                  ...content,
                  contact: { ...content.contact, email: e.target.value },
                })}
                className={styles.input}
              />
            </div>
            <div className={styles.formGroup}>
              <label>Téléphone de contact</label>
              <input
                type="text"
                value={content.contact?.phone || ''}
                onChange={(e) => setContent({
                  ...content,
                  contact: { ...content.contact, phone: e.target.value },
                })}
                className={styles.input}
              />
            </div>
          </div>
        );

      case 'footer':
        return (
          <div className={styles.editorContent}>
            <div className={styles.formGroup}>
              <label>Description de la marque</label>
              <textarea
                value={content.brandDescription || ''}
                onChange={(e) => setContent({ ...content, brandDescription: e.target.value })}
                rows={3}
                className={styles.textarea}
              />
            </div>
            <div className={styles.formGroup}>
              <label>Liens Boutique</label>
              {(content.shopLinks || []).map((link: any, index: number) => (
                <div key={index} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  <input
                    type="text"
                    placeholder="Label"
                    value={link.label || ''}
                    onChange={(e) => {
                      const newLinks = [...(content.shopLinks || [])];
                      newLinks[index] = { ...newLinks[index], label: e.target.value };
                      setContent({ ...content, shopLinks: newLinks });
                    }}
                    className={styles.input}
                  />
                  <input
                    type="text"
                    placeholder="URL"
                    value={link.href || ''}
                    onChange={(e) => {
                      const newLinks = [...(content.shopLinks || [])];
                      newLinks[index] = { ...newLinks[index], href: e.target.value };
                      setContent({ ...content, shopLinks: newLinks });
                    }}
                    className={styles.input}
                  />
                  <button
                    onClick={() => {
                      const newLinks = (content.shopLinks || []).filter((_: any, i: number) => i !== index);
                      setContent({ ...content, shopLinks: newLinks });
                    }}
                    className={styles.removeBtn}
                  >
                    ×
                  </button>
                </div>
              ))}
              <button
                onClick={() => {
                  setContent({
                    ...content,
                    shopLinks: [...(content.shopLinks || []), { label: '', href: '' }],
                  });
                }}
                className={styles.addBtn}
              >
                + Ajouter un lien boutique
              </button>
            </div>
            <div className={styles.formGroup}>
              <label>Liens Aide</label>
              {(content.helpLinks || []).map((link: any, index: number) => (
                <div key={index} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  <input
                    type="text"
                    placeholder="Label"
                    value={link.label || ''}
                    onChange={(e) => {
                      const newLinks = [...(content.helpLinks || [])];
                      newLinks[index] = { ...newLinks[index], label: e.target.value };
                      setContent({ ...content, helpLinks: newLinks });
                    }}
                    className={styles.input}
                  />
                  <input
                    type="text"
                    placeholder="URL"
                    value={link.href || ''}
                    onChange={(e) => {
                      const newLinks = [...(content.helpLinks || [])];
                      newLinks[index] = { ...newLinks[index], href: e.target.value };
                      setContent({ ...content, helpLinks: newLinks });
                    }}
                    className={styles.input}
                  />
                  <button
                    onClick={() => {
                      const newLinks = (content.helpLinks || []).filter((_: any, i: number) => i !== index);
                      setContent({ ...content, helpLinks: newLinks });
                    }}
                    className={styles.removeBtn}
                  >
                    ×
                  </button>
                </div>
              ))}
              <button
                onClick={() => {
                  setContent({
                    ...content,
                    helpLinks: [...(content.helpLinks || []), { label: '', href: '' }],
                  });
                }}
                className={styles.addBtn}
              >
                + Ajouter un lien aide
              </button>
            </div>
            <div className={styles.formGroup}>
              <label>Liens Légaux</label>
              {(content.legalLinks || []).map((link: any, index: number) => (
                <div key={index} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  <input
                    type="text"
                    placeholder="Label"
                    value={link.label || ''}
                    onChange={(e) => {
                      const newLinks = [...(content.legalLinks || [])];
                      newLinks[index] = { ...newLinks[index], label: e.target.value };
                      setContent({ ...content, legalLinks: newLinks });
                    }}
                    className={styles.input}
                  />
                  <input
                    type="text"
                    placeholder="URL"
                    value={link.href || ''}
                    onChange={(e) => {
                      const newLinks = [...(content.legalLinks || [])];
                      newLinks[index] = { ...newLinks[index], href: e.target.value };
                      setContent({ ...content, legalLinks: newLinks });
                    }}
                    className={styles.input}
                  />
                  <button
                    onClick={() => {
                      const newLinks = (content.legalLinks || []).filter((_: any, i: number) => i !== index);
                      setContent({ ...content, legalLinks: newLinks });
                    }}
                    className={styles.removeBtn}
                  >
                    ×
                  </button>
                </div>
              ))}
              <button
                onClick={() => {
                  setContent({
                    ...content,
                    legalLinks: [...(content.legalLinks || []), { label: '', href: '' }],
                  });
                }}
                className={styles.addBtn}
              >
                + Ajouter un lien légal
              </button>
            </div>
            <div className={styles.formGroup}>
              <label>Email de contact</label>
              <input
                type="email"
                value={content.contact?.email || ''}
                onChange={(e) => setContent({
                  ...content,
                  contact: { ...content.contact, email: e.target.value },
                })}
                className={styles.input}
              />
            </div>
            <div className={styles.formGroup}>
              <label>Téléphone de contact</label>
              <input
                type="text"
                value={content.contact?.phone || ''}
                onChange={(e) => setContent({
                  ...content,
                  contact: { ...content.contact, phone: e.target.value },
                })}
                className={styles.input}
              />
            </div>
            <div className={styles.formGroup}>
              <label>Liens Réseaux Sociaux</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '500' }}>
                    Facebook URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://www.facebook.com/..."
                    value={content.socialLinks?.facebook || ''}
                    onChange={(e) => setContent({
                      ...content,
                      socialLinks: { ...content.socialLinks, facebook: e.target.value },
                    })}
                    className={styles.input}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '500' }}>
                    WhatsApp URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://wa.me/..."
                    value={content.socialLinks?.whatsapp || ''}
                    onChange={(e) => setContent({
                      ...content,
                      socialLinks: { ...content.socialLinks, whatsapp: e.target.value },
                    })}
                    className={styles.input}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '500' }}>
                    TikTok URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://www.tiktok.com/@..."
                    value={content.socialLinks?.tiktok || ''}
                    onChange={(e) => setContent({
                      ...content,
                      socialLinks: { ...content.socialLinks, tiktok: e.target.value },
                    })}
                    className={styles.input}
                  />
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return <div>Sélectionnez une page pour commencer</div>;
    }
  };

  return (
    <div className={styles.legalEditorPage}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Éditeur de Contenu Légal</h1>
          <p className={styles.pageSubtitle}>
            Modifiez le contenu des pages légales et du footer
          </p>
        </div>
        <div className={styles.languageSelector}>
          <label>Langue:</label>
          <select
            value={language}
            onChange={(e) => {
              setLanguage(e.target.value);
              setContent(null);
            }}
            className={styles.select}
          >
            <option value="fr">Français</option>
            <option value="en">English</option>
            <option value="es">Español</option>
            <option value="ht">Kreyòl</option>
          </select>
        </div>
      </div>

      <div className={styles.layout}>
        <div className={styles.sidebar}>
          <h2 className={styles.sidebarTitle}>Pages</h2>
          <div className={styles.pagesList}>
            {legalPages.map((page) => (
              <button
                key={page.id}
                onClick={() => {
                  setSelectedPage(page.id);
                  setContent(null);
                  setError(null);
                  setSuccess(false);
                }}
                className={`${styles.pageButton} ${selectedPage === page.id ? styles.active : ''}`}
              >
                <span className={styles.pageIcon}>{page.icon}</span>
                <div className={styles.pageInfo}>
                  <div className={styles.pageName}>{page.name}</div>
                  <div className={styles.pageDesc}>{page.description}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className={styles.mainContent}>
          {selectedPage ? (
            <>
              {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
                  <p>Chargement...</p>
                </div>
              ) : (
                <>
                  {error && (
                    <div className={styles.error}>
                      ⚠️ {error}
                    </div>
                  )}
                  {success && (
                    <div className={styles.success}>
                      ✅ Contenu sauvegardé avec succès !
                    </div>
                  )}
                  {renderEditor()}
                  <div className={styles.actions}>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className={styles.saveBtn}
                    >
                      {saving ? '⏳ Sauvegarde...' : '💾 Sauvegarder'}
                    </button>
                  </div>
                </>
              )}
            </>
          ) : (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>📝</div>
              <h3>Sélectionnez une page</h3>
              <p>Choisissez une page dans le menu de gauche pour commencer l'édition</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

