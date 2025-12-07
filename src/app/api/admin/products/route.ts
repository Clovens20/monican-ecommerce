import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * Route pour récupérer tous les produits (admin) - inclut les produits inactifs
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    
    let query = supabaseAdmin
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (category) {
      query = query.eq('category', category);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching products:', error);
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des produits' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      products: (data || []).map(product => ({
        id: product.id,
        name: product.name,
        description: product.description || '',
        price: parseFloat(product.price.toString()),
        category: product.category,
        images: Array.isArray(product.images) ? product.images : [],
        variants: Array.isArray(product.variants) ? product.variants : [],
        isNew: product.is_new || false,
        isFeatured: product.is_featured || false,
        isActive: product.is_active !== false, // Inclut les produits inactifs pour l'admin
        createdAt: product.created_at,
        updatedAt: product.updated_at
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
