import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';

/**
 * GET - Récupère le contenu légal d'une page
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pageId = searchParams.get('pageId');
    const language = searchParams.get('language') || 'fr';

    if (!pageId) {
      return NextResponse.json(
        { error: 'pageId est requis' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('legal_content')
      .select('*')
      .eq('page_id', pageId)
      .eq('language', language)
      .maybeSingle();

    // Si la table n'existe pas, retourner null sans erreur
    if (error && error.code === '42P01') {
      console.warn('⚠️ Table legal_content n\'existe pas encore:', error.message);
      return NextResponse.json({
        success: true,
        content: null,
        message: 'Aucun contenu trouvé',
      }, {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      });
    }

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching legal content:', error);
      // Retourner null sans erreur pour ne pas bloquer l'affichage
      return NextResponse.json({
        success: true,
        content: null,
        message: 'Aucun contenu trouvé',
      }, {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      });
    }

    if (!data) {
      return NextResponse.json({
        success: true,
        content: null,
        message: 'Aucun contenu trouvé, utilisation du contenu par défaut',
      }, {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      });
    }

    return NextResponse.json({
      success: true,
      content: data.content,
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });

  } catch (error) {
    console.error('Error in legal-content GET API:', error);
    // Retourner null sans erreur pour ne pas bloquer l'affichage
    return NextResponse.json({
      success: true,
      content: null,
      message: 'Aucun contenu trouvé',
    });
  }
}

/**
 * POST/PUT - Sauvegarde ou met à jour le contenu légal (admin)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pageId, language, content } = body;

    if (!pageId || !content) {
      return NextResponse.json(
        { error: 'pageId et content sont requis' },
        { status: 400 }
      );
    }

    const lang = language || 'fr';

    // Vérifier si le contenu existe déjà
    const { data: existing } = await supabaseAdmin
      .from('legal_content')
      .select('id')
      .eq('page_id', pageId)
      .eq('language', lang)
      .single();

    let data, error;

    if (existing && existing.id) {
      // Mettre à jour
      const result = await supabaseAdmin
        .from('legal_content')
        .update({
          content: content,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single();
      data = result.data;
      error = result.error;
    } else {
      // Créer
      const result = await supabaseAdmin
        .from('legal_content')
        .insert({
          page_id: pageId,
          language: lang,
          content: content,
        })
        .select()
        .single();
      data = result.data;
      error = result.error;
    }

    if (error) {
      console.error('Error saving legal content:', error);
      return NextResponse.json(
        { error: 'Erreur lors de la sauvegarde' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      content: data,
      message: 'Contenu sauvegardé avec succès',
    });

  } catch (error) {
    console.error('Error in legal-content POST API:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

