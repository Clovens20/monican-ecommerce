'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import styles from './page.module.css';

interface Settings {
    general: {
        siteName: string;
        siteUrl: string;
        supportEmail: string;
        supportPhone: string;
    };
    email: {
        service: 'resend' | 'supabase';
        fromEmail: string;
        fromName: string;
    };
    payment: {
        stripeEnabled: boolean;
        stripeMode: 'test' | 'live';
    };
    shipping: {
        originStreet: string;
        originCity: string;
        originState: string;
        originZip: string;
        originCountry: string;
        uspsEnabled: boolean;
        fedexEnabled: boolean;
    };
    abandonedCart: {
        enabled: boolean;
        popupDelay: number; // en minutes
        reminderDelay: number; // en heures
    };
}

function SettingsPageContent() {
    const searchParams = useSearchParams();
    const [settings, setSettings] = useState<Settings>({
        general: {
            siteName: 'Monican',
            siteUrl: typeof window !== 'undefined' ? window.location.origin : 'https://monican.shop',
            supportEmail: 'support@monican.shop',
            supportPhone: '+1 717-880-1479',
        },
        email: {
            service: 'resend',
            fromEmail: 'noreply@monican.com',
            fromName: 'Monican E-commerce',
        },
        payment: {
            stripeEnabled: false,
            stripeMode: 'test',
        },
        shipping: {
            originStreet: '',
            originCity: '',
            originState: '',
            originZip: '',
            originCountry: 'US',
            uspsEnabled: false,
            fedexEnabled: false,
        },
        abandonedCart: {
            enabled: true,
            popupDelay: 2,
            reminderDelay: 3,
        },
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [configStatus, setConfigStatus] = useState<any>({});

    useEffect(() => {
        // Charger les statuts de configuration depuis l'API
        fetch('/api/admin/settings/status')
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setConfigStatus(data.status);
                    // Mettre à jour les settings avec les valeurs réelles
                    setSettings(prev => ({
                        ...prev,
                        email: {
                            service: data.status.emailService || 'resend',
                            fromEmail: data.status.emailFrom || 'noreply@monican.com',
                            fromName: data.status.emailFromName || 'Monican E-commerce',
                        },
                        payment: {
                            stripeEnabled: data.status.stripeEnabled || false,
                            stripeMode: data.status.stripeMode || 'test',
                        },
                        shipping: {
                            originStreet: data.status.shippingOriginStreet || '',
                            originCity: data.status.shippingOriginCity || '',
                            originState: data.status.shippingOriginState || '',
                            originZip: data.status.shippingOriginZip || '',
                            originCountry: data.status.shippingOriginCountry || 'US',
                            uspsEnabled: data.status.uspsEnabled || false,
                            fedexEnabled: data.status.fedexEnabled || false,
                        },
                    }));
                }
            })
            .catch(err => {
                console.error('Error loading settings status:', err);
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

    const handleChange = (section: keyof Settings, field: string, value: any) => {
        setSettings(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [field]: value,
            },
        }));
        setError(null);
        setSuccess(false);
    };

    const handleSave = async (section: keyof Settings) => {
        try {
            setSaving(true);
            setError(null);

            // Note: Les paramètres sont stockés dans .env, donc on ne peut pas les modifier via l'interface
            // On affiche juste un message informatif
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err: any) {
            setError(err.message || 'Erreur lors de la sauvegarde');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className={styles.container}>
                <div className={styles.loading}>Chargement des paramètres...</div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Paramètres</h1>
                <p className={styles.subtitle}>Gérez les paramètres de votre application</p>
            </div>

            {error && (
                <div className={styles.message + ' ' + styles.error}>
                    ⚠️ {error}
                </div>
            )}

            {success && (
                <div className={styles.message + ' ' + styles.success}>
                    ✓ Paramètres sauvegardés avec succès
                </div>
            )}

            <div className={styles.content}>
                {/* Section Générale */}
                <div className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <h2 className={styles.sectionTitle}>🌐 Paramètres Généraux</h2>
                        <p className={styles.sectionDescription}>
                            Configuration de base de votre site e-commerce
                        </p>
                    </div>
                    <div className={styles.sectionContent}>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Nom du site</label>
                            <input
                                type="text"
                                className={styles.input}
                                value={settings.general.siteName}
                                onChange={(e) => handleChange('general', 'siteName', e.target.value)}
                                placeholder="Monican"
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>URL du site</label>
                            <input
                                type="url"
                                className={styles.input}
                                value={settings.general.siteUrl}
                                onChange={(e) => handleChange('general', 'siteUrl', e.target.value)}
                                placeholder="https://monican.shop"
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Email de support</label>
                            <input
                                type="email"
                                className={styles.input}
                                value={settings.general.supportEmail}
                                onChange={(e) => handleChange('general', 'supportEmail', e.target.value)}
                                placeholder="support@monican.shop"
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Téléphone de support</label>
                            <input
                                type="tel"
                                className={styles.input}
                                value={settings.general.supportPhone}
                                onChange={(e) => handleChange('general', 'supportPhone', e.target.value)}
                                placeholder="+1 717-880-1479"
                            />
                        </div>
                        <div className={styles.infoBox}>
                            <p className={styles.infoText}>
                                ℹ️ <strong>Note:</strong> Ces paramètres sont définis dans les variables d'environnement (.env).
                                Pour les modifier, éditez le fichier .env.local et redémarrez l'application.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Section Email */}
                <div className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <h2 className={styles.sectionTitle}>📧 Configuration Email</h2>
                        <p className={styles.sectionDescription}>
                            Paramètres pour l'envoi d'emails (confirmations, notifications, etc.)
                        </p>
                    </div>
                    <div className={styles.sectionContent}>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Service d'email</label>
                            <select
                                className={styles.select}
                                value={settings.email.service}
                                onChange={(e) => handleChange('email', 'service', e.target.value)}
                            >
                                <option value="resend">Resend</option>
                                <option value="supabase">Supabase</option>
                            </select>
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Email expéditeur</label>
                            <input
                                type="email"
                                className={styles.input}
                                value={settings.email.fromEmail}
                                onChange={(e) => handleChange('email', 'fromEmail', e.target.value)}
                                placeholder="noreply@monican.com"
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Nom expéditeur</label>
                            <input
                                type="text"
                                className={styles.input}
                                value={settings.email.fromName}
                                onChange={(e) => handleChange('email', 'fromName', e.target.value)}
                                placeholder="Monican E-commerce"
                            />
                        </div>
                        <div className={styles.statusBox}>
                            <div className={styles.statusItem} style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%' }}>
                                    <span className={styles.statusLabel}>Resend API Key:</span>
                                    <span className={configStatus.resendConfigured ? styles.statusOk : styles.statusError}>
                                        {configStatus.resendConfigured ? '✓ Configuré' : '✗ Non configuré'}
                                    </span>
                                </div>
                                {!configStatus.resendConfigured && configStatus.resendApiKeyExists && configStatus.resendApiKeyFormat === 'incorrect' && (
                                    <span className={styles.statusDetail} style={{ color: '#f59e0b', display: 'block', marginTop: '0.5rem', fontSize: '0.8rem' }}>
                                        ⚠️ Format incorrect - la clé doit commencer par "re_" (ex: re_123abc...)
                                    </span>
                                )}
                                {!configStatus.resendConfigured && !configStatus.resendApiKeyExists && (
                                    <span className={styles.statusDetail} style={{ display: 'block', marginTop: '0.5rem', fontSize: '0.8rem' }}>
                                        ℹ️ Variable <code style={{ background: '#f3f4f6', padding: '0.125rem 0.25rem', borderRadius: '0.25rem' }}>RESEND_API_KEY</code> manquante dans <code style={{ background: '#f3f4f6', padding: '0.125rem 0.25rem', borderRadius: '0.25rem' }}>.env.local</code>
                                    </span>
                                )}
                                {configStatus.resendConfigured && (
                                    <span className={styles.statusDetail} style={{ color: '#10b981', display: 'block', marginTop: '0.5rem', fontSize: '0.8rem' }}>
                                        ✓ Clé valide et correctement formatée
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Section Paiement */}
                <div className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <h2 className={styles.sectionTitle}>💳 Configuration Paiement</h2>
                        <p className={styles.sectionDescription}>
                            Paramètres pour les paiements Stripe
                        </p>
                    </div>
                    <div className={styles.sectionContent}>
                        <div className={styles.statusBox}>
                            <div className={styles.statusItem}>
                                <span className={styles.statusLabel}>Stripe Secret Key:</span>
                                <span className={configStatus.stripeSecretConfigured ? styles.statusOk : styles.statusError}>
                                    {configStatus.stripeSecretConfigured ? '✓ Configuré' : '✗ Non configuré'}
                                </span>
                            </div>
                            <div className={styles.statusItem}>
                                <span className={styles.statusLabel}>Stripe Publishable Key:</span>
                                <span className={configStatus.stripePublishableConfigured ? styles.statusOk : styles.statusError}>
                                    {configStatus.stripePublishableConfigured ? '✓ Configuré' : '✗ Non configuré'}
                                </span>
                            </div>
                            <div className={styles.statusItem}>
                                <span className={styles.statusLabel}>Mode:</span>
                                <span className={configStatus.stripeMode === 'test' ? styles.statusWarning : styles.statusOk}>
                                    {configStatus.stripeMode === 'test' ? '🧪 Test' : '✅ Production'}
                                </span>
                            </div>
                        </div>
                        <div className={styles.infoBox}>
                            <p className={styles.infoText}>
                                ℹ️ Configurez vos clés Stripe dans le fichier .env.local avec les variables :
                                <code className={styles.code}>STRIPE_SECRET_KEY</code> et{' '}
                                <code className={styles.code}>NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</code>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Section Livraison */}
                <div className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <h2 className={styles.sectionTitle}>🚚 Configuration Livraison</h2>
                        <p className={styles.sectionDescription}>
                            Adresse d'origine et paramètres des transporteurs
                        </p>
                    </div>
                    <div className={styles.sectionContent}>
                        <h3 className={styles.subsectionTitle}>Adresse d'origine (Entrepôt)</h3>
                        <div className={styles.formGrid}>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Rue</label>
                                <input
                                    type="text"
                                    className={styles.input}
                                    value={settings.shipping.originStreet}
                                    onChange={(e) => handleChange('shipping', 'originStreet', e.target.value)}
                                    placeholder="123 Main St"
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Ville</label>
                                <input
                                    type="text"
                                    className={styles.input}
                                    value={settings.shipping.originCity}
                                    onChange={(e) => handleChange('shipping', 'originCity', e.target.value)}
                                    placeholder="New York"
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>État/Province</label>
                                <input
                                    type="text"
                                    className={styles.input}
                                    value={settings.shipping.originState}
                                    onChange={(e) => handleChange('shipping', 'originState', e.target.value)}
                                    placeholder="NY"
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Code postal</label>
                                <input
                                    type="text"
                                    className={styles.input}
                                    value={settings.shipping.originZip}
                                    onChange={(e) => handleChange('shipping', 'originZip', e.target.value)}
                                    placeholder="10001"
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Pays</label>
                                <select
                                    className={styles.select}
                                    value={settings.shipping.originCountry}
                                    onChange={(e) => handleChange('shipping', 'originCountry', e.target.value)}
                                >
                                    <option value="US">États-Unis</option>
                                    <option value="CA">Canada</option>
                                    <option value="MX">Mexique</option>
                                </select>
                            </div>
                        </div>

                        <h3 className={styles.subsectionTitle} style={{ marginTop: '2rem' }}>Transporteurs</h3>
                        <div className={styles.statusBox}>
                            <div className={styles.statusItem}>
                                <span className={styles.statusLabel}>USPS:</span>
                                <span className={settings.shipping.uspsEnabled ? styles.statusOk : styles.statusError}>
                                    {settings.shipping.uspsEnabled ? '✓ Activé' : '✗ Non configuré'}
                                </span>
                                <span className={styles.statusDetail}>
                                    {settings.shipping.uspsEnabled ? 'User ID configuré' : 'USPS_USER_ID manquant'}
                                </span>
                            </div>
                            <div className={styles.statusItem}>
                                <span className={styles.statusLabel}>FedEx:</span>
                                <span className={settings.shipping.fedexEnabled ? styles.statusOk : styles.statusError}>
                                    {settings.shipping.fedexEnabled ? '✓ Activé' : '✗ Non configuré'}
                                </span>
                                <span className={styles.statusDetail}>
                                    {settings.shipping.fedexEnabled ? 'API Key configurée' : 'FEDEX_API_KEY manquant'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Section Panier Abandonné */}
                <div className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <h2 className={styles.sectionTitle}>🛒 Panier Abandonné</h2>
                        <p className={styles.sectionDescription}>
                            Configuration du système de rappel pour les paniers abandonnés
                        </p>
                    </div>
                    <div className={styles.sectionContent}>
                        <div className={styles.formGroup}>
                            <label className={styles.checkboxLabel}>
                                <input
                                    type="checkbox"
                                    className={styles.checkbox}
                                    checked={settings.abandonedCart.enabled}
                                    onChange={(e) => handleChange('abandonedCart', 'enabled', e.target.checked)}
                                />
                                <span>Activer le système de rappel pour les paniers abandonnés</span>
                            </label>
                        </div>
                        {settings.abandonedCart.enabled && (
                            <>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>
                                        Délai d'affichage du popup (minutes)
                                    </label>
                                    <input
                                        type="number"
                                        className={styles.input}
                                        value={settings.abandonedCart.popupDelay}
                                        onChange={(e) => handleChange('abandonedCart', 'popupDelay', parseInt(e.target.value))}
                                        min="1"
                                        max="60"
                                    />
                                    <p className={styles.helpText}>
                                        Le popup s'affichera après ce délai si le panier n'est pas vide
                                    </p>
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>
                                        Délai d'envoi du rappel (heures)
                                    </label>
                                    <input
                                        type="number"
                                        className={styles.input}
                                        value={settings.abandonedCart.reminderDelay}
                                        onChange={(e) => handleChange('abandonedCart', 'reminderDelay', parseInt(e.target.value))}
                                        min="1"
                                        max="24"
                                    />
                                    <p className={styles.helpText}>
                                        L'email de rappel sera envoyé après ce délai si le panier n'est pas finalisé
                                    </p>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Section Informations Système */}
                <div className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <h2 className={styles.sectionTitle}>ℹ️ Informations Système</h2>
                        <p className={styles.sectionDescription}>
                            État de la configuration et des services
                        </p>
                    </div>
                    <div className={styles.sectionContent}>
                        <div className={styles.statusBox}>
                            <div className={styles.statusItem} style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%' }}>
                                    <span className={styles.statusLabel}>Supabase:</span>
                                    <span className={configStatus.supabaseConfigured ? styles.statusOk : styles.statusError}>
                                        {configStatus.supabaseConfigured ? '✓ Variables configurées' : '✗ Variables manquantes'}
                                    </span>
                                </div>
                                {!configStatus.supabaseUrlConfigured && (
                                    <span className={styles.statusDetail} style={{ display: 'block', marginTop: '0.5rem', fontSize: '0.8rem', color: '#ef4444' }}>
                                        ⚠️ <code style={{ background: '#f3f4f6', padding: '0.125rem 0.25rem', borderRadius: '0.25rem' }}>NEXT_PUBLIC_SUPABASE_URL</code> manquante ou invalide
                                    </span>
                                )}
                                {!configStatus.serviceRoleKeyConfigured && (
                                    <span className={styles.statusDetail} style={{ display: 'block', marginTop: '0.5rem', fontSize: '0.8rem', color: '#ef4444' }}>
                                        ⚠️ <code style={{ background: '#f3f4f6', padding: '0.125rem 0.25rem', borderRadius: '0.25rem' }}>SUPABASE_SERVICE_ROLE_KEY</code> manquante ou invalide
                                    </span>
                                )}
                                {configStatus.supabaseConfigured && (
                                    <span className={styles.statusDetail} style={{ display: 'block', marginTop: '0.5rem', fontSize: '0.8rem', color: '#6b7280' }}>
                                        ℹ️ Variables présentes - Vérifiez la connexion ci-dessous
                                    </span>
                                )}
                            </div>
                            <div className={styles.statusItem} style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%' }}>
                                    <span className={styles.statusLabel}>Base de données:</span>
                                    <span className={configStatus.databaseConnected ? styles.statusOk : styles.statusError}>
                                        {configStatus.databaseConnected ? '✓ Opérationnelle' : '✗ Erreur de connexion'}
                                    </span>
                                </div>
                                {!configStatus.databaseConnected && configStatus.databaseError && (
                                    <>
                                        <span className={styles.statusDetail} style={{ color: '#ef4444', display: 'block', marginTop: '0.5rem', fontSize: '0.8rem', fontWeight: '600' }}>
                                            ⚠️ {configStatus.databaseError}
                                        </span>
                                        {configStatus.databaseErrorCode === 'MISSING_ENV' && (
                                            <span className={styles.statusDetail} style={{ display: 'block', marginTop: '0.5rem', fontSize: '0.75rem', color: '#6b7280' }}>
                                                → Ajoutez les variables Supabase dans votre fichier <code style={{ background: '#f3f4f6', padding: '0.125rem 0.25rem', borderRadius: '0.25rem' }}>.env</code> ou <code style={{ background: '#f3f4f6', padding: '0.125rem 0.25rem', borderRadius: '0.25rem' }}>.env.local</code>
                                                <br />→ Redémarrez le serveur après avoir ajouté les variables (<code style={{ background: '#f3f4f6', padding: '0.125rem 0.25rem', borderRadius: '0.25rem' }}>npm run dev</code>)
                                            </span>
                                        )}
                                        {(configStatus.databaseError?.includes('Invalid API key') || configStatus.databaseError?.includes('JWT') || configStatus.databaseError?.includes('invalid')) && (
                                            <span className={styles.statusDetail} style={{ display: 'block', marginTop: '0.5rem', fontSize: '0.75rem', color: '#6b7280' }}>
                                                → Vérifiez que <code style={{ background: '#f3f4f6', padding: '0.125rem 0.25rem', borderRadius: '0.25rem' }}>SUPABASE_SERVICE_ROLE_KEY</code> est la bonne clé depuis votre dashboard Supabase (Settings → API → service_role key)
                                                <br />→ Assurez-vous d'utiliser la clé <strong>service_role</strong> (pas la clé anon)
                                                <br />→ Longueur détectée: {configStatus.serviceRoleKeyLength} caractères
                                            </span>
                                        )}
                                        {configStatus.databaseError?.includes('Table introuvable') && (
                                            <span className={styles.statusDetail} style={{ display: 'block', marginTop: '0.5rem', fontSize: '0.75rem', color: '#6b7280' }}>
                                                → Exécutez les migrations SQL dans Supabase (SQL Editor)
                                            </span>
                                        )}
                                    </>
                                )}
                                {configStatus.databaseConnected && (
                                    <span className={styles.statusDetail} style={{ color: '#10b981', display: 'block', marginTop: '0.5rem', fontSize: '0.8rem' }}>
                                        ✓ Connexion réussie - La base de données est accessible
                                    </span>
                                )}
                            </div>
                            <div className={styles.statusItem}>
                                <span className={styles.statusLabel}>Environnement:</span>
                                <span className={configStatus.environment === 'production' ? styles.statusOk : styles.statusWarning}>
                                    {configStatus.environment === 'production' ? '✅ Production' : '🧪 Développement'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function SettingsPage() {
    return (
        <Suspense fallback={
            <div className={styles.container}>
                <div className={styles.loading}>Chargement...</div>
            </div>
        }>
            <SettingsPageContent />
        </Suspense>
    );
}
