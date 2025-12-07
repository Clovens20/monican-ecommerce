import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { z } from 'zod';

const PromotionSchema = z.object({
  name: z.string().min(1, 'Le nom est requis'),
  description: z.string().optional(),
  discount_type: z.enum(['percentage', 'fixed']),
  discount_value: z.number().min(0, 'La valeur doit être positive'),
  applies_to: z.enum(['all', 'category', 'product', 'products']),
  category: z.string().nullable().optional(),
  product_ids: z.array(z.string()).optional().default([]),
  start_date: z.string(),
  end_date: z.string(),
  is_active: z.boolean().default(true),
  priority: z.number().default(0),
  promo_code: z.string().nullable().optional(),
  min_purchase_amount: z.number().min(0).default(0),
  max_uses: z.number().nullable().optional(),
  banner_text: z.string().nullable().optional(),
});

/**
 * GET - Récupère toutes les promotions (admin)
 */
export async function GET(request: NextRequest) {
  try {
    const { data, error } = await supabaseAdmin
      .from('promotions')
      .select('*')
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching promotions:', error);
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des promotions' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      promotions: data || [],
    });

  } catch (error) {
    console.error('Error in promotions GET API:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

/**
 * POST - Crée une nouvelle promotion
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const validationResult = PromotionSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Vérifier que les dates sont valides
    const startDate = new Date(data.start_date);
    const endDate = new Date(data.end_date);

    if (endDate <= startDate) {
      return NextResponse.json(
        { error: 'La date de fin doit être après la date de début' },
        { status: 400 }
      );
    }

    // Préparer les données pour Supabase
    const promotionData: any = {
      name: data.name,
      description: data.description || null,
      discount_type: data.discount_type,
      discount_value: data.discount_value,
      applies_to: data.applies_to,
      category: data.applies_to === 'category' ? data.category : null,
      product_ids: data.applies_to === 'products' ? data.product_ids : [],
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      is_active: data.is_active,
      priority: data.priority,
      promo_code: data.promo_code || null,
      min_purchase_amount: data.min_purchase_amount,
      max_uses: data.max_uses || null,
      banner_text: data.banner_text || null,
      current_uses: 0,
    };

    const { data: newPromotion, error } = await supabaseAdmin
      .from('promotions')
      .insert(promotionData)
      .select()
      .single();

    if (error) {
      console.error('Error creating promotion:', error);
      return NextResponse.json(
        { error: 'Erreur lors de la création de la promotion' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      promotion: newPromotion,
    });

  } catch (error) {
    console.error('Error in promotions POST API:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

