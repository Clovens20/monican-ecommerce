// CHEMIN: src/app/admin/login/page.tsx
// ACTION: REMPLACER TOUT LE CONTENU EXISTANT

'use client';

import { useState, FormEvent, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import styles from './login.module.css';

function LoginForm() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
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
                        <div className={styles.passwordWrapper}>
                            <input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className={styles.input}
                                required
                                disabled={isLoading}
                                autoComplete="current-password"
                            />
                            <button
                                type="button"
                                className={styles.passwordToggle}
                                onClick={() => setShowPassword(!showPassword)}
                                disabled={isLoading}
                                aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                            >
                                {showPassword ? (
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                                        <line x1="1" y1="1" x2="23" y2="23"></line>
                                    </svg>
                                ) : (
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                        <circle cx="12" cy="12" r="3"></circle>
                                    </svg>
                                )}
                            </button>
                        </div>
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