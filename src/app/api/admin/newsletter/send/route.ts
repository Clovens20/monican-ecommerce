import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { sendEmail } from '@/lib/email';
import { z } from 'zod';

const SendEmailSchema = z.object({
  subject: z.string().min(1, 'Le sujet est requis'),
  message: z.string().min(1, 'Le message est requis'),
  recipientIds: z.array(z.string()).min(1, 'Au moins un destinataire est requis'),
});

/**
 * POST - Envoie un email à des abonnés
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const validationResult = SendEmailSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const { subject, message, recipientIds } = validationResult.data;

    // Récupérer les emails des destinataires
    const { data: subscribers, error: fetchError } = await supabaseAdmin
      .from('newsletter_subscribers')
      .select('email, status')
      .in('id', recipientIds)
      .eq('status', 'active'); // Seulement les actifs

    if (fetchError) {
      console.error('Error fetching subscribers:', fetchError);
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des destinataires' },
        { status: 500 }
      );
    }

    if (!subscribers || subscribers.length === 0) {
      return NextResponse.json(
        { error: 'Aucun destinataire actif trouvé' },
        { status: 400 }
      );
    }

    // Envoyer les emails
    const emailPromises = subscribers.map(subscriber =>
      sendEmail({
        to: subscriber.email,
        subject,
        html: message.replace(/\n/g, '<br>'), // Convertir les sauts de ligne en HTML
      })
    );

    const results = await Promise.allSettled(emailPromises);
    const sentCount = results.filter(r => r.status === 'fulfilled').length;
    const failedCount = results.filter(r => r.status === 'rejected').length;

    // Log des erreurs
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        console.error(`Failed to send email to ${subscribers[index].email}:`, result.reason);
      }
    });

    return NextResponse.json({
      success: true,
      sentCount,
      failedCount,
      totalRecipients: subscribers.length,
      message: `Email envoyé à ${sentCount} destinataire(s)${failedCount > 0 ? ` (${failedCount} échec(s))` : ''}`,
    });

  } catch (error) {
    console.error('Error in send newsletter email API:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

