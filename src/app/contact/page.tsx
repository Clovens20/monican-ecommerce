'use client';

import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import styles from './page.module.css';

export default function ContactPage() {
    const { t } = useLanguage();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: '',
    });
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Ici vous pouvez envoyer les données à votre API
        console.log('Contact form submitted:', formData);
        setSubmitted(true);
        setTimeout(() => {
            setSubmitted(false);
            setFormData({ name: '', email: '', subject: '', message: '' });
        }, 3000);
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>{t('contactTitle')}</h1>
                <p className={styles.subtitle}>
                    {t('contactSubtitle')}
                </p>
            </div>

            <div className={styles.layout}>
                <div className={styles.formSection}>
                    <h2 className={styles.sectionTitle}>{t('sendMessage')}</h2>
                    <form onSubmit={handleSubmit} className={styles.form}>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>{t('name')} *</label>
                            <input
                                type="text"
                                className={styles.input}
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>{t('email')} *</label>
                            <input
                                type="email"
                                className={styles.input}
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                required
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>{t('subject')} *</label>
                            <input
                                type="text"
                                className={styles.input}
                                value={formData.subject}
                                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                required
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>{t('message')} *</label>
                            <textarea
                                className={styles.textarea}
                                rows={6}
                                value={formData.message}
                                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                required
                            />
                        </div>

                        <button type="submit" className={styles.submitButton}>
                            {submitted ? t('messageSent') : t('sendMessageBtn')}
                        </button>

                        {submitted && (
                            <p className={styles.successMessage}>
                                {t('thankYouContact')}
                            </p>
                        )}
                    </form>
                </div>

                <div className={styles.infoSection}>
                    <h2 className={styles.sectionTitle}>{t('contactInfo')}</h2>
                    <div className={styles.contactInfo}>
                        <div className={styles.contactItem}>
                            <div className={styles.contactIcon}>📧</div>
                            <div>
                                <h3>{t('email')}</h3>
                                <p>support@monican.com</p>
                            </div>
                        </div>
                        <div className={styles.contactItem}>
                            <div className={styles.contactIcon}>📞</div>
                            <div>
                                <h3>{t('phone')}</h3>
                                <p>717-880-1479</p>
                            </div>
                        </div>
                        <div className={styles.contactItem}>
                            <div className={styles.contactIcon}>🕒</div>
                            <div>
                                <h3>{t('openingHours')}</h3>
                                <p>24/7</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

