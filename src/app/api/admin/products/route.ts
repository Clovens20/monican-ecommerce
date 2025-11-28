import { NextRequest, NextResponse } from 'next/server';
import { createProduct } from '@/lib/db-products';

/**
 * POST /api/admin/products
 * Créer un nouveau produit
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      description,
      detailedDescription,
      price,
      category,
      brand,
      images,
      variants,
      features,
      colors,
      isNew,
      isFeatured,
    } = body;

    // Validation
    if (!name || !description || !price || !category) {
      return NextResponse.json(
        { success: false, error: 'Champs obligatoires manquants' },
        { status: 400 }
      );
    }

    if (!images || images.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Au moins une image est requise' },
        { status: 400 }
      );
    }

    if (!variants || variants.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Au moins une variante (taille) est requise' },
        { status: 400 }
      );
    }

    // Créer le produit
    const product = await createProduct({
      name,
      description: description || '',
      detailedDescription: detailedDescription || '',
      price: parseFloat(price),
      category,
      brand: brand || undefined,
      images: images.map((img: any) => ({
        url: img.url,
        alt: img.alt || name,
        isPrimary: img.isPrimary || false,
      })),
      variants: variants.map((v: any) => ({
        size: v.size,
        stock: parseInt(v.stock) || 0,
        sku: v.sku || `${name}-${v.size}`.toUpperCase().replace(/\s+/g, '-'),
      })),
      features: (features || []).map((f: any) => ({
        name: f.name,
        value: f.value,
      })),
      colors: colors || [],
      isNew: isNew || false,
      isFeatured: isFeatured || false,
    });

    return NextResponse.json({
      success: true,
      data: product,
    });
  } catch (error: any) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erreur lors de la création du produit' },
      { status: 500 }
    );
  }
}

