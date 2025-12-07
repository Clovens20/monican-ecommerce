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
    const { data: existing } = await supabaseAdmin
      .from('newsletter_subscribers')
      .select('id, status')
      .eq('email', normalizedEmail)
      .single();

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

      console.error('Error subscribing to newsletter:', error);
      return NextResponse.json(
        { error: 'Erreur lors de l\'inscription' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Inscription réussie ! Vous recevrez bientôt nos meilleures offres.',
      subscriber: {
        id: newSubscriber.id,
        email: newSubscriber.email,
      },
    });

  } catch (error) {
    console.error('Error in newsletter subscribe API:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

