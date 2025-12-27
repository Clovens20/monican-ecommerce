'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import styles from './ProductForm.module.css';

interface ProductImage {
    id: string;
    url: string;
    alt: string;
    isPrimary: boolean;
    type?: 'image' | 'video'; // Nouveau: type de média
}

interface ProductVariant {
    size: string;
    stock: number;
    sku: string;
    color?: string; // Optionnel pour rétrocompatibilité
}

// Nouvelle structure pour gérer le stock par couleur et taille
interface ColorSizeStock {
    color: string;
    size: string;
    stock: number;
    sku: string;
}

interface ProductFeature {
    name: string;
    value: string;
}

interface Category {
    slug: string;
    name_key: string;
    icon: string | null;
    is_active: boolean;
}

interface ProductFormData {
    name: string;
    category: string;
    price: number;
    comparePrice: number | null;
    sku: string;
    description: string;
    detailedDescription: string;
    brand: string;
    model: string;
    images: ProductImage[];
    variants: ProductVariant[];
    colorSizeStocks: ColorSizeStock[]; // Nouvelle structure pour stock par couleur/taille
    features: ProductFeature[];
    colors: string[];
    isNew: boolean;
    isFeatured: boolean;
}

// Catégories qui nécessitent des tailles
const CATEGORIES_WITH_SIZES = ['tennis', 'chemises', 'jeans', 'maillots', 'chaussures'];
const CATEGORIES_WITHOUT_SIZES = ['accessoires'];

// Tailles prédéfinies
const CLOTHING_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const SHOES_SIZES = ['35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45'];
const JEANS_SIZES = ['28', '30', '31', '32', '33', '34', '35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '46', '48'];

export default function ProductForm({ initialData }: { initialData?: any }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
    const [categories, setCategories] = useState<Category[]>([]);
    const [draggedImageIndex, setDraggedImageIndex] = useState<number | null>(null);
    const [autoSaveStatus, setAutoSaveStatus] = useState<string>('');
    const [showPreview, setShowPreview] = useState(false);
    
    const [formData, setFormData] = useState<ProductFormData>(() => {
        if (initialData) {
            // Convertir les anciens variants en colorSizeStocks si nécessaire
            let colorSizeStocks: ColorSizeStock[] = [];
            if (initialData.colorSizeStocks && Array.isArray(initialData.colorSizeStocks)) {
                colorSizeStocks = initialData.colorSizeStocks;
            } else if (initialData.variants && initialData.colors && initialData.colors.length > 0) {
                // Migration: créer des entrées pour chaque couleur et taille
                initialData.colors.forEach((color: string) => {
                    initialData.variants.forEach((variant: ProductVariant) => {
                        colorSizeStocks.push({
                            color,
                            size: variant.size,
                            stock: variant.stock || 0,
                            sku: variant.sku || `${initialData.sku || 'PROD'}-${color}-${variant.size}`.toUpperCase()
                        });
                    });
                });
            }

            // Extraire les couleurs depuis colorSizeStocks si elles ne sont pas déjà dans colors
            let colors = initialData.colors || [];
            if (colorSizeStocks.length > 0 && colors.length === 0) {
                // Extraire les couleurs uniques depuis colorSizeStocks
                const uniqueColors = Array.from(new Set(
                    colorSizeStocks.map(entry => entry.color).filter(Boolean)
                ));
                colors = uniqueColors;
            } else if (colorSizeStocks.length > 0) {
                // S'assurer que toutes les couleurs de colorSizeStocks sont dans colors
                const colorsFromStocks = Array.from(new Set(
                    colorSizeStocks.map(entry => entry.color).filter(Boolean)
                ));
                const allColors = Array.from(new Set([...colors, ...colorsFromStocks]));
                colors = allColors;
            }
            
            return {
                name: initialData.name || '',
                category: initialData.category || 'tennis',
                price: initialData.price || 0,
                comparePrice: initialData.comparePrice || null,
                sku: initialData.sku || '',
                description: initialData.description || '',
                detailedDescription: initialData.detailedDescription || '',
                brand: initialData.brand || '',
                model: initialData.model || '',
                images: initialData.images || [],
                variants: initialData.variants || [],
                colorSizeStocks: colorSizeStocks,
                features: initialData.features || [],
                colors: colors,
                isNew: initialData.isNew || false,
                isFeatured: initialData.isFeatured || false,
            };
        }
        return {
            name: '',
            category: 'tennis',
            price: 0,
            comparePrice: null,
            sku: '',
            description: '',
            detailedDescription: '',
            brand: '',
            model: '',
            images: [],
            variants: [],
            colorSizeStocks: [],
            features: [],
            colors: [],
            isNew: false,
            isFeatured: false,
        };
    });

    // Charger les catégories disponibles
    useEffect(() => {
        async function fetchCategories() {
            try {
                const response = await fetch('/api/admin/categories');
                const data = await response.json();
                if (data.success) {
                    setCategories(data.categories || []);
                }
            } catch (err) {
                console.error('Error fetching categories:', err);
            }
        }
        fetchCategories();
    }, []);

    // Sauvegarde automatique en brouillon toutes les 30 secondes
    useEffect(() => {
        const autoSaveInterval = setInterval(() => {
            if (formData.name || formData.description) {
                saveDraft();
            }
        }, 30000); // 30 secondes

        return () => clearInterval(autoSaveInterval);
    }, [formData]);

    // Sauvegarder en brouillon dans localStorage
    const saveDraft = useCallback(() => {
        try {
            localStorage.setItem('product_draft', JSON.stringify(formData));
            setAutoSaveStatus('Brouillon sauvegardé');
            setTimeout(() => setAutoSaveStatus(''), 3000);
        } catch (err) {
            console.error('Error saving draft:', err);
        }
    }, [formData]);

    // Charger le brouillon au montage
    useEffect(() => {
        try {
            const draft = localStorage.getItem('product_draft');
            if (draft && !initialData) {
                const draftData = JSON.parse(draft);
                if (confirm('Un brouillon existe. Voulez-vous le charger ?')) {
                    setFormData(draftData);
                }
            }
        } catch (err) {
            console.error('Error loading draft:', err);
        }
    }, [initialData]);

    // Vérifier si la catégorie nécessite des tailles
    const categoryRequiresSizes = useMemo(() => {
        return CATEGORIES_WITH_SIZES.includes(formData.category);
    }, [formData.category]);

    // Obtenir les tailles prédéfinies selon la catégorie
    const getAvailableSizes = useCallback(() => {
        // Les tennis et chaussures utilisent des numéros (35-45)
        if (formData.category === 'tennis' || formData.category === 'chaussures') {
            return SHOES_SIZES;
        } else if (formData.category === 'jeans') {
            // Les jeans utilisent des tailles numériques (28-46)
            return JEANS_SIZES;
        } else if (CATEGORIES_WITH_SIZES.includes(formData.category)) {
            // Les autres catégories (chemises, maillots) utilisent XS, S, M, L, XL, XXL
            return CLOTHING_SIZES;
        }
        return [];
    }, [formData.category]);

    // Calculer le stock total (depuis colorSizeStocks)
    const totalStock = useMemo(() => {
        return formData.colorSizeStocks.reduce((sum, entry) => sum + (entry.stock || 0), 0);
    }, [formData.colorSizeStocks]);

    // Obtenir le statut du stock
    const getStockStatus = useCallback((stock: number) => {
        if (stock === 0) return { label: 'Rupture de stock', class: 'critical' };
        if (stock < 3) return { label: 'Stock critique', class: 'critical' };
        if (stock < 10) return { label: 'Stock faible', class: 'low' };
        return { label: 'En stock', class: 'ok' };
    }, []);

    // Validation en temps réel
    const validateField = useCallback((field: string, value: any) => {
        const errors: Record<string, string> = { ...validationErrors };
        
        switch (field) {
            case 'name':
                if (!value || value.trim().length === 0) {
                    errors.name = 'Le nom est requis';
                } else if (value.length < 3) {
                    errors.name = 'Le nom doit contenir au moins 3 caractères';
                } else {
                    delete errors.name;
                }
                break;
            case 'price':
                if (!value || value <= 0) {
                    errors.price = 'Le prix doit être supérieur à 0';
                } else {
                    delete errors.price;
                }
                break;
            case 'comparePrice':
                if (value && value <= formData.price) {
                    errors.comparePrice = 'Le prix comparatif doit être supérieur au prix de vente';
                } else {
                    delete errors.comparePrice;
                }
                break;
            case 'sku':
                if (!value || value.trim().length === 0) {
                    errors.sku = 'Le SKU est requis';
                } else {
                    delete errors.sku;
                }
                break;
            case 'description':
                if (!value || value.trim().length === 0) {
                    errors.description = 'La description est requise';
                } else {
                    delete errors.description;
                }
                break;
        }
        
        setValidationErrors(errors);
    }, [validationErrors, formData.price]);

    // Upload d'images avec drag & drop
    const handleImageUpload = async (files: FileList | null) => {
        if (!files || files.length === 0) return;

        setUploading(true);
        setError(null);

        try {
            const formDataToUpload = new FormData();
            Array.from(files).forEach((file) => {
                if (file.size > 5 * 1024 * 1024) {
                    setError(`L'image ${file.name} est trop grande (max 5MB)`);
                    return;
                }
                formDataToUpload.append('images', file);
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
                const errorMessage = data.error || 'Erreur lors de l\'upload des images';
                console.error('Upload error details:', data);
                setError(errorMessage + (data.details ? ` (${JSON.stringify(data.details)})` : ''));
            }
        } catch (err: any) {
            console.error('Error uploading images:', err);
            setError(`Erreur lors de l'upload des images: ${err.message || 'Erreur de connexion au serveur'}`);
        } finally {
            setUploading(false);
        }
    };

    // Drag & drop pour les images
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const files = e.dataTransfer.files;
        handleImageUpload(files);
    };

    // Réorganiser les images
    const moveImage = (fromIndex: number, toIndex: number) => {
        const newImages = [...formData.images];
        const [moved] = newImages.splice(fromIndex, 1);
        newImages.splice(toIndex, 0, moved);
        setFormData({ ...formData, images: newImages });
    };

    const handleDragStart = (index: number) => {
        setDraggedImageIndex(index);
    };

    const handleDragOverImage = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        if (draggedImageIndex === null || draggedImageIndex === index) return;
        
        const newImages = [...formData.images];
        const [dragged] = newImages.splice(draggedImageIndex, 1);
        newImages.splice(index, 0, dragged);
        setFormData({ ...formData, images: newImages });
        setDraggedImageIndex(index);
    };

    const handleDragEnd = () => {
        setDraggedImageIndex(null);
    };

    const removeImage = (index: number) => {
        const newImages = formData.images.filter((_, i) => i !== index);
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

    // Gestion des variants avec sélecteurs de tailles
    const addVariant = () => {
        const availableSizes = getAvailableSizes();
        const usedSizes = formData.variants.map(v => v.size);
        const nextSize = availableSizes.find(size => !usedSizes.includes(size)) || '';
        
        setFormData({
            ...formData,
            variants: [...formData.variants, { 
                size: nextSize, 
                stock: 0, 
                sku: `${formData.sku || 'PROD'}-${nextSize}`.toUpperCase() 
            }],
        });
    };

    const updateVariant = (index: number, field: keyof ProductVariant, value: string | number) => {
        const newVariants = [...formData.variants];
        newVariants[index] = { ...newVariants[index], [field]: value };
        
        // Générer automatiquement le SKU si la taille change
        if (field === 'size' && formData.sku) {
            newVariants[index].sku = `${formData.sku}-${value}`.toUpperCase();
        }
        
        setFormData({ ...formData, variants: newVariants });
    };

    const removeVariant = (index: number) => {
        setFormData({
            ...formData,
            variants: formData.variants.filter((_, i) => i !== index),
        });
    };

    // Réinitialiser les variants si on change de catégorie
    useEffect(() => {
        if (categoryRequiresSizes && formData.variants.length === 0) {
            // Ne pas réinitialiser automatiquement, laisser l'utilisateur ajouter
        } else if (!categoryRequiresSizes) {
            // Pour les catégories sans tailles, on peut avoir un variant unique
            if (formData.variants.length === 0) {
                setFormData({
                    ...formData,
                    variants: [{ size: 'Unique', stock: 0, sku: formData.sku || '' }],
                });
            }
        }
    }, [formData.category]);

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
        // Supprimer la couleur et toutes les entrées de stock associées
        setFormData({
            ...formData,
            colors: formData.colors.filter(c => c !== color),
            colorSizeStocks: formData.colorSizeStocks.filter(entry => entry.color !== color),
        });
    };

    // Gestion des stocks par couleur et taille
    const addStockEntry = (color: string, size: string) => {
        const sku = `${formData.sku || 'PROD'}-${color}-${size}`.toUpperCase();
        const newEntry: ColorSizeStock = {
            color,
            size,
            stock: 0,
            sku
        };
        
        // Vérifier si l'entrée existe déjà
        const exists = formData.colorSizeStocks.some(
            e => e.color === color && e.size === size
        );
        
        if (!exists) {
            setFormData({
                ...formData,
                colorSizeStocks: [...formData.colorSizeStocks, newEntry],
            });
        }
    };

    const updateStockEntry = (index: number, field: keyof ColorSizeStock, value: string | number) => {
        const newStocks = [...formData.colorSizeStocks];
        newStocks[index] = { ...newStocks[index], [field]: value };
        
        // Régénérer le SKU si la couleur ou la taille change
        if ((field === 'color' || field === 'size') && formData.sku) {
            newStocks[index].sku = `${formData.sku}-${newStocks[index].color}-${newStocks[index].size}`.toUpperCase();
        }
        
        setFormData({ ...formData, colorSizeStocks: newStocks });
    };

    const removeStockEntry = (index: number) => {
        setFormData({
            ...formData,
            colorSizeStocks: formData.colorSizeStocks.filter((_, i) => i !== index),
        });
    };

    // Obtenir les tailles disponibles pour une couleur donnée
    const getSizesForColor = (color: string) => {
        const usedSizes = formData.colorSizeStocks
            .filter(e => e.color === color)
            .map(e => e.size);
        return getAvailableSizes().filter(size => !usedSizes.includes(size));
    };

    // Obtenir les entrées de stock pour une couleur donnée
    const getStockEntriesForColor = (color: string) => {
        return formData.colorSizeStocks.filter(e => e.color === color);
    };

    // Convertir le nom de couleur en code hex approximatif pour l'affichage
    const getColorHex = (colorName: string): string => {
        const colorMap: Record<string, string> = {
            // Français
            'Noir': '#000000',
            'Blanc': '#FFFFFF',
            'Rouge': '#FF0000',
            'Bleu': '#0000FF',
            'Vert': '#00FF00',
            'Jaune': '#FFFF00',
            'Orange': '#FFA500',
            'Violet': '#800080',
            'Rose': '#FFC0CB',
            'Gris': '#808080',
            'Marron': '#A52A2A',
            'Beige': '#F5F5DC',
            // Anglais
            'White': '#FFFFFF',
            'Red': '#FF0000',
            'Blue': '#0000FF',
            'Green': '#00FF00',
            'Yellow': '#FFFF00',
            'Purple': '#800080',
            'Pink': '#FFC0CB',
            'Gray': '#808080',
            'Grey': '#808080',
            'Brown': '#A52A2A',
        };
        return colorMap[colorName] || '#CCCCCC';
    };

    // Validation complète avant soumission
    const validateForm = useCallback((): boolean => {
        const errors: Record<string, string> = {};

        if (!formData.name || formData.name.trim().length < 3) {
            errors.name = 'Le nom doit contenir au moins 3 caractères';
        }

        if (!formData.sku || formData.sku.trim().length === 0) {
            errors.sku = 'Le SKU est requis';
        }

        if (!formData.description || formData.description.trim().length === 0) {
            errors.description = 'La description est requise';
        }

        if (!formData.price || formData.price <= 0) {
            errors.price = 'Le prix doit être supérieur à 0';
        }

        if (formData.comparePrice && formData.comparePrice <= formData.price) {
            errors.comparePrice = 'Le prix comparatif doit être supérieur au prix de vente';
        }

        if (formData.images.length === 0) {
            errors.images = 'Veuillez ajouter au moins une image';
        }

        if (categoryRequiresSizes) {
            if (formData.colors.length === 0) {
                errors.colors = 'Veuillez ajouter au moins une couleur';
            }
            if (formData.colorSizeStocks.length === 0) {
                errors.variants = 'Veuillez ajouter au moins une combinaison couleur/taille avec stock';
            }
        }

        // Vérifier que toutes les entrées de stock ont une couleur, taille et stock valides
        formData.colorSizeStocks.forEach((entry, index) => {
            if (!entry.color || entry.color.trim().length === 0) {
                errors[`stock_${index}_color`] = 'La couleur est requise';
            }
            if (!entry.size || entry.size.trim().length === 0) {
                errors[`stock_${index}_size`] = 'La taille est requise';
            }
            if (entry.stock < 0) {
                errors[`stock_${index}_stock`] = 'Le stock ne peut pas être négatif';
            }
        });

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    }, [formData, categoryRequiresSizes]);

    const handleSubmit = async (e: React.FormEvent, isDraft: boolean = false) => {
        e.preventDefault();
        
        if (!isDraft && !validateForm()) {
            setError('Veuillez corriger les erreurs dans le formulaire');
            return;
        }

        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            // Préparer les données
            const submitData: any = {
                name: formData.name,
                description: formData.description,
                detailedDescription: formData.detailedDescription,
                price: formData.price,
                comparePrice: formData.comparePrice,
                sku: formData.sku,
                category: formData.category,
                brand: formData.brand || null,
                model: formData.model || null,
                images: formData.images.map(img => ({
                    url: img.url,
                    alt: img.alt,
                    isPrimary: img.isPrimary,
                })),
                variants: formData.variants, // Garder pour rétrocompatibilité
                colorSizeStocks: formData.colorSizeStocks, // Nouvelle structure
                features: formData.features,
                colors: formData.colors,
                isNew: formData.isNew,
                isFeatured: formData.isFeatured,
                isDraft: isDraft,
            };

            // Déterminer si c'est une création ou une mise à jour
            const isEdit = initialData?.id;
            const url = isEdit ? `/api/admin/products/${initialData.id}` : '/api/admin/products';
            const method = isEdit ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(submitData),
            });

            const data = await response.json();

            if (data.success) {
                // Supprimer le brouillon après sauvegarde réussie
                localStorage.removeItem('product_draft');
                setSuccess(true);
                setTimeout(() => {
                    router.push('/admin/products');
                }, 1500);
            } else {
                setError(data.error || `Erreur lors de la ${isEdit ? 'mise à jour' : 'sauvegarde'} du produit`);
            }
        } catch (err) {
            console.error('Error saving product:', err);
            setError('Erreur lors de la sauvegarde du produit');
        } finally {
            setLoading(false);
        }
    };

    // Récupérer les catégories actives pour le select
    const activeCategories = useMemo(() => {
        return categories.filter(cat => cat.is_active);
    }, [categories]);

    return (
        <div className={styles.container}>
            <form onSubmit={(e) => handleSubmit(e, false)} className={styles.form}>
                {error && (
                    <div className={styles.errorMessage}>
                        {error}
                    </div>
                )}

                {success && (
                    <div className={styles.successMessage}>
                        ✓ Produit {initialData?.id ? 'modifié' : 'créé'} avec succès ! Redirection...
                    </div>
                )}

                {autoSaveStatus && (
                    <div className={styles.autoSaveMessage}>
                        {autoSaveStatus}
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
                                className={`${styles.input} ${validationErrors.name ? styles.inputError : ''}`}
                                value={formData.name}
                                onChange={(e) => {
                                    setFormData({ ...formData, name: e.target.value });
                                    validateField('name', e.target.value);
                                }}
                                onBlur={() => validateField('name', formData.name)}
                                required
                            />
                            {validationErrors.name && (
                                <span className={styles.fieldError}>{validationErrors.name}</span>
                            )}
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>
                                Catégorie <span className={styles.required}>*</span>
                            </label>
                            <select
                                className={styles.input}
                                value={formData.category}
                                onChange={(e) => {
                                    const newCategory = e.target.value;
                                    // Réinitialiser les variants et colorSizeStocks quand on change de catégorie
                                    // car les tailles disponibles peuvent être différentes
                                    setFormData({ 
                                        ...formData, 
                                        category: newCategory,
                                        variants: [], // Réinitialiser les variants
                                        colorSizeStocks: [] // Réinitialiser les stocks par couleur/taille
                                    });
                                }}
                                required
                            >
                                {activeCategories.length > 0 ? (
                                    activeCategories.map(cat => (
                                        <option key={cat.slug} value={cat.slug}>
                                            {cat.icon} {cat.name_key}
                                        </option>
                                    ))
                                ) : (
                                    <>
                                        <option value="tennis">Tennis</option>
                                        <option value="chemises">Chemises</option>
                                        <option value="jeans">Jeans</option>
                                        <option value="maillots">Maillots</option>
                                        <option value="chaussures">Chaussures</option>
                                        <option value="accessoires">Accessoires</option>
                                    </>
                                )}
                            </select>
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>
                                SKU / Référence <span className={styles.required}>*</span>
                            </label>
                            <input
                                type="text"
                                className={`${styles.input} ${validationErrors.sku ? styles.inputError : ''}`}
                                value={formData.sku}
                                onChange={(e) => {
                                    const newSku = e.target.value.toUpperCase();
                                    setFormData({ ...formData, sku: newSku });
                                    validateField('sku', newSku);
                                    
                                    // Mettre à jour les SKU des variants si nécessaire
                                    if (formData.variants.length > 0) {
                                        const updatedVariants = formData.variants.map(v => ({
                                            ...v,
                                            sku: `${newSku}-${v.size}`.toUpperCase(),
                                        }));
                                        setFormData(prev => ({ ...prev, variants: updatedVariants }));
                                    }
                                }}
                                onBlur={() => validateField('sku', formData.sku)}
                                placeholder="PROD-001"
                                required
                            />
                            {validationErrors.sku && (
                                <span className={styles.fieldError}>{validationErrors.sku}</span>
                            )}
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>
                                Prix de vente ($) <span className={styles.required}>*</span>
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                className={`${styles.input} ${validationErrors.price ? styles.inputError : ''}`}
                                value={formData.price}
                                onChange={(e) => {
                                    const price = parseFloat(e.target.value) || 0;
                                    setFormData({ ...formData, price });
                                    validateField('price', price);
                                }}
                                onBlur={() => validateField('price', formData.price)}
                                required
                            />
                            {validationErrors.price && (
                                <span className={styles.fieldError}>{validationErrors.price}</span>
                            )}
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>
                                Prix comparatif ($)
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                className={`${styles.input} ${validationErrors.comparePrice ? styles.inputError : ''}`}
                                value={formData.comparePrice || ''}
                                onChange={(e) => {
                                    const comparePrice = e.target.value ? parseFloat(e.target.value) : null;
                                    setFormData({ ...formData, comparePrice });
                                    validateField('comparePrice', comparePrice);
                                }}
                                onBlur={() => validateField('comparePrice', formData.comparePrice)}
                                placeholder="Prix barré (optionnel)"
                            />
                            {validationErrors.comparePrice && (
                                <span className={styles.fieldError}>{validationErrors.comparePrice}</span>
                            )}
                            {formData.comparePrice && formData.comparePrice > formData.price && (
                                <span className={styles.hint}>
                                    Réduction de {Math.round(((formData.comparePrice - formData.price) / formData.comparePrice) * 100)}%
                                </span>
                            )}
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Marque</label>
                            <input
                                type="text"
                                className={styles.input}
                                value={formData.brand}
                                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                                placeholder="Nom de la marque"
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Modèle</label>
                            <input
                                type="text"
                                className={styles.input}
                                value={formData.model}
                                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                                placeholder="Nom du modèle"
                            />
                        </div>
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>
                            Description <span className={styles.required}>*</span>
                        </label>
                        <textarea
                            className={`${styles.textarea} ${validationErrors.description ? styles.inputError : ''}`}
                            rows={4}
                            value={formData.description}
                            onChange={(e) => {
                                setFormData({ ...formData, description: e.target.value });
                                validateField('description', e.target.value);
                            }}
                            onBlur={() => validateField('description', formData.description)}
                            placeholder="Description courte du produit (visible sur la fiche produit)"
                            required
                        />
                        {validationErrors.description && (
                            <span className={styles.fieldError}>{validationErrors.description}</span>
                        )}
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Description détaillée</label>
                        <textarea
                            className={styles.textarea}
                            rows={6}
                            value={formData.detailedDescription}
                            onChange={(e) => setFormData({ ...formData, detailedDescription: e.target.value })}
                            placeholder="Description complète avec détails, matériaux, entretien, etc."
                        />
                        <span className={styles.hint}>
                            {formData.detailedDescription.length} caractères
                        </span>
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

                {/* Images avec drag & drop */}
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>
                        Images <span className={styles.required}>*</span>
                    </h2>
                    
                    <div 
                        className={styles.imageUploadArea}
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                    >
                        <input
                            type="file"
                            id="imageUpload"
                            accept="image/*"
                            multiple
                            onChange={(e) => handleImageUpload(e.target.files)}
                            className={styles.fileInput}
                            disabled={uploading || loading}
                        />
                        <label htmlFor="imageUpload" className={styles.uploadButton}>
                            {uploading ? 'Upload en cours...' : '📷 Glissez-déposez ou cliquez pour ajouter des images'}
                        </label>
                        <p className={styles.uploadHint}>
                            Formats acceptés: JPG, PNG, WEBP. Taille max: 5MB par image. 
                            Vous pouvez glisser-déposer plusieurs images à la fois.
                        </p>
                    </div>

                    {formData.images.length > 0 && (
                        <div className={styles.imageGrid}>
                            {formData.images.map((image, index) => (
                                <div 
                                    key={index} 
                                    className={`${styles.imageItem} ${draggedImageIndex === index ? styles.dragging : ''}`}
                                    draggable
                                    onDragStart={() => handleDragStart(index)}
                                    onDragOver={(e) => handleDragOverImage(e, index)}
                                    onDragEnd={handleDragEnd}
                                >
                                    <div className={styles.imageOrder}>{index + 1}</div>
                                    <img src={image.url} alt={image.alt} className={styles.imagePreview} />
                                    <div className={styles.imageActions}>
                                        {image.isPrimary && (
                                            <span className={styles.primaryBadge}>⭐ Principale</span>
                                        )}
                                        {!image.isPrimary && (
                                            <button
                                                type="button"
                                                onClick={() => setPrimaryImage(index)}
                                                className={styles.imageBtn}
                                            >
                                                ⭐ Définir principale
                                            </button>
                                        )}
                                        {image.type === 'video' && (
                                            <span className={styles.videoBadge}>🎥 Vidéo</span>
                                        )}
                                        {index > 0 && (
                                            <button
                                                type="button"
                                                onClick={() => moveImage(index, index - 1)}
                                                className={styles.imageBtn}
                                            >
                                                ⬆️ Monter
                                            </button>
                                        )}
                                        {index < formData.images.length - 1 && (
                                            <button
                                                type="button"
                                                onClick={() => moveImage(index, index + 1)}
                                                className={styles.imageBtn}
                                            >
                                                ⬇️ Descendre
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => removeImage(index)}
                                            className={`${styles.imageBtn} ${styles.dangerBtn}`}
                                        >
                                            🗑️ Supprimer
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    {validationErrors.images && (
                        <span className={styles.fieldError}>{validationErrors.images}</span>
                    )}
                </section>

                {/* Gestion des stocks intelligente par couleur et taille */}
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>
                        Gestion des stocks
                        {totalStock > 0 && (
                            <span className={styles.totalStock}>
                                Stock total: {totalStock} unités
                            </span>
                        )}
                    </h2>

                    {categoryRequiresSizes ? (
                        <>
                            {formData.colors.length === 0 ? (
                                <div className={styles.infoBox}>
                                    <p>⚠️ Veuillez d'abord ajouter des couleurs dans la section "Couleurs" ci-dessous pour gérer les stocks.</p>
                                </div>
                            ) : (
                                <>
                                    {formData.colors.map((color) => {
                                        const colorStocks = getStockEntriesForColor(color);
                                        const availableSizes = getSizesForColor(color);
                                        const colorTotalStock = colorStocks.reduce((sum, e) => sum + (e.stock || 0), 0);
                                        
                                        return (
                                            <div key={color} className={styles.colorStockSection}>
                                                <div className={styles.colorStockHeader}>
                                                    <h3 className={styles.colorStockTitle}>
                                                        <span className={styles.colorIndicator} style={{ backgroundColor: getColorHex(color) }}></span>
                                                        {color}
                                                        {colorTotalStock > 0 && (
                                                            <span className={styles.colorStockTotal}>
                                                                ({colorTotalStock} unités)
                                                            </span>
                                                        )}
                                                    </h3>
                                                </div>
                                                
                                                <div className={styles.stockTableContainer}>
                                                    <table className={styles.stockTable}>
                                                        <thead>
                                                            <tr>
                                                                <th>Taille</th>
                                                                <th>Quantité en stock</th>
                                                                <th>SKU Variant</th>
                                                                <th>Statut</th>
                                                                <th>Actions</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {colorStocks.map((entry, index) => {
                                                                const globalIndex = formData.colorSizeStocks.findIndex(
                                                                    e => e.color === entry.color && e.size === entry.size
                                                                );
                                                                const stockStatus = getStockStatus(entry.stock);
                                                                return (
                                                                    <tr key={`${color}-${entry.size}`}>
                                                                        <td>
                                                                            <select
                                                                                className={styles.variantSelect}
                                                                                value={entry.size}
                                                                                onChange={(e) => {
                                                                                    const newSize = e.target.value;
                                                                                    updateStockEntry(globalIndex, 'size', newSize);
                                                                                }}
                                                                            >
                                                                                <option value="">Sélectionner une taille</option>
                                                                                {getAvailableSizes().map(size => (
                                                                                    <option 
                                                                                        key={size} 
                                                                                        value={size}
                                                                                        disabled={formData.colorSizeStocks.some(
                                                                                            e => e.color === color && e.size === size && e.size !== entry.size
                                                                                        )}
                                                                                    >
                                                                                        {size}
                                                                                    </option>
                                                                                ))}
                                                                            </select>
                                                                        </td>
                                                                        <td>
                                                                            <input
                                                                                type="number"
                                                                                min="0"
                                                                                className={`${styles.stockInput} ${stockStatus.class === 'critical' ? styles.stockCritical : stockStatus.class === 'low' ? styles.stockLow : ''}`}
                                                                                value={entry.stock}
                                                                                onChange={(e) => updateStockEntry(globalIndex, 'stock', parseInt(e.target.value) || 0)}
                                                                            />
                                                                        </td>
                                                                        <td>
                                                                            <input
                                                                                type="text"
                                                                                className={styles.variantInput}
                                                                                value={entry.sku}
                                                                                onChange={(e) => updateStockEntry(globalIndex, 'sku', e.target.value)}
                                                                                placeholder="SKU variant"
                                                                            />
                                                                        </td>
                                                                        <td>
                                                                            <span className={`${styles.stockBadge} ${styles[stockStatus.class]}`}>
                                                                                {stockStatus.label}
                                                                            </span>
                                                                        </td>
                                                                        <td>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => removeStockEntry(globalIndex)}
                                                                                className={`${styles.removeBtn} ${styles.dangerBtn}`}
                                                                                title="Supprimer cette taille"
                                                                            >
                                                                                ➖
                                                                            </button>
                                                                        </td>
                                                                    </tr>
                                                                );
                                                            })}
                                                        </tbody>
                                                    </table>
                                                </div>
                                                
                                                {availableSizes.length > 0 && (
                                                    <div className={styles.addSizeForColor}>
                                                        <select
                                                            className={styles.sizeSelect}
                                                            value=""
                                                            onChange={(e) => {
                                                                if (e.target.value) {
                                                                    addStockEntry(color, e.target.value);
                                                                    e.target.value = '';
                                                                }
                                                            }}
                                                        >
                                                            <option value="">➕ Ajouter une taille pour {color}</option>
                                                            {availableSizes.map(size => (
                                                                <option key={size} value={size}>
                                                                    {size}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                )}
                                                
                                                {availableSizes.length === 0 && colorStocks.length > 0 && (
                                                    <p className={styles.hint}>Toutes les tailles disponibles ont été ajoutées pour {color}</p>
                                                )}
                                            </div>
                                        );
                                    })}
                                </>
                            )}
                        </>
                    ) : (
                        <>
                            <div className={styles.simpleStockContainer}>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>
                                        Quantité en stock <span className={styles.required}>*</span>
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        className={`${styles.input} ${styles.stockInput}`}
                                        value={formData.variants[0]?.stock || 0}
                                        onChange={(e) => {
                                            const stock = parseInt(e.target.value) || 0;
                                            if (formData.variants.length === 0) {
                                                setFormData({
                                                    ...formData,
                                                    variants: [{ size: 'Unique', stock, sku: formData.sku || '' }],
                                                });
                                            } else {
                                                updateVariant(0, 'stock', stock);
                                            }
                                        }}
                                        required
                                    />
                                    {formData.variants[0] && (
                                        <span className={`${styles.stockBadge} ${styles[getStockStatus(formData.variants[0].stock).class]}`}>
                                            {getStockStatus(formData.variants[0].stock).label}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </>
                    )}

                    {validationErrors.variants && (
                        <span className={styles.fieldError}>{validationErrors.variants}</span>
                    )}
                </section>

                {/* Couleurs - DOIT ÊTRE AVANT LA GESTION DES STOCKS */}
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>Couleurs</h2>
                    <p className={styles.sectionHint}>
                        Ajoutez d'abord les couleurs disponibles pour ce produit, puis vous pourrez gérer les stocks par couleur et taille.
                    </p>
                    
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
                                    <span className={styles.colorIndicator} style={{ backgroundColor: getColorHex(color) }}></span>
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
                        ➕ Ajouter une caractéristique
                    </button>
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
                        type="button"
                        onClick={(e) => handleSubmit(e, true)}
                        className={styles.draftButton}
                        disabled={loading}
                    >
                        💾 Enregistrer comme brouillon
                    </button>
                    <button
                        type="submit"
                        className={styles.submitButton}
                        disabled={loading}
                    >
                        {loading ? 'Sauvegarde...' : initialData?.id ? '✅ Mettre à jour le produit' : '✅ Enregistrer le produit'}
                    </button>
                </div>
            </form>
        </div>
    );
}
