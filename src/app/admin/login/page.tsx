'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function AdminLoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const router = useRouter();

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (email === 'admin@monican.com' && password === 'admin123') {
            // Set auth cookie/storage
            localStorage.setItem('monican_admin_auth', 'true');
            document.cookie = "monican_admin_auth=true; path=/";
            router.push('/admin');
        } else {
            setError('Identifiants invalides. Essayez: admin@monican.com / admin123');
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#111827'
        }}>
            <div style={{
                background: 'white',
                padding: '2.5rem',
                borderRadius: '1rem',
                width: '100%',
                maxWidth: '400px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
            }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <Image src="/logo.png" alt="Monican" width={150} height={50} style={{ objectFit: 'contain', filter: 'invert(1)' }} />
                    <h2 style={{ marginTop: '1rem', fontSize: '1.5rem', fontWeight: 'bold', color: '#111827' }}>Admin Login</h2>
                </div>

                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 500, color: '#374151' }}>Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="admin@monican.com"
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #d1d5db' }}
                            required
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 500, color: '#374151' }}>Mot de passe</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #d1d5db' }}
                            required
                        />
                    </div>

                    {error && <div style={{ color: '#ef4444', fontSize: '0.9rem', textAlign: 'center' }}>{error}</div>}

                    <button type="submit" style={{
                        width: '100%',
                        padding: '0.75rem',
                        background: '#10b981',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.5rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        fontSize: '1rem'
                    }}>
                        Se connecter
                    </button>
                </form>

                <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.85rem', color: '#6b7280' }}>
                    Identifiants de démo:<br />
                    admin@monican.com / admin123
                </div>
            </div>
        </div>
    );
}
