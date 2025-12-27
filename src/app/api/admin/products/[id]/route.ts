import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyAuth } from '@/lib/auth';
import { getProductById } from '@/lib/products-db';

/**
 * Route pour mettre à jour un produit (admin)
 * PUT /api/admin/products/[id]
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await verifyAuth(request);
    if (authResult.status !== 200 || authResult.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    
    // Vérifier que le produit existe
    const existingProduct = await getProductById(id);
    if (!existingProduct) {
      return NextResponse.json(
        { error: 'Produit non trouvé' },
        { status: 404 }
      );
    }

    // Validation des champs obligatoires
    if (body.name !== undefined && (!body.name || body.name.trim().length < 3)) {
      return NextResponse.json(
        { error: 'Le nom doit contenir au moins 3 caractères' },
        { status: 400 }
      );
    }

    if (body.price !== undefined && body.price <= 0) {
      return NextResponse.json(
        { error: 'Le prix doit être supérieur à 0' },
        { status: 400 }
      );
    }

    // Préparer les données de mise à jour
    const updateData: any = {};
    
    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.detailedDescription !== undefined) updateData.detailed_description = body.detailedDescription;
    if (body.price !== undefined) updateData.price = body.price;
    if (body.comparePrice !== undefined) updateData.compare_price = body.comparePrice;
    if (body.sku !== undefined) updateData.sku = body.sku;
    if (body.category !== undefined) updateData.category = body.category;
    if (body.brand !== undefined) updateData.brand = body.brand;
    if (body.model !== undefined) updateData.model = body.model;
    if (body.images !== undefined) updateData.images = body.images;
    if (body.variants !== undefined) updateData.variants = body.variants; // Rétrocompatibilité
    if (body.colorSizeStocks !== undefined) updateData.color_size_stocks = body.colorSizeStocks; // Nouvelle structure
    if (body.features !== undefined) updateData.features = body.features;
    if (body.colors !== undefined) updateData.colors = body.colors;
    if (body.isNew !== undefined) updateData.is_new = body.isNew;
    if (body.isFeatured !== undefined) updateData.is_featured = body.isFeatured;
    if (body.isActive !== undefined) updateData.is_active = body.isActive;
    if (body.isDraft !== undefined) updateData.is_draft = body.isDraft;

    // Mettre à jour le produit
    const { data: product, error: productError } = await supabaseAdmin
      .from('products')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (productError || !product) {
      console.error('Error updating product:', productError);
      return NextResponse.json(
        { error: productError?.message || 'Erreur lors de la mise à jour du produit' },
        { status: 500 }
      );
    }

    // Mettre à jour l'inventaire si des colorSizeStocks sont fournis
    if (body.colorSizeStocks && body.colorSizeStocks.length > 0) {
      // Supprimer les anciennes entrées d'inventaire pour ce produit
      await supabaseAdmin
        .from('inventory')
        .delete()
        .eq('product_id', id);

      // Créer les nouvelles entrées d'inventaire
      const inventoryEntries = body.colorSizeStocks.map((entry: any) => ({
        product_id: id,
        color: entry.color,
        size: entry.size,
        sku: entry.sku || `${body.sku || id}-${entry.color}-${entry.size}`,
        stock_quantity: entry.stock || 0,
        reserved_quantity: 0,
      }));

      const { error: inventoryError } = await supabaseAdmin
        .from('inventory')
        .insert(inventoryEntries);

      if (inventoryError) {
        console.error('Error updating inventory entries:', inventoryError);
        // Ne pas faire échouer la mise à jour du produit si l'inventaire échoue
      }
    } else if (body.variants && body.variants.length > 0) {
      // Fallback pour rétrocompatibilité avec l'ancienne structure
      await supabaseAdmin
        .from('inventory')
        .delete()
        .eq('product_id', id);

      const inventoryEntries = body.variants.map((variant: any) => ({
        product_id: id,
        size: variant.size,
        sku: variant.sku || `${body.sku || id}-${variant.size}`,
        stock_quantity: variant.stock || 0,
        reserved_quantity: 0,
      }));

      const { error: inventoryError } = await supabaseAdmin
        .from('inventory')
        .insert(inventoryEntries);

      if (inventoryError) {
        console.error('Error updating inventory entries:', inventoryError);
      }
    }

    return NextResponse.json({
      success: true,
      product: {
        id: product.id,
        name: product.name,
        category: product.category,
        price: product.price,
      },
    });

  } catch (error: any) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la mise à jour du produit' },
      { status: 500 }
    );
  }
}

/**
 * Route pour récupérer un produit par ID (admin)
 * GET /api/admin/products/[id]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await verifyAuth(request);
    if (authResult.status !== 200 || authResult.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { id } = await params;
    
    // Récupérer directement depuis Supabase pour avoir tous les champs
    const { data: product, error } = await supabaseAdmin
      .from('products')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !product) {
      return NextResponse.json(
        { error: 'Produit non trouvé' },
        { status: 404 }
      );
    }

    // Récupérer l'inventaire pour ce produit pour construire colorSizeStocks
    const { data: inventoryData, error: inventoryError } = await supabaseAdmin
      .from('inventory')
      .select('color, size, stock_quantity, reserved_quantity, sku')
      .eq('product_id', id);

    // Construire colorSizeStocks depuis l'inventaire
    let colorSizeStocks: any[] = [];
    if (!inventoryError && inventoryData && inventoryData.length > 0) {
      // Grouper par couleur et taille
      const stockMap = new Map<string, any>();
      
      inventoryData.forEach((item: any) => {
        const key = `${item.color || 'default'}-${item.size}`;
        const availableStock = (item.stock_quantity || 0) - (item.reserved_quantity || 0);
        
        stockMap.set(key, {
          color: item.color || 'default',
          size: item.size,
          stock: Math.max(0, availableStock),
          sku: item.sku || `${product.sku || id}-${item.color || 'default'}-${item.size}`.toUpperCase()
        });
      });

      colorSizeStocks = Array.from(stockMap.values());
    } else if (Array.isArray(product.color_size_stocks) && product.color_size_stocks.length > 0) {
      // Fallback: utiliser color_size_stocks de la table products si l'inventaire est vide
      colorSizeStocks = product.color_size_stocks;
    }

    // Extraire les couleurs uniques depuis colorSizeStocks
    const uniqueColors = Array.from(new Set(colorSizeStocks.map(item => item.color).filter(Boolean)));
    
    return NextResponse.json({
      success: true,
      product: {
        id: product.id,
        name: product.name,
        description: product.description || '',
        detailedDescription: product.detailed_description || '',
        price: parseFloat(product.price.toString()),
        comparePrice: product.compare_price ? parseFloat(product.compare_price.toString()) : null,
        sku: product.sku || '',
        category: product.category,
        brand: product.brand || '',
        model: product.model || '',
        images: Array.isArray(product.images) ? product.images : [],
        variants: Array.isArray(product.variants) ? product.variants : [],
        colorSizeStocks: colorSizeStocks,
        features: Array.isArray(product.features) ? product.features : [],
        colors: uniqueColors.length > 0 ? uniqueColors : (Array.isArray(product.colors) ? product.colors : []),
        isNew: product.is_new || false,
        isFeatured: product.is_featured || false,
        isActive: product.is_active !== false,
        createdAt: product.created_at,
        updatedAt: product.updated_at,
      }
    });
    
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération du produit' },
      { status: 500 }
    );
  }
}

/**
 * Route pour supprimer un produit (admin)
 * DELETE /api/admin/products/[id]
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await verifyAuth(request);
    if (authResult.status !== 200 || authResult.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { id } = await params;
    
    // Vérifier que le produit existe
    const existingProduct = await getProductById(id);
    if (!existingProduct) {
      return NextResponse.json(
        { error: 'Produit non trouvé' },
        { status: 404 }
      );
    }

    // Supprimer le produit (soft delete - met is_active à false)
    const { error: deleteError } = await supabaseAdmin
      .from('products')
      .update({ is_active: false })
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting product:', deleteError);
      return NextResponse.json(
        { error: deleteError.message || 'Erreur lors de la suppression du produit' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Produit supprimé avec succès',
    });

  } catch (error: any) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la suppression du produit' },
      { status: 500 }
    );
  }
}

