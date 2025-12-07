import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyAuth } from '@/lib/auth';

/**
 * GET - Récupère toutes les catégories (admin - inclut les inactives)
 */
export async function GET(request: NextRequest) {
  try {
    // Vérifier l'authentification admin
    const authResult = await verifyAuth(request);
    if (authResult.status !== 200 || authResult.user?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('categories')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching categories:', error);
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des catégories' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      categories: data || [],
    });
  } catch (error) {
    console.error('Error in admin categories GET API:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

