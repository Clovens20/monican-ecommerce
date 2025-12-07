import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * Route pour activer/désactiver une promotion
 * PATCH /api/admin/promotions/[id]/toggle-active
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

    const { data, error } = await supabaseAdmin
      .from('promotions')
      .update({ is_active: isActive })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating promotion status:', error);
      return NextResponse.json(
        { error: 'Erreur lors de la mise à jour de la promotion' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      promotion: {
        id: data.id,
        name: data.name,
        isActive: data.is_active,
      },
      message: isActive ? 'Promotion activée avec succès' : 'Promotion désactivée avec succès',
    });

  } catch (error) {
    console.error('Error in toggle-active API:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

