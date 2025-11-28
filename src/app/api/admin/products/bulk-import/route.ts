// CHEMIN: src/app/api/admin/products/bulk-import/route.ts
// ACTION: REMPLACER TOUT LE CONTENU

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase';

const ProductSchema = z.object({
  nom: z.string().min(1, 'Nom requis'),
  categorie: z.enum(['jeans', 'maillot', 'chemise', 'tennis']),
  description: z.string(),
  prix: z.number().positive('Prix positif'),
  tailles: z.string().min(1),
  couleurs: z.string().optional(),
  images: z.string().optional(),
  marque: z.string().optional(),
});

const BulkImportSchema = z.object({
  products: z.array(ProductSchema),
});

function parseTailles(taillesStr: string) {
  return taillesStr.split(',').map(t => {
    const [size, stock, sku] = t.trim().split(':');
    return {
      size: size.trim(),
      stock: parseInt(stock),
      sku: sku.trim(),
    };
  });
}

function verifyAuth(request: NextRequest): boolean {
  const authCookie = request.cookies.get('admin_token');
  if (!authCookie?.value) return false;
  return authCookie.value.startsWith('admin-');
}

export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification
    if (!verifyAuth(request)) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    // Valider les données
    const body = await request.json();
    const validationResult = BulkImportSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Données invalides', 
          details: validationResult.error.issues 
        },
        { status: 400 }
      );
    }

    const { products } = validationResult.data;

    // Préparer les données pour Supabase
    const productsToInsert = products.map(product => ({
      name: product.nom,
      category: product.categorie,
      description: product.description,
      price: product.prix,
      variants: parseTailles(product.tailles),
      images: product.images ? product.images.split(',').map(i => i.trim()) : [],
      colors: product.couleurs ? product.couleurs.split(',').map(c => c.trim()) : [],
      brand: product.marque || '',
    }));

    // Insérer dans Supabase
    const { data, error } = await supabaseAdmin
      .from('products')
      .insert(productsToInsert)
      .select();

    if (error) {
      console.error('[IMPORT] Supabase error:', error);
      throw new Error(error.message);
    }

    console.log(`[AUDIT] Imported ${data.length} products successfully`);

    return NextResponse.json({
      success: true,
      message: `${data.length} produits importés avec succès`,
      imported: data.length,
      products: data.map(p => ({ id: p.id, name: p.name })),
    });

  } catch (error) {
    console.error('[IMPORT] Error:', error);
    return NextResponse.json(
      { 
        error: 'Erreur serveur lors de l\'import',
        details: error instanceof Error ? error.message : 'Inconnue'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Méthode non autorisée' },
    { status: 405 }
  );
}