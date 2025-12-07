import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

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

    // Récupérer toutes les promotions actives
    const { data, error } = await supabaseAdmin
      .from('promotions')
      .select('*')
      .eq('is_active', true)
      .lte('start_date', now)
      .gte('end_date', now)
      .order('priority', { ascending: false });

    if (error) {
      console.error('Error fetching promotions:', error);
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des promotions', details: error.message },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      return NextResponse.json({
        success: true,
        promotions: [],
      });
    }

    // Filtrer les promotions selon les critères
    let filteredPromotions = data.filter(p => {
      // Filtrer celles qui ont atteint leur limite d'utilisation
      if (p.max_uses && p.current_uses >= p.max_uses) {
        return false;
      }

      // Si un produit spécifique est demandé
      if (productId) {
        if (p.applies_to === 'all') {
          return true;
        }
        if (p.applies_to === 'products') {
          const productIds = Array.isArray(p.product_ids) ? p.product_ids : [];
          return productIds.includes(productId);
        }
        // Si applies_to est 'category' ou 'product', ne pas inclure pour productId
        return false;
      }

      // Si une catégorie est demandée
      if (category) {
        if (p.applies_to === 'all') {
          return true;
        }
        if (p.applies_to === 'category') {
          return p.category === category;
        }
        // Si applies_to est 'product' ou 'products', ne pas inclure pour category
        return false;
      }

      // Si aucun filtre spécifique, inclure toutes les promotions actives
      return true;
    });

    return NextResponse.json({
      success: true,
      promotions: filteredPromotions,
    });

  } catch (error: any) {
    console.error('Error in promotions GET API:', error);
    return NextResponse.json(
      { error: 'Erreur serveur', details: process.env.NODE_ENV === 'development' ? error.message : undefined },
      { status: 500 }
    );
  }
}

