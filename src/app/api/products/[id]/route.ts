import { NextRequest, NextResponse } from 'next/server';
import { getProductById } from '@/lib/products-db';

/**
 * Route pour récupérer un produit par ID
 * GET /api/products/[id]
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
    
    return NextResponse.json({
      success: true,
      product: {
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

