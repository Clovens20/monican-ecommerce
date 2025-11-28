'use client';

import { useState } from 'react';
import AnimatedSection from './AnimatedSection';
import { useLanguage } from '@/contexts/LanguageContext';
import styles from './NewsletterSection.module.css';

export default function NewsletterSection() {
    const { t } = useLanguage();
    const [email, setEmail] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitted(true);
        setTimeout(() => {
            setEmail('');
            setSubmitted(false);
        }, 3000);
    };

    return (
        <section className={styles.newsletterSection}>
            <div className={styles.backgroundImage}>
                <div className={styles.overlay}></div>
            </div>
            <div className="container">
                <AnimatedSection direction="up">
                    <div className={styles.content}>
                        <h2 className={styles.title}>
                            {t('newsletterTitle')}
                        </h2>
                        <p className={styles.subtitle}>
                            {t('newsletterSubtitle')}
                        </p>
                        <form onSubmit={handleSubmit} className={styles.form}>
                            <input
                                type="email"
                                placeholder={t('newsletterPlaceholder')}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className={styles.input}
                                required
                            />
                            <button type="submit" className={styles.submitBtn}>
                                {submitted ? t('newsletterSubscribed') : t('newsletterSubscribe')}
                            </button>
                        </form>
                        {submitted && (
                            <p className={styles.successMessage}>
                                {t('newsletterThankYou')}
                            </p>
                        )}
                    </div>
                </AnimatedSection>
            </div>
        </section>
    );
}

