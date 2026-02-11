import { NextRequest, NextResponse } from 'next/server';
import { getProductById } from '@/lib/products-db';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * Route pour récupérer un produit par ID
 * GET /api/products/[id]
 * Inclut les colorSizeStocks depuis l'inventaire
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const product = await getProductById(id);
    
    if (!product) {
      return NextResponse.json(
        { error: 'Produit non trouvé' },
        { status: 404 }
      );
    }

    // Récupérer l'inventaire avec les couleurs et tailles depuis Supabase
    const { data: inventoryData, error: inventoryError } = await supabaseAdmin
      .from('inventory')
      .select('color, size, stock_quantity, reserved_quantity, sku')
      .eq('product_id', id);

    if (inventoryError) {
      console.error('Error fetching inventory:', inventoryError);
    }

    // Construire colorSizeStocks depuis l'inventaire
    const colorSizeStocks = (inventoryData || []).map(item => ({
      color: item.color || '',
      size: item.size,
      stock: Math.max(0, (item.stock_quantity || 0) - (item.reserved_quantity || 0)),
      sku: item.sku || ''
    })).filter(entry => entry.color && entry.size); // Filtrer les entrées vides

    // Extraire les couleurs uniques disponibles (avec stock > 0)
    const colorsWithStock = new Map<string, number>();
    colorSizeStocks.forEach(entry => {
      if (entry.color) {
        const currentStock = colorsWithStock.get(entry.color) || 0;
        colorsWithStock.set(entry.color, currentStock + entry.stock);
      }
    });

    const colors = Array.from(colorsWithStock.keys()).filter(color => 
      colorsWithStock.get(color)! > 0
    );

    // Si pas de données d'inventaire, utiliser les données du produit (fallback)
    const finalColorSizeStocks = colorSizeStocks.length > 0 
      ? colorSizeStocks 
      : (product.colorSizeStocks || []);
    
    const finalColors = colors.length > 0 
      ? colors 
      : (product.colors || []);
    
    return NextResponse.json({
      success: true,
      product: {
        id: product.id,
        name: product.name,
        description: product.description,
        detailedDescription: product.detailedDescription,
        price: product.price,
        comparePrice: product.comparePrice || null,
        category: product.category,
        images: product.images,
        variants: product.variants,
        colorSizeStocks: finalColorSizeStocks, // ✅ NOUVEAU: Couleurs et tailles
        colors: finalColors, // ✅ NOUVEAU: Liste des couleurs
        features: product.features,
        isNew: product.isNew,
        isFeatured: product.isFeatured,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
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
