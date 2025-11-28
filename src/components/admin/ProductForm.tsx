'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './ProductForm.module.css';

interface ProductImage {
    id?: string;
    url: string;
    alt: string;
    isPrimary: boolean;
    file?: File; // Pour les nouveaux uploads
}

interface ProductVariant {
    size: string;
    stock: number;
    sku: string;
}

interface ProductFeature {
    name: string;
    value: string;
}

interface ProductFormData {
    name: string;
    category: string;
    price: number;
    description: string;
    detailedDescription: string;
    brand: string;
    images: ProductImage[];
    variants: ProductVariant[];
    features: ProductFeature[];
    colors: string[];
    isNew: boolean;
    isFeatured: boolean;
}

export default function ProductForm({ initialData }: { initialData?: any }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    
    const [formData, setFormData] = useState<ProductFormData>(initialData || {
        name: '',
        category: 'tennis',
        price: 0,
        description: '',
        detailedDescription: '',
        brand: '',
        images: [],
        variants: [],
        features: [],
        colors: [],
        isNew: false,
        isFeatured: false,
    });

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setLoading(true);
        setError(null);

        try {
            const formDataToUpload = new FormData();
            Array.from(files).forEach((file, index) => {
                formDataToUpload.append(`images`, file);
            });

            const response = await fetch('/api/admin/products/upload-images', {
                method: 'POST',
                body: formDataToUpload,
            });

            const data = await response.json();

            if (data.success && data.urls) {
                const newImages: ProductImage[] = data.urls.map((url: string, index: number) => ({
                    url,
                    alt: formData.name || `Image ${index + 1}`,
                    isPrimary: formData.images.length === 0 && index === 0,
                }));

                setFormData({
                    ...formData,
                    images: [...formData.images, ...newImages],
                });
            } else {
                setError(data.error || 'Erreur lors de l\'upload des images');
            }
        } catch (err) {
            console.error('Error uploading images:', err);
            setError('Erreur lors de l\'upload des images');
        } finally {
            setLoading(false);
        }
    };

    const removeImage = (index: number) => {
        const newImages = formData.images.filter((_, i) => i !== index);
        // Si on supprime l'image primaire, la première restante devient primaire
        if (newImages.length > 0 && formData.images[index]?.isPrimary) {
            newImages[0].isPrimary = true;
        }
        setFormData({ ...formData, images: newImages });
    };

    const setPrimaryImage = (index: number) => {
        const newImages = formData.images.map((img, i) => ({
            ...img,
            isPrimary: i === index,
        }));
        setFormData({ ...formData, images: newImages });
    };

    const addVariant = () => {
        setFormData({
            ...formData,
            variants: [...formData.variants, { size: '', stock: 0, sku: '' }],
        });
    };

    const updateVariant = (index: number, field: keyof ProductVariant, value: string | number) => {
        const newVariants = [...formData.variants];
        newVariants[index] = { ...newVariants[index], [field]: value };
        setFormData({ ...formData, variants: newVariants });
    };

    const removeVariant = (index: number) => {
        setFormData({
            ...formData,
            variants: formData.variants.filter((_, i) => i !== index),
        });
    };

    const addFeature = () => {
        setFormData({
            ...formData,
            features: [...formData.features, { name: '', value: '' }],
        });
    };

    const updateFeature = (index: number, field: 'name' | 'value', value: string) => {
        const newFeatures = [...formData.features];
        newFeatures[index] = { ...newFeatures[index], [field]: value };
        setFormData({ ...formData, features: newFeatures });
    };

    const removeFeature = (index: number) => {
        setFormData({
            ...formData,
            features: formData.features.filter((_, i) => i !== index),
        });
    };

    const addColor = (color: string) => {
        if (color && !formData.colors.includes(color)) {
            setFormData({
                ...formData,
                colors: [...formData.colors, color],
            });
        }
    };

    const removeColor = (color: string) => {
        setFormData({
            ...formData,
            colors: formData.colors.filter(c => c !== color),
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            // Validation
            if (!formData.name || !formData.description || formData.price <= 0) {
                setError('Veuillez remplir tous les champs obligatoires');
                setLoading(false);
                return;
            }

            if (formData.images.length === 0) {
                setError('Veuillez ajouter au moins une image');
                setLoading(false);
                return;
            }

            if (formData.variants.length === 0) {
                setError('Veuillez ajouter au moins une variante (taille)');
                setLoading(false);
                return;
            }

            const response = await fetch('/api/admin/products', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: formData.name,
                    description: formData.description,
                    detailedDescription: formData.detailedDescription,
                    price: formData.price,
                    category: formData.category,
                    brand: formData.brand || null,
                    images: formData.images.map(img => ({
                        url: img.url,
                        alt: img.alt,
                        isPrimary: img.isPrimary,
                    })),
                    variants: formData.variants,
                    features: formData.features,
                    colors: formData.colors,
                    isNew: formData.isNew,
                    isFeatured: formData.isFeatured,
                }),
            });

            const data = await response.json();

            if (data.success) {
                setSuccess(true);
                setTimeout(() => {
                    router.push('/admin/products');
                }, 1500);
            } else {
                setError(data.error || 'Erreur lors de la sauvegarde du produit');
            }
        } catch (err) {
            console.error('Error saving product:', err);
            setError('Erreur lors de la sauvegarde du produit');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <form onSubmit={handleSubmit} className={styles.form}>
                {error && (
                    <div className={styles.errorMessage}>
                        {error}
                    </div>
                )}

                {success && (
                    <div className={styles.successMessage}>
                        ✓ Produit créé avec succès ! Redirection...
                    </div>
                )}

                {/* Informations de base */}
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>Informations de base</h2>
                    
                    <div className={styles.formGrid}>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>
                                Nom du produit <span className={styles.required}>*</span>
                            </label>
                            <input
                                type="text"
                                className={styles.input}
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>
                                Catégorie <span className={styles.required}>*</span>
                            </label>
                            <select
                                className={styles.input}
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                required
                            >
                                <option value="tennis">Tennis</option>
                                <option value="chemises">Chemises</option>
                                <option value="jeans">Jeans</option>
                                <option value="maillots">Maillots</option>
                            </select>
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>
                                Prix ($) <span className={styles.required}>*</span>
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                className={styles.input}
                                value={formData.price}
                                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                                required
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Marque</label>
                            <input
                                type="text"
                                className={styles.input}
                                value={formData.brand}
                                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>
                            Description <span className={styles.required}>*</span>
                        </label>
                        <textarea
                            className={styles.textarea}
                            rows={4}
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            required
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Description détaillée</label>
                        <textarea
                            className={styles.textarea}
                            rows={6}
                            value={formData.detailedDescription}
                            onChange={(e) => setFormData({ ...formData, detailedDescription: e.target.value })}
                        />
                    </div>

                    <div className={styles.checkboxGroup}>
                        <label className={styles.checkboxLabel}>
                            <input
                                type="checkbox"
                                checked={formData.isNew}
                                onChange={(e) => setFormData({ ...formData, isNew: e.target.checked })}
                            />
                            <span>Nouveau produit</span>
                        </label>
                        <label className={styles.checkboxLabel}>
                            <input
                                type="checkbox"
                                checked={formData.isFeatured}
                                onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                            />
                            <span>Produit vedette</span>
                        </label>
                    </div>
                </section>

                {/* Images */}
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>
                        Images <span className={styles.required}>*</span>
                    </h2>
                    
                    <div className={styles.imageUploadArea}>
                        <input
                            type="file"
                            id="imageUpload"
                            accept="image/*"
                            multiple
                            onChange={handleImageUpload}
                            className={styles.fileInput}
                            disabled={loading}
                        />
                        <label htmlFor="imageUpload" className={styles.uploadButton}>
                            {loading ? 'Upload en cours...' : '📷 Ajouter des images'}
                        </label>
                        <p className={styles.uploadHint}>
                            Formats acceptés: JPG, PNG, WEBP. Taille max: 5MB par image.
                        </p>
                    </div>

                    {formData.images.length > 0 && (
                        <div className={styles.imageGrid}>
                            {formData.images.map((image, index) => (
                                <div key={index} className={styles.imageItem}>
                                    <img src={image.url} alt={image.alt} className={styles.imagePreview} />
                                    <div className={styles.imageActions}>
                                        {image.isPrimary && (
                                            <span className={styles.primaryBadge}>Principale</span>
                                        )}
                                        {!image.isPrimary && (
                                            <button
                                                type="button"
                                                onClick={() => setPrimaryImage(index)}
                                                className={styles.imageBtn}
                                            >
                                                Définir principale
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => removeImage(index)}
                                            className={`${styles.imageBtn} ${styles.dangerBtn}`}
                                        >
                                            Supprimer
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* Variantes (Tailles) */}
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>
                        Variantes (Tailles) <span className={styles.required}>*</span>
                    </h2>
                    
                    {formData.variants.map((variant, index) => (
                        <div key={index} className={styles.variantRow}>
                            <input
                                type="text"
                                placeholder="Taille (ex: S, M, L, 40, 42)"
                                className={styles.variantInput}
                                value={variant.size}
                                onChange={(e) => updateVariant(index, 'size', e.target.value)}
                                required
                            />
                            <input
                                type="number"
                                placeholder="Stock"
                                min="0"
                                className={styles.variantInput}
                                value={variant.stock}
                                onChange={(e) => updateVariant(index, 'stock', parseInt(e.target.value) || 0)}
                                required
                            />
                            <input
                                type="text"
                                placeholder="SKU"
                                className={styles.variantInput}
                                value={variant.sku}
                                onChange={(e) => updateVariant(index, 'sku', e.target.value)}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => removeVariant(index)}
                                className={`${styles.removeBtn} ${styles.dangerBtn}`}
                            >
                                ✕
                            </button>
                        </div>
                    ))}
                    
                    <button
                        type="button"
                        onClick={addVariant}
                        className={styles.addButton}
                    >
                        + Ajouter une variante
                    </button>
                </section>

                {/* Caractéristiques */}
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>Caractéristiques</h2>
                    
                    {formData.features.map((feature, index) => (
                        <div key={index} className={styles.featureRow}>
                            <input
                                type="text"
                                placeholder="Nom (ex: Matériau)"
                                className={styles.featureInput}
                                value={feature.name}
                                onChange={(e) => updateFeature(index, 'name', e.target.value)}
                            />
                            <input
                                type="text"
                                placeholder="Valeur (ex: Coton 100%)"
                                className={styles.featureInput}
                                value={feature.value}
                                onChange={(e) => updateFeature(index, 'value', e.target.value)}
                            />
                            <button
                                type="button"
                                onClick={() => removeFeature(index)}
                                className={`${styles.removeBtn} ${styles.dangerBtn}`}
                            >
                                ✕
                            </button>
                        </div>
                    ))}
                    
                    <button
                        type="button"
                        onClick={addFeature}
                        className={styles.addButton}
                    >
                        + Ajouter une caractéristique
                    </button>
                </section>

                {/* Couleurs */}
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>Couleurs</h2>
                    
                    <div className={styles.colorInputGroup}>
                        <input
                            type="text"
                            placeholder="Ajouter une couleur (ex: Rouge, Bleu, Noir)"
                            className={styles.colorInput}
                            onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    const input = e.currentTarget;
                                    if (input.value.trim()) {
                                        addColor(input.value.trim());
                                        input.value = '';
                                    }
                                }
                            }}
                        />
                        <button
                            type="button"
                            onClick={(e) => {
                                const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                                if (input.value.trim()) {
                                    addColor(input.value.trim());
                                    input.value = '';
                                }
                            }}
                            className={styles.addColorBtn}
                        >
                            Ajouter
                        </button>
                    </div>

                    {formData.colors.length > 0 && (
                        <div className={styles.colorTags}>
                            {formData.colors.map((color, index) => (
                                <span key={index} className={styles.colorTag}>
                                    {color}
                                    <button
                                        type="button"
                                        onClick={() => removeColor(color)}
                                        className={styles.colorRemove}
                                    >
                                        ✕
                                    </button>
                                </span>
                            ))}
                        </div>
                    )}
                </section>

                {/* Actions */}
                <div className={styles.actions}>
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className={styles.cancelButton}
                        disabled={loading}
                    >
                        Annuler
                    </button>
                    <button
                        type="submit"
                        className={styles.submitButton}
                        disabled={loading}
                    >
                        {loading ? 'Sauvegarde...' : 'Sauvegarder le produit'}
                    </button>
                </div>
            </form>
        </div>
    );
}
