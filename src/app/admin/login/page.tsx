// CHEMIN: src/app/admin/login/page.tsx
// ACTION: REMPLACER TOUT LE CONTENU EXISTANT

'use client';

import { useState, FormEvent, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import styles from './login.module.css';

function LoginForm() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirectTo = searchParams.get('redirect') || '/admin';

    const handleLogin = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (response.ok) {
                router.push(redirectTo);
                router.refresh();
            } else {
                setError(data.error || 'Identifiants invalides');
            }
        } catch (err) {
            console.error('Erreur de connexion:', err);
            setError('Erreur de connexion. Veuillez réessayer.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.loginCard}>
                <div className={styles.logoSection}>
                    <div className={styles.logoPlaceholder}>
                        <span className={styles.logoText}>MONICAN</span>
                    </div>
                    <h1 className={styles.title}>Administration</h1>
                    <p className={styles.subtitle}>Connectez-vous pour accéder au panneau</p>
                </div>

                <form onSubmit={handleLogin} className={styles.form}>
                    <div className={styles.inputGroup}>
                        <label htmlFor="email" className={styles.label}>
                            Adresse email
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="admin@monican.com"
                            className={styles.input}
                            required
                            disabled={isLoading}
                            autoComplete="email"
                        />
                    </div>

                    <div className={styles.inputGroup}>
                        <label htmlFor="password" className={styles.label}>
                            Mot de passe
                        </label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className={styles.input}
                            required
                            disabled={isLoading}
                            autoComplete="current-password"
                        />
                    </div>

                    {error && (
                        <div className={styles.errorMessage}>
                            <span className={styles.errorIcon}>⚠️</span>
                            {error}
                        </div>
                    )}

                    <button 
                        type="submit" 
                        className={styles.submitBtn}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <span className={styles.spinner}></span>
                                Connexion...
                            </>
                        ) : (
                            'Se connecter'
                        )}
                    </button>
                </form>

                <div className={styles.demoCredentials}>
                    <p className={styles.demoTitle}>🔐 Identifiants de démonstration</p>
                    <div className={styles.demoInfo}>
                        <code>admin@monican.com</code>
                        <code>admin123</code>
                    </div>
                </div>

                <div className={styles.securityNote}>
                    <span className={styles.lockIcon}>🔒</span>
                    Connexion sécurisée SSL
                </div>
            </div>
        </div>
    );
}

export default function AdminLoginPage() {
    return (
        <Suspense fallback={
            <div className={styles.container}>
                <div className={styles.loginCard}>
                    <div className={styles.logoSection}>
                        <div className={styles.logoPlaceholder}>
                            <span className={styles.logoText}>MONICAN</span>
                        </div>
                        <h1 className={styles.title}>Administration</h1>
                        <p className={styles.subtitle}>Chargement...</p>
                    </div>
                </div>
            </div>
        }>
            <LoginForm />
        </Suspense>
    );
}