import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * Route publique pour récupérer les promotions actives
 * GET /api/promotions?productId=xxx&category=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const category = searchParams.get('category');

    const now = new Date().toISOString();

    // Construire la requête pour les promotions actives
    let query = supabase
      .from('promotions')
      .select('*')
      .eq('is_active', true)
      .lte('start_date', now)
      .gte('end_date', now)
      .order('priority', { ascending: false });

    // Si un produit spécifique est demandé, filtrer
    if (productId) {
      query = query.or(`applies_to.eq.all,applies_to.eq.products,product_ids.cs.["${productId}"]`);
    }

    // Si une catégorie est demandée, filtrer
    if (category) {
      query = query.or(`applies_to.eq.all,applies_to.eq.category,category.eq.${category}`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching promotions:', error);
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des promotions' },
        { status: 500 }
      );
    }

    // Filtrer les promotions qui ont atteint leur limite d'utilisation
    const activePromotions = (data || []).filter(p => {
      if (p.max_uses && p.current_uses >= p.max_uses) {
        return false;
      }
      return true;
    });

    return NextResponse.json({
      success: true,
      promotions: activePromotions,
    });

  } catch (error) {
    console.error('Error in promotions GET API:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

