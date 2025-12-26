import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * GET /api/admin/site-content
 * Récupère le contenu d'une page spécifique
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

    const { data, error } = await supabaseAdmin
      .from('site_content')
      .select('*')
      .eq('page_id', pageId)
      .eq('language', language)
      .single();

    if (error) {
      // PGRST116 = no rows returned (c'est normal si le contenu n'existe pas encore)
      if (error.code === 'PGRST116') {
        return NextResponse.json({
          success: true,
          data: { page_id: pageId, language, content: {} }
        });
      }
      
      console.error('Error fetching site content:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'Database error',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data || { page_id: pageId, language, content: {} }
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/site-content
 * Sauvegarde ou met à jour le contenu d'une page
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pageId, language = 'fr', content } = body;

    if (!pageId || !content) {
      return NextResponse.json(
        { success: false, error: 'pageId and content are required' },
        { status: 400 }
      );
    }

    // Vérifier si le contenu existe déjà
    const { data: existingData, error: checkError } = await supabaseAdmin
      .from('site_content')
      .select('id')
      .eq('page_id', pageId)
      .eq('language', language)
      .maybeSingle(); // Utiliser maybeSingle() au lieu de single() pour éviter les erreurs si pas de résultat

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing content:', checkError);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Database error',
          details: process.env.NODE_ENV === 'development' ? checkError.message : undefined
        },
        { status: 500 }
      );
    }

    let data, error;

    if (existingData) {
      // Mettre à jour l'enregistrement existant
      const result = await supabaseAdmin
        .from('site_content')
        .update({
          content,
          updated_at: new Date().toISOString()
        })
        .eq('page_id', pageId)
        .eq('language', language)
        .select()
        .single();
      
      data = result.data;
      error = result.error;
    } else {
      // Créer un nouvel enregistrement
      const result = await supabaseAdmin
        .from('site_content')
        .insert({
          page_id: pageId,
          language,
          content,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      data = result.data;
      error = result.error;
    }

    if (error) {
      console.error('Error saving site content:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'Database error',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

