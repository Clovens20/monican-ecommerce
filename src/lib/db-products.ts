// ============================================================================
// PRODUCTS DATABASE FUNCTIONS
// ============================================================================
// Fonctions pour interagir avec les produits dans Supabase
// ============================================================================

import { supabase, supabaseAdmin } from './supabase';
import { Product, ProductCategory, ProductImage, ProductVariant, ProductFeature } from './types';

/**
 * Récupérer tous les produits actifs
 */
export async function getProducts(filters?: {
  category?: ProductCategory;
  featured?: boolean;
  isNew?: boolean;
  limit?: number;
}): Promise<Product[]> {
  try {
    let query = supabase
      .from('products')
      .select(`
        *,
        product_images (*),
        product_variants (*),
        product_features (*),
        product_colors (*)
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (filters?.category) {
      query = query.eq('category', filters.category);
    }

    if (filters?.featured !== undefined) {
      query = query.eq('is_featured', filters.featured);
    }

    if (filters?.isNew !== undefined) {
      query = query.eq('is_new', filters.isNew);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;

    if (error) throw error;
    if (!data) return [];

    // Transformer les données de Supabase en format Product
    return data.map(transformProductFromDB);
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
}

/**
 * Récupérer un produit par ID
 */
export async function getProductById(id: string): Promise<Product | null> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        product_images (*),
        product_variants (*),
        product_features (*),
        product_colors (*)
      `)
      .eq('id', id)
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }

    if (!data) return null;

    return transformProductFromDB(data);
  } catch (error) {
    console.error('Error fetching product:', error);
    throw error;
  }
}

/**
 * Créer un nouveau produit (admin seulement)
 */
export async function createProduct(productData: {
  name: string;
  description: string;
  detailedDescription: string;
  price: number;
  category: ProductCategory;
  brand?: string;
  isNew?: boolean;
  isFeatured?: boolean;
  images: Omit<ProductImage, 'id'>[];
  variants: Omit<ProductVariant, 'id'>[];
  features: Omit<ProductFeature, 'id'>[];
  colors?: string[];
}): Promise<Product> {
  try {
    // Créer le produit principal
    const { data: product, error: productError } = await supabaseAdmin
      .from('products')
      .insert({
        name: productData.name,
        description: productData.description,
        detailed_description: productData.detailedDescription,
        price: productData.price,
        category: productData.category,
        brand: productData.brand || null,
        is_new: productData.isNew || false,
        is_featured: productData.isFeatured || false,
      })
      .select()
      .single();

    if (productError) throw productError;
    if (!product) throw new Error('Failed to create product');

    const productId = product.id;

    // Créer les images
    if (productData.images.length > 0) {
      const imagesToInsert = productData.images.map((img, index) => ({
        product_id: productId,
        url: img.url,
        alt: img.alt || '',
        is_primary: img.isPrimary || false,
        display_order: index,
      }));

      const { error: imagesError } = await supabaseAdmin
        .from('product_images')
        .insert(imagesToInsert);

      if (imagesError) throw imagesError;
    }

    // Créer les variants
    if (productData.variants.length > 0) {
      const variantsToInsert = productData.variants.map(variant => ({
        product_id: productId,
        size: variant.size,
        stock: variant.stock,
        sku: variant.sku,
      }));

      const { error: variantsError } = await supabaseAdmin
        .from('product_variants')
        .insert(variantsToInsert);

      if (variantsError) throw variantsError;
    }

    // Créer les features
    if (productData.features.length > 0) {
      const featuresToInsert = productData.features.map((feature, index) => ({
        product_id: productId,
        name: feature.name,
        value: feature.value,
        display_order: index,
      }));

      const { error: featuresError } = await supabaseAdmin
        .from('product_features')
        .insert(featuresToInsert);

      if (featuresError) throw featuresError;
    }

    // Créer les couleurs
    if (productData.colors && productData.colors.length > 0) {
      const colorsToInsert = productData.colors.map(color => ({
        product_id: productId,
        color,
      }));

      const { error: colorsError } = await supabaseAdmin
        .from('product_colors')
        .insert(colorsToInsert);

      if (colorsError) throw colorsError;
    }

    // Récupérer le produit complet
    const fullProduct = await getProductById(productId);
    if (!fullProduct) throw new Error('Failed to retrieve created product');

    return fullProduct;
  } catch (error) {
    console.error('Error creating product:', error);
    throw error;
  }
}

/**
 * Mettre à jour un produit (admin seulement)
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
    isNew: boolean;
    isFeatured: boolean;
    isActive: boolean;
  }>
): Promise<Product> {
  try {
    const updateData: any = {};

    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.detailedDescription !== undefined) updateData.detailed_description = updates.detailedDescription;
    if (updates.price !== undefined) updateData.price = updates.price;
    if (updates.category !== undefined) updateData.category = updates.category;
    if (updates.brand !== undefined) updateData.brand = updates.brand;
    if (updates.isNew !== undefined) updateData.is_new = updates.isNew;
    if (updates.isFeatured !== undefined) updateData.is_featured = updates.isFeatured;
    if (updates.isActive !== undefined) updateData.is_active = updates.isActive;

    const { error } = await supabaseAdmin
      .from('products')
      .update(updateData)
      .eq('id', id);

    if (error) throw error;

    const updatedProduct = await getProductById(id);
    if (!updatedProduct) throw new Error('Product not found after update');

    return updatedProduct;
  } catch (error) {
    console.error('Error updating product:', error);
    throw error;
  }
}

/**
 * Vérifier la disponibilité du stock pour un variant
 */
export async function checkStock(productId: string, size: string, quantity: number): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('product_variants')
      .select('stock')
      .eq('product_id', productId)
      .eq('size', size)
      .single();

    if (error || !data) return false;

    return data.stock >= quantity;
  } catch (error) {
    console.error('Error checking stock:', error);
    return false;
  }
}

/**
 * Réduire le stock après une commande
 */
export async function reduceStock(productId: string, size: string, quantity: number): Promise<void> {
  try {
    const { error } = await supabaseAdmin.rpc('decrement_stock', {
      p_product_id: productId,
      p_size: size,
      p_quantity: quantity,
    });

    // Si la fonction RPC n'existe pas, utiliser une requête directe
    if (error && error.message.includes('function') && error.message.includes('does not exist')) {
      const { data: variant, error: fetchError } = await supabaseAdmin
        .from('product_variants')
        .select('stock')
        .eq('product_id', productId)
        .eq('size', size)
        .single();

      if (fetchError || !variant) throw new Error('Variant not found');

      const newStock = Math.max(0, variant.stock - quantity);

      const { error: updateError } = await supabaseAdmin
        .from('product_variants')
        .update({ stock: newStock })
        .eq('product_id', productId)
        .eq('size', size);

      if (updateError) throw updateError;
    } else if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Error reducing stock:', error);
    throw error;
  }
}

/**
 * Transformer les données de la DB en format Product
 */
function transformProductFromDB(dbProduct: any): Product {
  return {
    id: dbProduct.id,
    name: dbProduct.name,
    price: parseFloat(dbProduct.price),
    category: dbProduct.category,
    description: dbProduct.description || '',
    detailedDescription: dbProduct.detailed_description || '',
    images: (dbProduct.product_images || []).map((img: any) => ({
      id: img.id,
      url: img.url,
      alt: img.alt || '',
      isPrimary: img.is_primary || false,
    })),
    variants: (dbProduct.product_variants || []).map((v: any) => ({
      id: v.id,
      size: v.size,
      stock: v.stock,
      sku: v.sku,
    })),
    features: (dbProduct.product_features || []).map((f: any) => ({
      id: f.id,
      name: f.name,
      value: f.value,
    })),
    isNew: dbProduct.is_new || false,
    isFeatured: dbProduct.is_featured || false,
    createdAt: dbProduct.created_at,
    updatedAt: dbProduct.updated_at,
  };
}

