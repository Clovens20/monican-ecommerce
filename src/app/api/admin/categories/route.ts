import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyAuth } from '@/lib/auth';
import { z } from 'zod';

const CreateCategorySchema = z.object({
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, 'Le slug doit contenir uniquement des lettres minuscules, chiffres et tirets'),
  name_key: z.string().min(1, 'Le nom de la catégorie est requis'),
  icon: z.string().nullable().optional(),
  color: z.string().nullable().optional().refine(
    (val) => !val || /^#[0-9A-Fa-f]{6}$/.test(val),
    { message: 'Format couleur invalide (ex: #3B82F6)' }
  ),
  display_order: z.number().int().min(0).default(0),
});

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

/**
 * POST - Crée une nouvelle catégorie (admin uniquement)
 */
export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification admin
    const authResult = await verifyAuth(request);
    if (authResult.status !== 200 || authResult.user?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Valider les données
    const validationResult = CreateCategorySchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Données invalides', 
          details: validationResult.error.issues 
        },
        { status: 400 }
      );
    }

    const { slug, name_key, icon, color, display_order } = validationResult.data;

    // Vérifier si le slug existe déjà
    const { data: existingCategory, error: checkError } = await supabaseAdmin
      .from('categories')
      .select('slug')
      .eq('slug', slug)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error checking existing category:', checkError);
      return NextResponse.json(
        { error: 'Erreur lors de la vérification de la catégorie' },
        { status: 500 }
      );
    }

    if (existingCategory) {
      return NextResponse.json(
        { error: 'Une catégorie avec ce slug existe déjà' },
        { status: 400 }
      );
    }

    // Créer la catégorie
    const { data: newCategory, error: insertError } = await supabaseAdmin
      .from('categories')
      .insert({
        slug,
        name_key,
        icon: icon || null,
        color: color || null,
        display_order: display_order || 0,
        is_active: true, // Par défaut, la catégorie est active
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating category:', insertError);
      return NextResponse.json(
        { error: 'Erreur lors de la création de la catégorie' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      category: newCategory,
    });
  } catch (error) {
    console.error('Error in admin categories POST API:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

