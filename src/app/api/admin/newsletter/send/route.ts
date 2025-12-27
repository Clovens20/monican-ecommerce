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

    // Récupérer les emails des destinataires avec leurs noms
    const { data: subscribers, error: fetchError } = await supabaseAdmin
      .from('newsletter_subscribers')
      .select('email, name, status')
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

    // ✅ AMÉLIORATION : Créer un template HTML professionnel pour les emails de newsletter
    const getNewsletterTemplate = (content: string, subscriberName?: string) => {
      const contactInfo = process.env.EMAIL_FROM || 'noreply@monican.shop';
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://monican.shop';
      const greeting = subscriberName ? `Bonjour ${subscriberName},` : 'Bonjour,';
      
      return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb;">
    <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f9fafb;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    <!-- Header avec gradient -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #10B981 0%, #3B82F6 100%); padding: 40px 30px; text-align: center;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 800; line-height: 1.2;">
                                Monican Newsletter
                            </h1>
                        </td>
                    </tr>
                    
                    <!-- Contenu principal -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <p style="margin: 0 0 20px; font-size: 18px; line-height: 1.6; color: #111827; font-weight: 600;">
                                ${greeting}
                            </p>
                            
                            <div style="font-size: 16px; line-height: 1.8; color: #4b5563;">
                                ${content}
                            </div>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                            <p style="margin: 0 0 10px; font-size: 14px; color: #6b7280;">
                                Des questions ? Contactez-nous à <a href="mailto:${contactInfo}" style="color: #10B981; text-decoration: none;">${contactInfo}</a>
                            </p>
                            <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                                © ${new Date().getFullYear()} Monican.shop. Tous droits réservés.
                            </p>
                            <p style="margin: 10px 0 0; font-size: 12px; color: #9ca3af;">
                                <a href="${siteUrl}/unsubscribe" style="color: #6b7280; text-decoration: underline;">Se désabonner</a>
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
      `.trim();
    };

    // Envoyer les emails avec template professionnel
    const emailPromises = subscribers.map(async (subscriber) => {
      try {
        // Convertir le message en HTML propre
        let htmlContent = message;
        
        // Si le message contient déjà du HTML, le garder tel quel
        // Sinon, convertir les sauts de ligne en <br>
        if (!message.includes('<') && !message.includes('>')) {
          htmlContent = message
            .replace(/\n\n/g, '</p><p style="margin: 20px 0;">')
            .replace(/\n/g, '<br>');
          htmlContent = `<p style="margin: 0 0 20px;">${htmlContent}</p>`;
        }
        
        // Créer le template HTML complet
        const htmlMessage = getNewsletterTemplate(htmlContent, subscriber.name || undefined);
        
        // Générer une version texte propre
        const textMessage = message
          .replace(/<[^>]+>/g, '') // Enlever les balises HTML
          .replace(/&nbsp;/g, ' ')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .trim();
        
        console.log(`📧 Envoi d'email à ${subscriber.email}${subscriber.name ? ` (${subscriber.name})` : ''}:`, {
          subject,
          htmlLength: htmlMessage.length,
          textLength: textMessage.length,
        });
        
        const result = await sendEmail({
          to: subscriber.email,
          subject,
          html: htmlMessage,
          text: textMessage,
        });
        
        if (result.success) {
          console.log(`✅ Email envoyé avec succès à ${subscriber.email}, ID: ${result.messageId}`);
        } else {
          console.error(`❌ Échec de l'envoi à ${subscriber.email}:`, result.error);
        }
        
        return result;
      } catch (error: any) {
        console.error(`❌ Erreur lors de l'envoi à ${subscriber.email}:`, error);
        throw error;
      }
    });

    const results = await Promise.allSettled(emailPromises);
    
    // ✅ AMÉLIORATION : Compter les succès et échecs avec plus de détails
    let sentCount = 0;
    let failedCount = 0;
    const failedEmails: string[] = [];
    
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        const emailResult = result.value;
        if (emailResult.success) {
          sentCount++;
        } else {
          failedCount++;
          failedEmails.push(subscribers[index].email);
          console.error(`❌ Échec pour ${subscribers[index].email}:`, emailResult.error);
        }
      } else {
        failedCount++;
        failedEmails.push(subscribers[index].email);
        console.error(`❌ Erreur pour ${subscribers[index].email}:`, result.reason);
      }
    });
    
    console.log(`📊 Résumé de l'envoi: ${sentCount} succès, ${failedCount} échecs sur ${subscribers.length} destinataires`);

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

