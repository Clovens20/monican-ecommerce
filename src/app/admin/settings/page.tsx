'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import styles from './page.module.css';

function SettingsPageContent() {
    const searchParams = useSearchParams();

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Paramètres</h1>
                <p className={styles.subtitle}>Gérez les paramètres de votre application</p>
            </div>

            <div className={styles.content}>
                {/* Autres sections peuvent être ajoutées ici */}
            </div>
        </div>
    );
}

export default function SettingsPage() {
    return (
        <Suspense fallback={<div className={styles.container}><div className={styles.loading}>Chargement...</div></div>}>
            <SettingsPageContent />
        </Suspense>
    );
}
