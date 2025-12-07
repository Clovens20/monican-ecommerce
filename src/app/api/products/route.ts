import { NextRequest, NextResponse } from 'next/server';
import { getAllProducts, getProductsByCategory } from '@/lib/products-db';

/**
 * Route pour récupérer tous les produits ou filtrer par catégorie
 * GET /api/products?category=tennis
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    
    let products;
    if (category) {
      products = await getProductsByCategory(category);
    } else {
      products = await getAllProducts();
    }
    
    return NextResponse.json({
      success: true,
      products: products.map(product => ({
        id: product.id,
        name: product.name,
        description: product.description,
        detailedDescription: product.detailedDescription,
        price: product.price,
        category: product.category,
        images: product.images,
        variants: product.variants,
        features: product.features,
        isNew: product.isNew,
        isFeatured: product.isFeatured,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
      }))
    });
    
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des produits' },
      { status: 500 }
    );
  }
}

