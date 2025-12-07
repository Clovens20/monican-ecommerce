import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';

// GET: Récupérer les avis d'un produit
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const searchParams = request.nextUrl.searchParams;
        const sortBy = searchParams.get('sortBy') || 'newest';

        let query = supabase
            .from('product_reviews')
            .select('*')
            .eq('product_id', id)
            .eq('is_approved', true)
            .order('created_at', { ascending: false });

        // Appliquer le tri
        if (sortBy === 'oldest') {
            query = query.order('created_at', { ascending: true });
        } else if (sortBy === 'highest') {
            query = query.order('rating', { ascending: false });
        } else if (sortBy === 'lowest') {
            query = query.order('rating', { ascending: true });
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching reviews:', error);
            return NextResponse.json(
                { error: 'Erreur lors de la récupération des avis' },
                { status: 500 }
            );
        }

        // Calculer la moyenne des notes
        const averageRating = data && data.length > 0
            ? data.reduce((sum, review) => sum + review.rating, 0) / data.length
            : 0;

        return NextResponse.json({
            reviews: data || [],
            averageRating: Math.round(averageRating * 10) / 10,
            totalReviews: data?.length || 0,
        });
    } catch (error) {
        console.error('Error in GET /api/products/[id]/reviews:', error);
        return NextResponse.json(
            { error: 'Erreur serveur' },
            { status: 500 }
        );
    }
}

// POST: Créer un nouvel avis
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { authorName, authorEmail, rating, comment } = body;

        // Validation
        if (!authorName || !rating || !comment) {
            return NextResponse.json(
                { error: 'Tous les champs sont requis' },
                { status: 400 }
            );
        }

        if (rating < 1 || rating > 5) {
            return NextResponse.json(
                { error: 'La note doit être entre 1 et 5' },
                { status: 400 }
            );
        }

        // Récupérer l'utilisateur actuel si connecté
        const authHeader = request.headers.get('authorization');
        let userId = null;
        
        if (authHeader) {
            // TODO: Extraire userId depuis le token JWT
        }

        // Insérer l'avis
        const { data, error } = await supabaseAdmin
            .from('product_reviews')
            .insert({
                product_id: id,
                user_id: userId,
                author_name: authorName,
                author_email: authorEmail || null,
                rating: parseInt(rating),
                comment: comment.trim(),
                is_approved: true, // Auto-approuver pour l'instant
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating review:', error);
            return NextResponse.json(
                { error: 'Erreur lors de la création de l\'avis' },
                { status: 500 }
            );
        }

        return NextResponse.json(
            { success: true, review: data },
            { status: 201 }
        );
    } catch (error) {
        console.error('Error in POST /api/products/[id]/reviews:', error);
        return NextResponse.json(
            { error: 'Erreur serveur' },
            { status: 500 }
        );
    }
}
