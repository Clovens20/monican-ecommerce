'use client';

import { useState, useEffect } from 'react';
import AnimatedSection from './AnimatedSection';
import { useLanguage } from '@/contexts/LanguageContext';
import styles from './NewsletterSection.module.css';

export default function NewsletterSection() {
  const { t } = useLanguage();

  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (submitted) {
      timer = setTimeout(() => setSubmitted(false), 5000);
    }
    return () => clearTimeout(timer);
  }, [submitted]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name: name.trim() || undefined }),
      });

      const data = await response.json();

      if (data.success) {
        setSubmitted(true);
        setEmail('');
        setName('');
      } else {
        setError(data.error || 'Une erreur est survenue');
      }
    } catch (err) {
      console.error('Error subscribing to newsletter:', err);
      setError('Erreur de connexion. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className={styles.newsletterSection}>
      <div className={styles.backgroundImage}>
        <div className={styles.overlay}></div>
      </div>

      <div className="container">
        <AnimatedSection direction="up">
          <div className={styles.content}>
            <h2 className={styles.title}>{t('newsletterTitle')}</h2>
            <p className={styles.subtitle}>{t('newsletterSubtitle')}</p>

            <form onSubmit={handleSubmit} className={styles.form}>
              <input
                type="text"
                placeholder={
                  t('newsletterNamePlaceholder') !== 'newsletterNamePlaceholder'
                    ? t('newsletterNamePlaceholder')
                    : 'Your name (optional)'
                }
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError(null);
                }}
                className={styles.input}
                disabled={loading}
                style={{ marginBottom: '10px' }}
              />

              <input
                type="email"
                placeholder={t('newsletterPlaceholder')}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError(null);
                }}
                className={styles.input}
                required
                disabled={loading}
              />

              <button
                type="submit"
                className={styles.submitBtn}
                disabled={loading || submitted}
              >
                {loading
                  ? '⏳'
                  : submitted
                  ? t('newsletterSubscribed')
                  : t('newsletterSubscribe')}
              </button>
            </form>

            {submitted && <p className={styles.successMessage}>{t('newsletterThankYou')}</p>}
            {error && <p className={styles.errorMessage}>{error}</p>}
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
