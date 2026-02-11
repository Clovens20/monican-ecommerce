'use client';

import { useState, useMemo, useEffect } from 'react';
import styles from './ProductVariantSelector.module.css';

interface ColorSizeStock {
    color: string;
    size: string;
    stock: number;
    sku: string;
}

interface ProductImage {
    id?: string;
    url: string;
    alt: string;
    isPrimary?: boolean;
    type?: 'image' | 'video';
    color?: string; // Couleur associée (assignée par l'admin)
}

interface ProductVariantSelectorProps {
    colorSizeStocks: ColorSizeStock[];
    colors: string[];
    images?: ProductImage[]; // ✅ NOUVEAU : Images du produit
    onSelectionChange: (selection: { color: string; size: string; sku: string; stock: number } | null) => void;
    onColorChange?: (color: string, imageIndex: number) => void; // ✅ NOUVEAU : Notifier le changement de couleur
}

export default function ProductVariantSelector({ 
    colorSizeStocks, 
    colors,
    images = [],
    onSelectionChange,
    onColorChange
}: ProductVariantSelectorProps) {
    const [selectedColor, setSelectedColor] = useState<string>('');
    const [selectedSize, setSelectedSize] = useState<string>('');

    // Mapper les couleurs aux images : priorité 1) champ color, 2) URL/alt, 3) ordre
    const colorImageMap = useMemo(() => {
        const map = new Map<string, number>();
        
        colors.forEach((color) => {
            // 1. Priorité : image avec color explicite assigné par l'admin
            let imageIndex = images.findIndex((img) => 
                img.color && img.color.trim().toLowerCase() === color.trim().toLowerCase()
            );
            
            // 2. Fallback : détection par URL ou alt
            if (imageIndex === -1) {
                const colorLower = color.toLowerCase().trim();
                imageIndex = images.findIndex((img) => {
                    const url = (img.url || '').toLowerCase();
                    const alt = (img.alt || '').toLowerCase();
                    const colorVariants = getColorVariants(colorLower);
                    return colorVariants.some(variant => 
                        url.includes(variant) || alt.includes(variant)
                    );
                });
            }
            
            // 3. Fallback : mapping par ordre (1ère couleur = 1ère image, etc.)
            if (imageIndex === -1) {
                const colorIndex = colors.indexOf(color);
                if (colorIndex >= 0 && colorIndex < images.length) {
                    imageIndex = colorIndex;
                }
            }
            
            if (imageIndex !== -1) {
                map.set(color, imageIndex);
            }
        });
        
        return map;
    }, [colors, images]);

    // Obtenir les tailles disponibles pour la couleur sélectionnée
    const availableSizes = useMemo(() => {
        if (!selectedColor) return [];
        return colorSizeStocks
            .filter(stock => stock.color === selectedColor && stock.stock > 0)
            .map(stock => ({
                size: stock.size,
                stock: stock.stock,
                sku: stock.sku
            }));
    }, [selectedColor, colorSizeStocks]);

    // Obtenir le stock total par couleur
    const colorStocks = useMemo(() => {
        const stockByColor = new Map<string, number>();
        colorSizeStocks.forEach(stock => {
            const current = stockByColor.get(stock.color) || 0;
            stockByColor.set(stock.color, current + stock.stock);
        });
        return stockByColor;
    }, [colorSizeStocks]);

    // Convertir le nom de couleur en code hex pour l'affichage
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
            'Black': '#000000',
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
            // Combinaisons courantes
            'Noir et blanc': '#000000',
            'Blanc et noir': '#FFFFFF',
            'Bleu / Blanc et Noir': '#0000FF',
            'Rouge et blanc': '#FF0000',
            'Vert et blanc': '#00FF00',
        };
        
        // Essayer de trouver une correspondance exacte
        if (colorMap[colorName]) {
            return colorMap[colorName];
        }
        
        // Sinon, chercher la première couleur mentionnée
        const firstColor = Object.keys(colorMap).find(key => 
            colorName.toLowerCase().includes(key.toLowerCase())
        );
        
        return firstColor ? colorMap[firstColor] : '#CCCCCC';
    };

    // Gérer la sélection de couleur
    const handleColorSelect = (color: string) => {
        setSelectedColor(color);
        setSelectedSize(''); // Réinitialiser la taille
        onSelectionChange(null);
        
        // ✅ NOUVEAU : Notifier le changement d'image
        if (onColorChange) {
            const imageIndex = colorImageMap.get(color);
            if (imageIndex !== undefined) {
                onColorChange(color, imageIndex);
            }
        }
    };

    // Gérer la sélection de taille
    const handleSizeSelect = (size: string) => {
        setSelectedSize(size);
        
        // Trouver le stock correspondant
        const stockEntry = colorSizeStocks.find(
            stock => stock.color === selectedColor && stock.size === size
        );
        
        if (stockEntry) {
            onSelectionChange({
                color: selectedColor,
                size: size,
                sku: stockEntry.sku,
                stock: stockEntry.stock
            });
        }
    };

    // Obtenir le stock pour la sélection actuelle
    const getCurrentStock = useMemo(() => {
        if (!selectedColor || !selectedSize) return null;
        const stockEntry = colorSizeStocks.find(
            stock => stock.color === selectedColor && stock.size === selectedSize
        );
        return stockEntry ? stockEntry.stock : 0;
    }, [selectedColor, selectedSize, colorSizeStocks]);

    return (
        <div className={styles.variantSelector}>
            {/* Sélection de couleur */}
            <div className={styles.colorSection}>
                <div className={styles.sectionHeader}>
                    <h3 className={styles.sectionTitle}>
                        Couleur
                        {selectedColor && (
                            <span className={styles.selectedValue}> : {selectedColor}</span>
                        )}
                    </h3>
                    {selectedColor && colorStocks.get(selectedColor) !== undefined && (
                        <span className={styles.stockInfo}>
                            {colorStocks.get(selectedColor)} disponible{colorStocks.get(selectedColor)! > 1 ? 's' : ''}
                        </span>
                    )}
                </div>
                
                <div className={styles.colorGrid}>
                    {colors.filter(color => colorStocks.get(color)! > 0).map((color) => {
                        const hasImage = colorImageMap.has(color); // Vérifier si une image existe
                        
                        return (
                            <button
                                key={color}
                                type="button"
                                className={`${styles.colorOption} ${selectedColor === color ? styles.selected : ''} ${colorStocks.get(color) === 0 ? styles.outOfStock : ''}`}
                                onClick={() => handleColorSelect(color)}
                                disabled={colorStocks.get(color) === 0}
                                title={`${color} - ${colorStocks.get(color)} disponible(s)${hasImage ? ' (avec image)' : ''}`}
                            >
                                <span 
                                    className={styles.colorCircle} 
                                    style={{ backgroundColor: getColorHex(color) }}
                                >
                                    {hasImage && <span className={styles.imageIndicator}>📷</span>}
                                </span>
                                <span className={styles.colorName}>{color}</span>
                                {colorStocks.get(color) === 0 && (
                                    <span className={styles.outOfStockBadge}>Épuisé</span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Sélection de taille */}
            {selectedColor && availableSizes.length > 0 && (
                <div className={styles.sizeSection}>
                    <div className={styles.sectionHeader}>
                        <h3 className={styles.sectionTitle}>
                            Taille
                            {selectedSize && (
                                <span className={styles.selectedValue}> : {selectedSize}</span>
                            )}
                        </h3>
                        {selectedSize && getCurrentStock !== null && (
                            <span className={`${styles.stockInfo} ${getCurrentStock < 5 ? styles.lowStock : ''}`}>
                                {getCurrentStock < 5 && getCurrentStock > 0 && (
                                    <span className={styles.warningIcon}>⚠️</span>
                                )}
                                {getCurrentStock} en stock
                            </span>
                        )}
                    </div>
                    
                    <div className={styles.sizeGrid}>
                        {availableSizes.map(({ size, stock }) => (
                            <button
                                key={size}
                                type="button"
                                className={`${styles.sizeOption} ${selectedSize === size ? styles.selected : ''} ${stock === 0 ? styles.outOfStock : ''}`}
                                onClick={() => handleSizeSelect(size)}
                                disabled={stock === 0}
                                title={`Taille ${size} - ${stock} disponible(s)`}
                            >
                                <span className={styles.sizeName}>{size}</span>
                                {stock > 0 && stock < 5 && (
                                    <span className={styles.lowStockBadge}>
                                        {stock} restant{stock > 1 ? 's' : ''}
                                    </span>
                                )}
                                {stock === 0 && (
                                    <span className={styles.outOfStockBadge}>Épuisé</span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Message si aucune taille disponible pour la couleur sélectionnée */}
            {selectedColor && availableSizes.length === 0 && (
                <div className={styles.noSizeMessage}>
                    <p>😔 Désolé, aucune taille disponible pour la couleur {selectedColor}</p>
                    <p className={styles.hint}>Veuillez sélectionner une autre couleur</p>
                </div>
            )}

            {/* Instructions */}
            {!selectedColor && colors.length > 0 && (
                <div className={styles.instruction}>
                    <p>👆 Veuillez d'abord sélectionner une couleur</p>
                </div>
            )}
        </div>
    );
}

// ✅ NOUVEAU : Fonction pour obtenir les variantes d'une couleur
function getColorVariants(color: string): string[] {
    const variants: string[] = [color];
    
    // Mapper les couleurs communes avec leurs variantes
    const colorMap: Record<string, string[]> = {
        'noir': ['black', 'noir', 'negro', 'noire'],
        'blanc': ['white', 'blanc', 'blanco', 'blanche'],
        'bleu': ['blue', 'bleu', 'azul'],
        'rouge': ['red', 'rouge', 'rojo'],
        'vert': ['green', 'vert', 'verde'],
        'jaune': ['yellow', 'jaune', 'amarillo'],
        'rose': ['pink', 'rose', 'rosa'],
        'violet': ['purple', 'violet', 'morado', 'violeta'],
        'orange': ['orange', 'naranja'],
        'marron': ['brown', 'marron', 'brun'],
        'gris': ['gray', 'grey', 'gris'],
        'beige': ['beige', 'tan'],
    };
    
    // Trouver les variantes pour cette couleur
    const colorLower = color.toLowerCase();
    for (const [key, values] of Object.entries(colorMap)) {
        if (colorLower.includes(key) || values.some(v => colorLower.includes(v))) {
            variants.push(...values);
        }
    }
    
    return [...new Set(variants)]; // Supprimer les doublons
}