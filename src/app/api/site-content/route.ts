import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * GET /api/site-content
 * API publique pour récupérer le contenu d'une page (accessible sans authentification)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pageId = searchParams.get('pageId');
    const language = searchParams.get('language') || 'fr';

    if (!pageId) {
      return NextResponse.json(
        { success: false, error: 'pageId is required' },
        { status: 400 }
      );
    }

    // Utiliser le client Supabase public (avec RLS qui permet la lecture publique)
    const { data, error } = await supabase
      .from('site_content')
      .select('*')
      .eq('page_id', pageId)
      .eq('language', language)
      .maybeSingle();

    if (error) {
      // PGRST116 = no rows returned (c'est normal si le contenu n'existe pas encore)
      if (error.code === 'PGRST116') {
        return NextResponse.json({
          success: true,
          data: { page_id: pageId, language, content: {} }
        }, {
          headers: {
            'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
          },
        });
      }
      
      console.error('Error fetching site content:', error);
      
      // En cas d'erreur, retourner un objet vide plutôt qu'une erreur
      return NextResponse.json({
        success: true,
        data: { page_id: pageId, language, content: {} }
      }, {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: data || { page_id: pageId, language, content: {} }
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { 
        success: true, 
        data: { page_id: null, language: 'fr', content: {} },
        error: 'Internal server error' 
      },
      { status: 200 } // Retourner 200 pour ne pas bloquer l'affichage
    );
  }
}

