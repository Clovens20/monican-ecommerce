'use client';

import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import styles from './page.module.css';

export default function FAQPage() {
    const { t } = useLanguage();
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    const faqs = [
        {
            question: t('faq1Question'),
            answer: t('faq1Answer'),
        },
        {
            question: t('faq2Question'),
            answer: t('faq2Answer'),
        },
        {
            question: t('faq3Question'),
            answer: t('faq3Answer'),
        },
        {
            question: t('faq4Question'),
            answer: t('faq4Answer'),
        },
        {
            question: t('faq5Question'),
            answer: t('faq5Answer'),
        },
        {
            question: t('faq6Question'),
            answer: t('faq6Answer'),
        },
        {
            question: t('faq7Question'),
            answer: t('faq7Answer'),
        },
        {
            question: t('faq8Question'),
            answer: t('faq8Answer'),
        },
    ];

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>{t('faqTitle')}</h1>
                <p className={styles.subtitle}>
                    {t('faqSubtitle')}
                </p>
            </div>

            <div className={styles.faqList}>
                {faqs.map((faq, index) => (
                    <div key={index} className={styles.faqItem}>
                        <button
                            className={`${styles.faqQuestion} ${openIndex === index ? styles.open : ''}`}
                            onClick={() => setOpenIndex(openIndex === index ? null : index)}
                        >
                            <span>{faq.question}</span>
                            <span className={styles.icon}>{openIndex === index ? '−' : '+'}</span>
                        </button>
                        {openIndex === index && (
                            <div className={styles.faqAnswer}>
                                <p>{faq.answer}</p>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

