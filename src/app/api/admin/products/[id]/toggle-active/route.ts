import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * Route pour activer/désactiver un produit
 * PATCH /api/admin/products/[id]/toggle-active
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { isActive } = body;

    if (typeof isActive !== 'boolean') {
      return NextResponse.json(
        { error: 'isActive doit être un boolean' },
        { status: 400 }
      );
    }

    // Mettre à jour le statut actif/inactif
    const { data, error } = await supabaseAdmin
      .from('products')
      .update({ is_active: isActive })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating product status:', error);
      return NextResponse.json(
        { error: 'Erreur lors de la mise à jour du produit' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      product: {
        id: data.id,
        name: data.name,
        isActive: data.is_active,
      },
      message: isActive ? 'Produit activé avec succès' : 'Produit désactivé avec succès',
    });

  } catch (error) {
    console.error('Error in toggle-active API:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

