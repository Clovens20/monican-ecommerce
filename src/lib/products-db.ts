// ============================================================================
// PRODUCTS DATABASE FUNCTIONS - Supabase Integration
// ============================================================================
// Ce fichier contient les fonctions pour interagir avec Supabase
// Remplace progressivement les données mockées

import { supabase, supabaseAdmin } from './supabase';
import { Product, ProductCategory } from './types';

// ============================================================================
// TYPE CONVERSION HELPERS
// ============================================================================

interface SupabaseProduct {
    id: string;
    name: string;
    description: string | null;
    detailed_description: string | null;
    price: number;
    category: string;
    brand: string | null;
    images: any; // JSONB
    variants: any; // JSONB
    features: any; // JSONB
    colors: any; // JSONB
    is_new: boolean;
    is_featured: boolean;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

function convertSupabaseToProduct(supabaseProduct: SupabaseProduct): Product {
    return {
        id: supabaseProduct.id,
        name: supabaseProduct.name,
        description: supabaseProduct.description || '',
        detailedDescription: supabaseProduct.detailed_description || '',
        price: parseFloat(supabaseProduct.price.toString()),
        category: supabaseProduct.category as ProductCategory,
        images: Array.isArray(supabaseProduct.images) ? supabaseProduct.images : [],
        variants: Array.isArray(supabaseProduct.variants) ? supabaseProduct.variants : [],
        features: Array.isArray(supabaseProduct.features) ? supabaseProduct.features : [],
        isNew: supabaseProduct.is_new,
        isFeatured: supabaseProduct.is_featured,
        createdAt: supabaseProduct.created_at,
        updatedAt: supabaseProduct.updated_at,
    };
}

// ============================================================================
// PUBLIC FUNCTIONS (Client-side)
// ============================================================================

/**
 * Récupère tous les produits actifs
 * ⚠️ ATTENTION: Cette fonction charge TOUS les produits en mémoire
 * Pour de meilleures performances, utilisez getAllProductsPaginated() avec pagination
 */
export async function getAllProducts(): Promise<Product[]> {
    try {
        // Utiliser une requête paginée avec une limite élevée (500)
        // Pour éviter de charger des milliers de produits en mémoire
        let allProducts: Product[] = [];
        let page = 0;
        const pageSize = 500;
        let hasMore = true;

        while (hasMore) {
            const { data, error } = await supabase
                .from('products')
                .select('id, name, description, detailed_description, price, category, brand, images, variants, features, colors, is_new, is_featured, is_active, created_at, updated_at')
                .eq('is_active', true)
                .order('created_at', { ascending: false })
                .range(page * pageSize, (page + 1) * pageSize - 1);

            if (error) {
                console.error('Error fetching products:', error);
                break;
            }

            if (!data || data.length === 0) {
                hasMore = false;
                break;
            }

            allProducts = allProducts.concat(data.map((product: any) => convertSupabaseToProduct(product)));
            
            // Si on a récupéré moins que pageSize, on a atteint la fin
            if (data.length < pageSize) {
                hasMore = false;
            } else {
                page++;
            }
        }

        return allProducts;
    } catch (error) {
        console.error('Error in getAllProducts:', error);
        return [];
    }
}

/**
 * Récupère les produits avec pagination (RECOMMANDÉ)
 * @param page - Numéro de page (0-indexed)
 * @param pageSize - Nombre d'éléments par page (défaut: 50)
 * @param isActiveOnly - Filtrer uniquement les produits actifs (défaut: true)
 * @returns Object avec products, totalCount, hasMore
 */
export async function getAllProductsPaginated(
    page: number = 0,
    pageSize: number = 50,
    isActiveOnly: boolean = true
): Promise<{ products: Product[]; totalCount: number; hasMore: boolean }> {
    try {
        // Compter le total d'abord (optimisé)
        let countQuery = supabase
            .from('products')
            .select('*', { count: 'exact', head: true });
        
        if (isActiveOnly) {
            countQuery = countQuery.eq('is_active', true);
        }

        const { count, error: countError } = await countQuery;

        if (countError) {
            console.error('Error counting products:', countError);
            return { products: [], totalCount: 0, hasMore: false };
        }

        const totalCount = count || 0;
        const offset = page * pageSize;

        // Récupérer les produits paginés (colonnes spécifiques pour optimiser)
        let query = supabase
            .from('products')
            .select('id, name, description, detailed_description, price, category, brand, images, variants, features, colors, is_new, is_featured, is_active, created_at, updated_at')
            .order('created_at', { ascending: false })
            .range(offset, offset + pageSize - 1);
        
        if (isActiveOnly) {
            query = query.eq('is_active', true);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching paginated products:', error);
            return { products: [], totalCount: 0, hasMore: false };
        }

        const products = (data || []).map(convertSupabaseToProduct);
        const hasMore = offset + products.length < totalCount;

        return {
            products,
            totalCount,
            hasMore,
        };
    } catch (error) {
        console.error('Error in getAllProductsPaginated:', error);
        return { products: [], totalCount: 0, hasMore: false };
    }
}

/**
 * Récupère un produit par son ID
 */
export async function getProductById(id: string): Promise<Product | null> {
    try {
        // Utiliser supabaseAdmin pour bypasser RLS (cette fonction est appelée côté serveur)
        const { data, error } = await supabaseAdmin
            .from('products')
            .select('*')
            .eq('id', id)
            .eq('is_active', true)
            .single();

        if (error) {
            console.error('Error fetching product:', error);
            return null;
        }

        if (!data) {
            return null;
        }

        return convertSupabaseToProduct(data);
    } catch (error) {
        console.error('Error in getProductById:', error);
        return null;
    }
}

/**
 * Récupère les produits par catégorie
 * Utilise supabaseAdmin pour bypasser RLS côté serveur
 */
export async function getProductsByCategory(category: string): Promise<Product[]> {
    try {
        // Utiliser supabaseAdmin pour bypasser RLS (cette fonction est appelée côté serveur)
        const { data, error } = await supabaseAdmin
            .from('products')
            .select('*')
            .eq('category', category)
            .eq('is_active', true)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching products by category:', error);
            return [];
        }

        if (!data || data.length === 0) {
            return [];
        }

        return data.map(convertSupabaseToProduct);
    } catch (error) {
        console.error('Error in getProductsByCategory:', error);
        return [];
    }
}

/**
 * Fallback: Récupère les produits featured depuis les données mockées
 */
function getMockFeaturedProducts(): Product[] {
    try {
        // Importer dynamiquement pour éviter les dépendances circulaires
        const productsModule = require('./products');
        const mockProducts = productsModule.mockProducts || [];
        return mockProducts.filter((p: Product) => p.isFeatured).slice(0, 10);
    } catch (error) {
        console.error('Error loading mock products:', error);
        // Si même l'import échoue, retourner un tableau vide
        return [];
    }
}

/**
 * Récupère les produits mis en avant depuis Supabase
 * Utilise supabaseAdmin pour bypasser RLS côté serveur
 */
export async function getFeaturedProducts(): Promise<Product[]> {
    try {
        // Utiliser supabaseAdmin pour bypasser RLS (cette fonction est appelée côté serveur)
        const { data, error } = await supabaseAdmin
            .from('products')
            .select('*')
            .eq('is_featured', true)
            .eq('is_active', true)
            .order('created_at', { ascending: false })
            .limit(10);

        if (error) {
            console.error('Error fetching featured products:', error);
            // Fallback: récupérer les premiers produits actifs
            return await getFallbackProducts(10);
        }

        // Si aucun produit featured, récupérer les premiers produits actifs
        if (!data || data.length === 0) {
            return await getFallbackProducts(10);
        }

        return data.map(convertSupabaseToProduct);
    } catch (error) {
        console.error('Error in getFeaturedProducts:', error);
        // Fallback final
        return await getFallbackProducts(10);
    }
}

/**
 * Fonction helper pour récupérer des produits actifs en fallback
 */
async function getFallbackProducts(limit: number): Promise<Product[]> {
    try {
        const { data, error } = await supabaseAdmin
            .from('products')
            .select('*')
            .eq('is_active', true)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error || !data || data.length === 0) {
            console.error('Error fetching fallback products:', error);
            return [];
        }

        return data.map(convertSupabaseToProduct);
    } catch (error) {
        console.error('Error in getFallbackProducts:', error);
        return [];
    }
}

/**
 * Récupère les nouveaux produits
 * Utilise supabaseAdmin pour bypasser RLS côté serveur
 */
export async function getNewProducts(): Promise<Product[]> {
    try {
        // Utiliser supabaseAdmin pour bypasser RLS (cette fonction est appelée côté serveur)
        const { data, error } = await supabaseAdmin
            .from('products')
            .select('*')
            .eq('is_new', true)
            .eq('is_active', true)
            .order('created_at', { ascending: false })
            .limit(10);

        if (error) {
            console.error('Error fetching new products:', error);
            return [];
        }

        if (!data || data.length === 0) {
            return [];
        }

        return data.map(convertSupabaseToProduct);
    } catch (error) {
        console.error('Error in getNewProducts:', error);
        return [];
    }
}

/**
 * Récupère les statistiques de ventes pour tous les produits
 * Retourne les produits avec leur quantité vendue
 */
async function getProductSalesStats(): Promise<Record<string, number>> {
    try {
        const { data: salesData, error: salesError } = await supabaseAdmin
            .from('order_items')
            .select('product_id, quantity')
            .not('product_id', 'is', null);

        if (salesError || !salesData) {
            return {};
        }

        // Compter les quantités vendues par produit
        const productSales: Record<string, number> = {};
        
        salesData.forEach((item: any) => {
            const productId = item.product_id;
            const quantity = item.quantity || 0;
            productSales[productId] = (productSales[productId] || 0) + quantity;
        });

        return productSales;
    } catch (error) {
        console.error('Error fetching sales stats:', error);
        return {};
    }
}

/**
 * Récupère les meilleures ventes (produits les plus commandés)
 * Basé sur le nombre de commandes dans order_items
 * Utilise supabaseAdmin pour bypasser RLS côté serveur
 */
export async function getBestSellingProducts(limit: number = 4): Promise<Product[]> {
    try {
        const productSales = await getProductSalesStats();

        // Si aucun produit n'a été vendu, retourner les produits featured
        if (Object.keys(productSales).length === 0) {
            const featured = await getFeaturedProducts();
            // Si même les featured sont vides, utiliser le fallback
            if (featured.length === 0) {
                return await getFallbackProducts(limit);
            }
            return featured.slice(0, limit);
        }

        // Trier les produits par nombre de ventes (décroissant)
        const sortedProductIds = Object.entries(productSales)
            .sort(([, a], [, b]) => b - a)
            .slice(0, limit)
            .map(([productId]) => productId);

        // Récupérer les détails des produits avec supabaseAdmin pour bypasser RLS
        const { data: productsData, error: productsError } = await supabaseAdmin
            .from('products')
            .select('*')
            .in('id', sortedProductIds)
            .eq('is_active', true);

        if (productsError || !productsData || productsData.length === 0) {
            console.error('Error fetching best selling products:', productsError);
            const featured = await getFeaturedProducts();
            if (featured.length === 0) {
                return await getFallbackProducts(limit);
            }
            return featured.slice(0, limit);
        }

        // Convertir et trier selon l'ordre des ventes
        const products = productsData.map(convertSupabaseToProduct);
        
        // Maintenir l'ordre basé sur les ventes
        const sortedProducts = sortedProductIds
            .map(id => products.find(p => p.id === id))
            .filter((p): p is Product => p !== undefined);

        return sortedProducts;
    } catch (error) {
        console.error('Error in getBestSellingProducts:', error);
        // Fallback: retourner les produits featured en cas d'erreur
        try {
            const featured = await getFeaturedProducts();
            if (featured.length === 0) {
                return await getFallbackProducts(limit);
            }
            return featured.slice(0, limit);
        } catch (fallbackError) {
            console.error('Fallback error in getBestSellingProducts:', fallbackError);
            return await getFallbackProducts(limit);
        }
    }
}

/**
 * Récupère les produits vedettes (positions 1 à 5 des meilleures ventes)
 * Retourne les produits avec leur quantité vendue
 */
export async function getFeaturedProductsWithSales(limit: number = 5): Promise<Array<Product & { salesCount: number }>> {
    try {
        const productSales = await getProductSalesStats();

        // Si aucun produit n'a été vendu, retourner les produits featured sans quantité
        if (Object.keys(productSales).length === 0) {
            const featured = await getFeaturedProducts();
            if (featured.length === 0) {
                // Fallback: récupérer les premiers produits actifs
                const fallback = await getFallbackProducts(limit);
                return fallback.map(p => ({ ...p, salesCount: 0 }));
            }
            return featured.slice(0, limit).map(p => ({ ...p, salesCount: 0 }));
        }

        // Trier les produits par nombre de ventes (décroissant)
        // Prendre les positions 1 à 5 (top 5)
        const sortedProductIds = Object.entries(productSales)
            .sort(([, a], [, b]) => b - a)
            .slice(0, limit) // Prendre les 5 premiers
            .map(([productId, salesCount]) => ({ productId, salesCount }));

        // Si on n'a pas assez de produits (moins de 5), prendre les produits featured
        if (sortedProductIds.length === 0) {
            const featured = await getFeaturedProducts();
            if (featured.length === 0) {
                const fallback = await getFallbackProducts(limit);
                return fallback.map(p => ({ ...p, salesCount: 0 }));
            }
            return featured.slice(0, limit).map(p => ({ ...p, salesCount: 0 }));
        }

        // Récupérer les détails des produits avec supabaseAdmin pour bypasser RLS
        const productIds = sortedProductIds.map(item => item.productId);
        const { data: productsData, error: productsError } = await supabaseAdmin
            .from('products')
            .select('*')
            .in('id', productIds)
            .eq('is_active', true);

        if (productsError || !productsData || productsData.length === 0) {
            console.error('Error fetching featured products:', productsError);
            const featured = await getFeaturedProducts();
            if (featured.length === 0) {
                const fallback = await getFallbackProducts(limit);
                return fallback.map(p => ({ ...p, salesCount: 0 }));
            }
            return featured.slice(0, limit).map(p => ({ ...p, salesCount: 0 }));
        }

        // Convertir et ajouter les quantités vendues
        const products = productsData.map(convertSupabaseToProduct);
        
        // Créer un map pour les quantités vendues
        const salesMap = new Map(sortedProductIds.map(item => [item.productId, item.salesCount]));
        
        // Maintenir l'ordre basé sur les ventes et ajouter les quantités
        const sortedProducts = productIds
            .map(id => {
                const product = products.find(p => p.id === id);
                if (!product) return null;
                return {
                    ...product,
                    salesCount: salesMap.get(id) || 0
                };
            })
            .filter((p): p is Product & { salesCount: number } => p !== null);

        return sortedProducts;
    } catch (error) {
        console.error('Error in getFeaturedProductsWithSales:', error);
        // Fallback: retourner les produits featured sans quantité
        try {
            const featured = await getFeaturedProducts();
            if (featured.length === 0) {
                const fallback = await getFallbackProducts(limit);
                return fallback.map(p => ({ ...p, salesCount: 0 }));
            }
            return featured.slice(0, limit).map(p => ({ ...p, salesCount: 0 }));
        } catch (fallbackError) {
            console.error('Fallback error in getFeaturedProductsWithSales:', fallbackError);
            const fallback = await getFallbackProducts(limit);
            return fallback.map(p => ({ ...p, salesCount: 0 }));
        }
    }
}

/**
 * Recherche de produits
 */
export async function searchProducts(query: string): Promise<Product[]> {
    try {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('is_active', true)
            .or(`name.ilike.%${query}%,description.ilike.%${query}%,brand.ilike.%${query}%`)
            .order('created_at', { ascending: false })
            .limit(20);

        if (error) {
            console.error('Error searching products:', error);
            return [];
        }

        return data.map(convertSupabaseToProduct);
    } catch (error) {
        console.error('Error in searchProducts:', error);
        return [];
    }
}

/**
 * Vérifie la disponibilité d'un produit (stock)
 */
export async function checkProductAvailability(
    productId: string,
    size: string,
    quantity: number
): Promise<boolean> {
    try {
        const { data, error } = await supabase
            .from('inventory')
            .select('stock_quantity, reserved_quantity')
            .eq('product_id', productId)
            .eq('size', size)
            .single();

        if (error || !data) {
            return false;
        }

        const available = data.stock_quantity - (data.reserved_quantity || 0);
        return available >= quantity;
    } catch (error) {
        console.error('Error checking product availability:', error);
        return false;
    }
}

// ============================================================================
// ADMIN FUNCTIONS (Server-side only)
// ============================================================================

/**
 * Crée un nouveau produit (Admin uniquement)
 */
export async function createProduct(productData: {
    name: string;
    description?: string;
    detailedDescription?: string;
    price: number;
    category: ProductCategory;
    brand?: string;
    images?: any[];
    variants?: any[];
    features?: any[];
    colors?: string[];
    isNew?: boolean;
    isFeatured?: boolean;
}): Promise<Product | null> {
    try {
        const { data, error } = await supabaseAdmin
            .from('products')
            .insert({
                name: productData.name,
                description: productData.description || null,
                detailed_description: productData.detailedDescription || null,
                price: productData.price,
                category: productData.category,
                brand: productData.brand || null,
                images: productData.images || [],
                variants: productData.variants || [],
                features: productData.features || [],
                colors: productData.colors || [],
                is_new: productData.isNew || false,
                is_featured: productData.isFeatured || false,
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating product:', error);
            return null;
        }

        return convertSupabaseToProduct(data);
    } catch (error) {
        console.error('Error in createProduct:', error);
        return null;
    }
}

/**
 * Met à jour un produit (Admin uniquement)
 */
export async function updateProduct(
    id: string,
    updates: Partial<{
        name: string;
        description: string;
        detailedDescription: string;
        price: number;
        category: ProductCategory;
        brand: string;
        images: any[];
        variants: any[];
        features: any[];
        colors: string[];
        isNew: boolean;
        isFeatured: boolean;
        isActive: boolean;
    }>
): Promise<Product | null> {
    try {
        const updateData: any = {};
        
        if (updates.name !== undefined) updateData.name = updates.name;
        if (updates.description !== undefined) updateData.description = updates.description;
        if (updates.detailedDescription !== undefined) updateData.detailed_description = updates.detailedDescription;
        if (updates.price !== undefined) updateData.price = updates.price;
        if (updates.category !== undefined) updateData.category = updates.category;
        if (updates.brand !== undefined) updateData.brand = updates.brand;
        if (updates.images !== undefined) updateData.images = updates.images;
        if (updates.variants !== undefined) updateData.variants = updates.variants;
        if (updates.features !== undefined) updateData.features = updates.features;
        if (updates.colors !== undefined) updateData.colors = updates.colors;
        if (updates.isNew !== undefined) updateData.is_new = updates.isNew;
        if (updates.isFeatured !== undefined) updateData.is_featured = updates.isFeatured;
        if (updates.isActive !== undefined) updateData.is_active = updates.isActive;

        const { data, error } = await supabaseAdmin
            .from('products')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating product:', error);
            return null;
        }

        return convertSupabaseToProduct(data);
    } catch (error) {
        console.error('Error in updateProduct:', error);
        return null;
    }
}

/**
 * Supprime un produit (soft delete - Admin uniquement)
 */
export async function deleteProduct(id: string): Promise<boolean> {
    try {
        const { error } = await supabaseAdmin
            .from('products')
            .update({ is_active: false })
            .eq('id', id);

        if (error) {
            console.error('Error deleting product:', error);
            return false;
        }

        return true;
    } catch (error) {
        console.error('Error in deleteProduct:', error);
        return false;
    }
}
