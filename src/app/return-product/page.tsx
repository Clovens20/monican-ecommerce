'use client';

import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import styles from './page.module.css';
import QRCode from 'qrcode';

interface ReturnFormData {
  orderNumber: string;
  trackingNumber: string;
  reason: string;
  productPhoto: File | null;
  additionalInfo: string;
}

export default function ReturnProductPage() {
  const { t } = useLanguage();
  const [step, setStep] = useState<'form' | 'qr' | 'tracking' | 'completed'>('form');
  const [formData, setFormData] = useState<ReturnFormData>({
    orderNumber: '',
    trackingNumber: '',
    reason: '',
    productPhoto: null,
    additionalInfo: '',
  });
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [returnLabel, setReturnLabel] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');

  // Adresse officielle du shop (depuis les variables d'environnement ou valeur par défaut)
  const getReturnAddress = () => {
    return {
      name: 'MONICAN',
      street: process.env.NEXT_PUBLIC_SHIPPING_ORIGIN_STREET || '123 Commerce Street',
      city: process.env.NEXT_PUBLIC_SHIPPING_ORIGIN_CITY || 'Montreal',
      state: process.env.NEXT_PUBLIC_SHIPPING_ORIGIN_STATE || 'QC',
      zip: process.env.NEXT_PUBLIC_SHIPPING_ORIGIN_ZIP || 'H3A 0G4',
      country: process.env.NEXT_PUBLIC_SHIPPING_ORIGIN_COUNTRY || 'CA',
      phone: process.env.NEXT_PUBLIC_SHOP_PHONE || '+1-514-555-0123',
    };
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('La photo ne doit pas dépasser 5MB');
        return;
      }
      setFormData({ ...formData, productPhoto: file });
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const generateQRCode = async (address: any) => {
    const addressString = `${address.name}\n${address.street}\n${address.city}, ${address.state} ${address.zip}\n${address.country}\nTel: ${address.phone}`;
    
    try {
      const qrDataUrl = await QRCode.toDataURL(addressString, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });
      setQrCodeUrl(qrDataUrl);
    } catch (err) {
      console.error('Error generating QR code:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Upload photo si présente
      let photoUrl = '';
      if (formData.productPhoto) {
        const photoFormData = new FormData();
        photoFormData.append('file', formData.productPhoto);
        photoFormData.append('folder', 'returns');

        const uploadResponse = await fetch('/api/returns/upload-photo', {
          method: 'POST',
          body: photoFormData,
        });

        if (!uploadResponse.ok) {
          throw new Error('Erreur lors de l\'upload de la photo');
        }

        const uploadData = await uploadResponse.json();
        photoUrl = uploadData.url;
      }

      // Initier le retour
      const response = await fetch('/api/returns/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderNumber: formData.orderNumber.trim(),
          reason: formData.reason,
          additionalInfo: formData.additionalInfo,
          productPhotoUrl: photoUrl,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la création du retour');
      }

      setReturnLabel(data.returnLabel);
      const returnAddress = getReturnAddress();
      await generateQRCode(returnAddress);
      setStep('qr');

    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTracking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.trackingNumber.trim()) {
      setError('Veuillez entrer le numéro de suivi');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const response = await fetch('/api/returns/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          returnLabel,
          trackingNumber: formData.trackingNumber.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la finalisation');
      }

      setStep('completed');

    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Retour de Produit</h1>
        <p className={styles.subtitle}>
          Remplissez le formulaire ci-dessous pour initier un retour
        </p>
      </div>

      {step === 'form' && (
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formSection}>
            <label className={styles.label}>
              Numéro de Commande / Numéro de Suivi / Code de Commande *
            </label>
            <input
              type="text"
              value={formData.orderNumber}
              onChange={(e) => setFormData({ ...formData, orderNumber: e.target.value })}
              placeholder="Ex: ORD-001, TRACK-123456"
              required
              className={styles.input}
            />
            <small className={styles.helpText}>
              Vous pouvez utiliser votre numéro de confirmation, numéro de suivi ou code de commande
            </small>
          </div>

          <div className={styles.formSection}>
            <label className={styles.label}>
              Raison du Retour *
            </label>
            <select
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              required
              className={styles.select}
            >
              <option value="">Sélectionnez une raison</option>
              <option value="defective">Produit défectueux</option>
              <option value="wrong_item">Mauvais article reçu</option>
              <option value="wrong_size">Mauvaise taille</option>
              <option value="not_as_described">Ne correspond pas à la description</option>
              <option value="changed_mind">Changement d'avis</option>
              <option value="other">Autre</option>
            </select>
          </div>

          <div className={styles.formSection}>
            <label className={styles.label}>
              Photo du Produit *
            </label>
            <div className={styles.photoUpload}>
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                required
                className={styles.fileInput}
                id="photoUpload"
              />
              <label htmlFor="photoUpload" className={styles.fileLabel}>
                {photoPreview ? (
                  <img src={photoPreview} alt="Preview" className={styles.photoPreview} />
                ) : (
                  <div className={styles.uploadPlaceholder}>
                    <span className={styles.uploadIcon}>📷</span>
                    <span>Cliquez pour télécharger une photo</span>
                    <small>JPG, PNG (max 5MB)</small>
                  </div>
                )}
              </label>
            </div>
            <small className={styles.helpText}>
              Prenez une photo du produit que vous souhaitez retourner
            </small>
          </div>

          <div className={styles.formSection}>
            <label className={styles.label}>
              Informations Supplémentaires
            </label>
            <textarea
              value={formData.additionalInfo}
              onChange={(e) => setFormData({ ...formData, additionalInfo: e.target.value })}
              placeholder="Décrivez le problème ou ajoutez des détails..."
              rows={4}
              className={styles.textarea}
            />
          </div>

          {error && (
            <div className={styles.error}>
              ⚠️ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={styles.submitBtn}
          >
            {loading ? '⏳ Traitement...' : 'Générer l\'étiquette de retour'}
          </button>
        </form>
      )}

      {step === 'qr' && (
        <div className={styles.qrSection}>
          <div className={styles.successBox}>
            <h2>✅ Étiquette de Retour Générée</h2>
            <p>Votre demande de retour a été créée avec succès</p>
          </div>

          <div className={styles.qrContainer}>
            <h3>QR Code pour l'Adresse de Retour</h3>
            <p className={styles.qrInstructions}>
              Scannez ce QR code au bureau d'envoi pour obtenir automatiquement l'adresse de retour
            </p>
            {qrCodeUrl && (
              <div className={styles.qrCodeWrapper}>
                <img src={qrCodeUrl} alt="QR Code" className={styles.qrCode} />
                <button
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = qrCodeUrl;
                    link.download = 'return-address-qr.png';
                    link.click();
                  }}
                  className={styles.downloadBtn}
                >
                  📥 Télécharger le QR Code
                </button>
              </div>
            )}

            <div className={styles.addressBox}>
              <h4>Adresse de Retour Officielle</h4>
              {(() => {
                const address = getReturnAddress();
                return (
                  <div className={styles.address}>
                    <div><strong>{address.name}</strong></div>
                    <div>{address.street}</div>
                    <div>{address.city}, {address.state} {address.zip}</div>
                    <div>{address.country}</div>
                    <div>Tel: {address.phone}</div>
                  </div>
                );
              })()}
            </div>

            <div className={styles.returnLabelBox}>
              <h4>Numéro d'Étiquette de Retour</h4>
              <div className={styles.returnLabel}>{returnLabel}</div>
              <small>Gardez ce numéro pour référence</small>
            </div>

            <form onSubmit={handleAddTracking} className={styles.trackingForm}>
              <h3>Ajouter le Numéro de Suivi</h3>
              <p className={styles.trackingInstructions}>
                Après avoir déposé votre colis au bureau d'envoi, entrez le numéro de suivi que vous avez reçu
              </p>
              
              <div className={styles.formSection}>
                <label className={styles.label}>Numéro de Suivi *</label>
                <input
                  type="text"
                  value={formData.trackingNumber}
                  onChange={(e) => setFormData({ ...formData, trackingNumber: e.target.value })}
                  placeholder="Ex: 1Z999AA10123456784"
                  required
                  className={styles.input}
                />
              </div>

              {error && (
                <div className={styles.error}>
                  ⚠️ {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !formData.trackingNumber.trim()}
                className={styles.submitBtn}
              >
                {loading ? '⏳ Finalisation...' : 'Terminer'}
              </button>
            </form>
          </div>
        </div>
      )}

      {step === 'completed' && (
        <div className={styles.completedSection}>
          <div className={styles.successBox}>
            <div className={styles.successIcon}>✅</div>
            <h2>Retour Finalisé avec Succès</h2>
            <p>
              Votre retour a été enregistré. L'administrateur a été notifié et suivra votre colis.
              Vous recevrez un remboursement après réception et vérification du produit.
            </p>
            <button
              onClick={() => {
                setStep('form');
                setFormData({
                  orderNumber: '',
                  trackingNumber: '',
                  reason: '',
                  productPhoto: null,
                  additionalInfo: '',
                });
                setPhotoPreview('');
                setQrCodeUrl('');
                setReturnLabel('');
              }}
              className={styles.submitBtn}
            >
              Nouveau Retour
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

