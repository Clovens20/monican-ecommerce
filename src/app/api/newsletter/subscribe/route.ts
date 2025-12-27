import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { z } from 'zod';

const SubscribeSchema = z.object({
  email: z.string().email('Email invalide'),
});

/**
 * POST - S'abonner à la newsletter
 */
export async function POST(request: NextRequest) {
  try {
    // Vérifier que supabaseAdmin est configuré
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY === 'placeholder-service-role-key') {
      console.error('❌ SUPABASE_SERVICE_ROLE_KEY n\'est pas configuré');
      return NextResponse.json(
        { error: 'Configuration serveur manquante. Veuillez contacter le support.' },
        { status: 500 }
      );
    }

    const body = await request.json();
    
    const validationResult = SubscribeSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Email invalide', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const { email } = validationResult.data;
    const normalizedEmail = email.toLowerCase().trim();

    // Vérifier si l'email existe déjà
    const { data: existing, error: checkError } = await supabaseAdmin
      .from('newsletter_subscribers')
      .select('id, status')
      .eq('email', normalizedEmail)
      .maybeSingle();

    // Si la table n'existe pas, retourner une erreur claire
    if (checkError && checkError.code === '42P01') {
      console.error('❌ Table newsletter_subscribers n\'existe pas:', checkError);
      return NextResponse.json(
        { error: 'Service temporairement indisponible. Veuillez réessayer plus tard.' },
        { status: 503 }
      );
    }

    // ✅ CORRECTION : Gérer les erreurs de connexion Supabase
    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing subscriber:', checkError);
      
      // Si c'est une erreur de connexion ou d'authentification
      if (checkError.message?.includes('JWT') || checkError.message?.includes('Invalid API key')) {
        return NextResponse.json(
          { error: 'Configuration serveur manquante. Veuillez contacter le support.' },
          { status: 500 }
        );
      }
      
      // Pour les autres erreurs, continuer avec l'insertion (peut être une erreur temporaire)
      console.warn('Warning: Error checking subscriber, attempting to insert anyway:', checkError);
    }

    if (existing) {
      // Si déjà inscrit et actif
      if (existing.status === 'active') {
        return NextResponse.json({
          success: true,
          message: 'Vous êtes déjà inscrit à notre newsletter',
          alreadySubscribed: true,
        });
      }

      // Si désinscrit, réactiver l'abonnement
      if (existing.status === 'unsubscribed') {
        const { error: updateError } = await supabaseAdmin
          .from('newsletter_subscribers')
          .update({
            status: 'active',
            subscribed_at: new Date().toISOString(),
            unsubscribed_at: null,
          })
          .eq('id', existing.id);

        if (updateError) {
          console.error('Error reactivating subscription:', updateError);
          throw updateError;
        }

        return NextResponse.json({
          success: true,
          message: 'Votre abonnement a été réactivé',
          reactivated: true,
        });
      }
    }

    // Créer un nouvel abonnement
    const { data: newSubscriber, error } = await supabaseAdmin
      .from('newsletter_subscribers')
      .insert({
        email: normalizedEmail,
        status: 'active',
        source: 'website',
      })
      .select()
      .single();

    if (error) {
      // Si l'erreur est due à une contrainte unique (email déjà existant)
      if (error.code === '23505') {
        return NextResponse.json({
          success: true,
          message: 'Vous êtes déjà inscrit à notre newsletter',
          alreadySubscribed: true,
        });
      }

      // Si la table n'existe pas
      if (error.code === '42P01') {
        console.error('❌ Table newsletter_subscribers n\'existe pas:', error);
        return NextResponse.json(
          { error: 'Service temporairement indisponible. Veuillez réessayer plus tard.' },
          { status: 503 }
        );
      }

      console.error('Error subscribing to newsletter:', error);
      return NextResponse.json(
        { error: 'Erreur lors de l\'inscription. Veuillez réessayer.' },
        { status: 500 }
      );
    }

    // ✅ NOUVEAU : Envoyer un email de bienvenue
    try {
      const { sendWelcomeEmail } = await import('@/lib/email');
      await sendWelcomeEmail({
        email: normalizedEmail,
        subscriberName: normalizedEmail.split('@')[0],
      });
    } catch (emailError) {
      console.error('Error sending welcome email:', emailError);
      // Ne pas bloquer l'inscription si l'email échoue
    }

    return NextResponse.json({
      success: true,
      message: 'Inscription réussie ! Vous recevrez bientôt nos meilleures offres.',
      subscriber: {
        id: newSubscriber.id,
        email: newSubscriber.email,
      },
    });

  } catch (error: any) {
    console.error('Error in newsletter subscribe API:', error);
    
    // Gérer les erreurs de parsing JSON
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Format de données invalide' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erreur serveur. Veuillez réessayer plus tard.' },
      { status: 500 }
    );
  }
}

