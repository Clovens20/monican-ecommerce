import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyAuth } from '@/lib/auth';

/**
 * Route pour récupérer tous les produits (admin) - inclut les produits inactifs
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request);
    if (authResult.status !== 200 || authResult.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

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
        isActive: product.is_active !== false,
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

/**
 * Route pour créer un nouveau produit (admin)
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request);
    if (authResult.status !== 200 || authResult.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();
    
    // Validation des champs obligatoires
    if (!body.name || !body.description || !body.price || !body.category) {
      return NextResponse.json(
        { error: 'Les champs nom, description, prix et catégorie sont obligatoires' },
        { status: 400 }
      );
    }

    if (body.price <= 0) {
      return NextResponse.json(
        { error: 'Le prix doit être supérieur à 0' },
        { status: 400 }
      );
    }

    if (!body.images || body.images.length === 0) {
      return NextResponse.json(
        { error: 'Au moins une image est requise' },
        { status: 400 }
      );
    }

    // Créer le produit directement avec Supabase pour inclure les nouveaux champs
    const { data: product, error: productError } = await supabaseAdmin
      .from('products')
      .insert({
        name: body.name,
        description: body.description,
        detailed_description: body.detailedDescription || '',
        price: body.price,
        compare_price: body.comparePrice || null,
        sku: body.sku || null,
        category: body.category,
        brand: body.brand || null,
        images: body.images || [],
        variants: body.variants || [], // Garder pour rétrocompatibilité
        color_size_stocks: body.colorSizeStocks || [], // Nouvelle structure
        features: body.features || [],
        colors: body.colors || [],
        is_new: body.isNew || false,
        is_featured: body.isFeatured || false,
        is_active: !body.isDraft, // Si c'est un brouillon, le produit n'est pas actif
        is_draft: body.isDraft || false,
      })
      .select()
      .single();

    if (productError || !product) {
      console.error('Error creating product:', productError);
      return NextResponse.json(
        { error: productError?.message || 'Erreur lors de la création du produit' },
        { status: 500 }
      );
    }

    // Si des colorSizeStocks sont fournis, créer les entrées d'inventaire
    if (body.colorSizeStocks && body.colorSizeStocks.length > 0) {
      const inventoryEntries = body.colorSizeStocks.map((entry: any) => ({
        product_id: product.id,
        color: entry.color,
        size: entry.size,
        sku: entry.sku || `${body.sku || product.id}-${entry.color}-${entry.size}`,
        stock_quantity: entry.stock || 0,
        reserved_quantity: 0,
      }));

      const { error: inventoryError } = await supabaseAdmin
        .from('inventory')
        .insert(inventoryEntries);

      if (inventoryError) {
        console.error('Error creating inventory entries:', inventoryError);
        // Ne pas faire échouer la création du produit si l'inventaire échoue
        // On pourra le corriger plus tard
      }
    } else if (body.variants && body.variants.length > 0) {
      // Fallback pour rétrocompatibilité avec l'ancienne structure
      const inventoryEntries = body.variants.map((variant: any) => ({
        product_id: product.id,
        size: variant.size,
        sku: variant.sku || `${body.sku || product.id}-${variant.size}`,
        stock_quantity: variant.stock || 0,
        reserved_quantity: 0,
      }));

      const { error: inventoryError } = await supabaseAdmin
        .from('inventory')
        .insert(inventoryEntries);

      if (inventoryError) {
        console.error('Error creating inventory entries:', inventoryError);
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
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la création du produit' },
      { status: 500 }
    );
  }
}
