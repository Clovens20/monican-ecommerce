/**
 * Filtre les variants selon la catégorie du produit
 * Pour "tennis", ne garde que les tailles numériques (pas XS, S, M, L, XL)
 */
export function filterVariantsByCategory(
    variants: Array<{ size: string; stock: number; sku: string }>,
    category: string
): Array<{ size: string; stock: number; sku: string }> {
    if (category.toLowerCase() === 'tennis') {
        // Pour tennis, ne garder que les tailles numériques
        // Uniquement les tailles qui sont des nombres (ex: 40, 41, 42, etc.)
        return variants.filter(variant => {
            const size = variant.size.trim();
            // Vérifier si la taille est un nombre (peut contenir des décimales comme 40.5)
            return /^\d+(\.\d+)?$/.test(size);
        });
    }
    
    // Pour les autres catégories, retourner toutes les tailles
    return variants;
}

/**
 * Vérifie si une taille est numérique
 */
export function isNumericSize(size: string): boolean {
    return /^\d+(\.\d+)?$/.test(size.trim());
}
