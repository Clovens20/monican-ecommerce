import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * Route publique pour récupérer les promotions actives
 * GET /api/promotions?productId=xxx&category=xxx
 */
export async function GET(request: NextRequest) {
  try {
    // Vérifier que supabaseAdmin est configuré
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY === 'placeholder-service-role-key') {
      console.error('❌ SUPABASE_SERVICE_ROLE_KEY n\'est pas configuré');
      // Retourner un tableau vide au lieu d'une erreur pour ne pas bloquer l'affichage
      return NextResponse.json({
        success: true,
        promotions: [],
      });
    }

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

    // Si la table n'existe pas, retourner un tableau vide
    if (error && error.code === '42P01') {
      console.warn('⚠️ Table promotions n\'existe pas encore:', error.message);
      return NextResponse.json({
        success: true,
        promotions: [],
      });
    }

    if (error) {
      console.error('Error fetching promotions:', error);
      // Retourner un tableau vide au lieu d'une erreur pour ne pas bloquer l'affichage
      return NextResponse.json({
        success: true,
        promotions: [],
      });
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
    // Retourner un tableau vide au lieu d'une erreur pour ne pas bloquer l'affichage
    return NextResponse.json({
      success: true,
      promotions: [],
    });
  }
}

