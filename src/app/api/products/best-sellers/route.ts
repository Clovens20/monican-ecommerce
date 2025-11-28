import { NextResponse } from 'next/server';
import { getBestSellingProducts } from '@/lib/products-db';

/**
 * API Route pour récupérer les meilleures ventes
 * Peut être utilisée côté serveur ou client
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '4', 10);

    const bestSellers = await getBestSellingProducts(limit);

    return NextResponse.json({
      success: true,
      products: bestSellers,
      count: bestSellers.length,
    });
  } catch (error) {
    console.error('Error fetching best sellers:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Erreur lors de la récupération des meilleures ventes',
        products: [] 
      },
      { status: 500 }
    );
  }
}

