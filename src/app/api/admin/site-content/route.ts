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

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching site content:', error);
      return NextResponse.json(
        { success: false, error: 'Database error' },
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
    const { data: existingData } = await supabaseAdmin
      .from('site_content')
      .select('id')
      .eq('page_id', pageId)
      .eq('language', language)
      .single();

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
      return NextResponse.json(
        { success: false, error: 'Database error', details: error.message },
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

