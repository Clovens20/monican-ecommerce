import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { z } from 'zod';

const SubscribeSchema = z.object({
  email: z.string().email('Email invalide'),
  name: z.string().optional(),
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

    const { email, name } = validationResult.data;
    const normalizedEmail = email.toLowerCase().trim();
    const normalizedName = name?.trim() || null;

    // Vérifier si l'email existe déjà
    const { data: existing, error: checkError } = await supabaseAdmin
      .from('newsletter_subscribers')
      .select('id, status, name')
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
      console.error('Error details:', {
        code: checkError.code,
        message: checkError.message,
        details: checkError.details,
        hint: checkError.hint,
      });
      
      // Si c'est une erreur de connexion ou d'authentification
      if (checkError.message?.includes('JWT') || 
          checkError.message?.includes('Invalid API key') ||
          checkError.message?.includes('invalid') ||
          checkError.code === 'PGRST301') {
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
        // Mettre à jour le nom si fourni et différent
        if (normalizedName && normalizedName !== existing.name) {
          await supabaseAdmin
            .from('newsletter_subscribers')
            .update({ name: normalizedName })
            .eq('id', existing.id);
        }
        
        // ✅ Envoyer quand même l'email de bienvenue si pas encore envoyé
        try {
          console.log('📧 Tentative d\'envoi de l\'email de bienvenue à un abonné existant:', normalizedEmail);
          const { sendWelcomeEmail } = await import('@/lib/email');
          const subscriberName = normalizedName || existing.name || normalizedEmail.split('@')[0];
          const emailResult = await sendWelcomeEmail({
            email: normalizedEmail,
            subscriberName,
          });
          
          if (emailResult.success) {
            console.log('✅ Email de bienvenue envoyé avec succès à l\'abonné existant:', normalizedEmail);
          } else {
            console.error('❌ Échec de l\'envoi de l\'email de bienvenue à l\'abonné existant:', emailResult.error);
          }
        } catch (emailError: any) {
          console.error('❌ Erreur lors de l\'envoi de l\'email de bienvenue à l\'abonné existant:', emailError);
          console.error('Stack trace:', emailError.stack);
        }
        
        return NextResponse.json({
          success: true,
          message: 'Vous êtes déjà inscrit à notre newsletter',
          alreadySubscribed: true,
        });
      }

      // Si désinscrit, réactiver l'abonnement
      if (existing.status === 'unsubscribed') {
        const updateData: any = {
          status: 'active',
          subscribed_at: new Date().toISOString(),
          unsubscribed_at: null,
        };
        // Mettre à jour le nom si fourni
        if (normalizedName) {
          updateData.name = normalizedName;
        }
        
        const { error: updateError } = await supabaseAdmin
          .from('newsletter_subscribers')
          .update(updateData)
          .eq('id', existing.id);

        if (updateError) {
          console.error('Error reactivating subscription:', updateError);
          console.error('Update error details:', {
            code: updateError.code,
            message: updateError.message,
            details: updateError.details,
          });
          throw updateError;
        }

        // ✅ Envoyer l'email de bienvenue lors de la réactivation
        try {
          console.log('📧 Tentative d\'envoi de l\'email de bienvenue lors de la réactivation:', normalizedEmail);
          const { sendWelcomeEmail } = await import('@/lib/email');
          const subscriberName = normalizedName || existing.name || normalizedEmail.split('@')[0];
          const emailResult = await sendWelcomeEmail({
            email: normalizedEmail,
            subscriberName,
          });
          
          if (emailResult.success) {
            console.log('✅ Email de bienvenue envoyé avec succès lors de la réactivation:', normalizedEmail);
          } else {
            console.error('❌ Échec de l\'envoi de l\'email de bienvenue lors de la réactivation:', emailResult.error);
          }
        } catch (emailError: any) {
          console.error('❌ Erreur lors de l\'envoi de l\'email de bienvenue lors de la réactivation:', emailError);
          console.error('Stack trace:', emailError.stack);
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
        name: normalizedName,
        status: 'active',
        source: 'website',
      })
      .select()
      .single();

    if (error) {
      console.error('Error inserting subscriber:', error);
      console.error('Insert error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      });
      
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

      // ✅ AMÉLIORATION : Messages d'erreur plus spécifiques
      if (error.code === 'PGRST301' || error.message?.includes('JWT') || error.message?.includes('Invalid API key')) {
        return NextResponse.json(
          { error: 'Configuration serveur manquante. Veuillez contacter le support.' },
          { status: 500 }
        );
      }

      // Si erreur de permissions RLS
      if (error.code === '42501' || error.message?.includes('permission denied')) {
        console.error('❌ Erreur de permissions RLS:', error);
        return NextResponse.json(
          { error: 'Service temporairement indisponible. Veuillez réessayer plus tard.' },
          { status: 503 }
        );
      }

      return NextResponse.json(
        { 
          error: 'Erreur lors de l\'inscription. Veuillez réessayer.',
          // ✅ En développement, inclure plus de détails pour le débogage
          ...(process.env.NODE_ENV === 'development' && {
            debug: {
              code: error.code,
              message: error.message,
            }
          })
        },
        { status: 500 }
      );
    }

    // ✅ NOUVEAU : Envoyer un email de bienvenue (ne bloque pas l'inscription)
    if (newSubscriber) {
      try {
        console.log('📧 Tentative d\'envoi de l\'email de bienvenue à:', normalizedEmail);
        const { sendWelcomeEmail } = await import('@/lib/email');
        const subscriberName = normalizedName || newSubscriber.name || normalizedEmail.split('@')[0];
        const emailResult = await sendWelcomeEmail({
          email: normalizedEmail,
          subscriberName,
        });
        
        if (emailResult.success) {
          console.log('✅ Email de bienvenue envoyé avec succès à:', normalizedEmail);
          console.log('📧 Message ID:', emailResult.messageId);
        } else {
          console.error('❌ Échec de l\'envoi de l\'email de bienvenue:', emailResult.error);
        }
      } catch (emailError: any) {
        console.error('❌ Erreur lors de l\'envoi de l\'email de bienvenue:', emailError);
        console.error('Stack trace:', emailError.stack);
        // Ne pas bloquer l'inscription si l'email échoue
      }
    } else {
      console.warn('⚠️ newSubscriber est null, impossible d\'envoyer l\'email de bienvenue');
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
    console.error('Full error stack:', error.stack);
    
    // Gérer les erreurs de parsing JSON
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Format de données invalide' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Erreur serveur. Veuillez réessayer plus tard.',
        // ✅ En développement, inclure plus de détails
        ...(process.env.NODE_ENV === 'development' && {
          debug: {
            message: error.message,
            name: error.name,
          }
        })
      },
      { status: 500 }
    );
  }
}

