import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyAuth } from '@/lib/auth';

/**
 * PATCH - Active/désactive une catégorie
 * /api/admin/categories/[slug]/toggle-active
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    // Vérifier l'authentification admin
    const authResult = await verifyAuth(request);
    if (authResult.status !== 200 || authResult.user?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    const { slug } = await params;
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
      .from('categories')
      .update({ is_active: isActive })
      .eq('slug', slug)
      .select()
      .single();

    if (error) {
      console.error('Error updating category status:', error);
      return NextResponse.json(
        { error: 'Erreur lors de la mise à jour de la catégorie' },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Catégorie non trouvée' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      category: {
        slug: data.slug,
        name_key: data.name_key,
        isActive: data.is_active,
      },
      message: isActive ? 'Catégorie activée avec succès' : 'Catégorie désactivée avec succès',
    });

  } catch (error) {
    console.error('Error in toggle-active API:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

