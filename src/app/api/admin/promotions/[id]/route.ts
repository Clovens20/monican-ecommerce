import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { z } from 'zod';

const PromotionSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  discount_type: z.enum(['percentage', 'fixed']).optional(),
  discount_value: z.number().min(0).optional(),
  applies_to: z.enum(['all', 'category', 'product', 'products']).optional(),
  category: z.string().nullable().optional(),
  product_ids: z.array(z.string()).optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  is_active: z.boolean().optional(),
  priority: z.number().optional(),
  promo_code: z.string().nullable().optional(),
  min_purchase_amount: z.number().min(0).optional(),
  max_uses: z.number().nullable().optional(),
  banner_text: z.string().nullable().optional(),
});

/**
 * PUT - Met à jour une promotion
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    const validationResult = PromotionSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const data = validationResult.data;
    const updateData: any = {};

    // Construire l'objet de mise à jour
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.discount_type !== undefined) updateData.discount_type = data.discount_type;
    if (data.discount_value !== undefined) updateData.discount_value = data.discount_value;
    if (data.applies_to !== undefined) updateData.applies_to = data.applies_to;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.product_ids !== undefined) updateData.product_ids = data.product_ids;
    if (data.start_date !== undefined) updateData.start_date = new Date(data.start_date).toISOString();
    if (data.end_date !== undefined) updateData.end_date = new Date(data.end_date).toISOString();
    if (data.is_active !== undefined) updateData.is_active = data.is_active;
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.promo_code !== undefined) updateData.promo_code = data.promo_code;
    if (data.min_purchase_amount !== undefined) updateData.min_purchase_amount = data.min_purchase_amount;
    if (data.max_uses !== undefined) updateData.max_uses = data.max_uses;
    if (data.banner_text !== undefined) updateData.banner_text = data.banner_text;

    const { data: updatedPromotion, error } = await supabaseAdmin
      .from('promotions')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating promotion:', error);
      return NextResponse.json(
        { error: 'Erreur lors de la mise à jour de la promotion' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      promotion: updatedPromotion,
    });

  } catch (error) {
    console.error('Error in promotions PUT API:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Supprime une promotion
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { error } = await supabaseAdmin
      .from('promotions')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting promotion:', error);
      return NextResponse.json(
        { error: 'Erreur lors de la suppression de la promotion' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Promotion supprimée avec succès',
    });

  } catch (error) {
    console.error('Error in promotions DELETE API:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

