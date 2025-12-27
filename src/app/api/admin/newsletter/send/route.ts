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

    // ✅ VÉRIFICATION : Vérifier la configuration email avant d'envoyer
    const emailService = process.env.EMAIL_SERVICE || 'resend';
    const resendApiKey = process.env.RESEND_API_KEY;
    const sendgridApiKey = process.env.SENDGRID_API_KEY;
    
    if (emailService === 'resend' && !resendApiKey) {
      console.error('❌ RESEND_API_KEY n\'est pas configurée dans les variables d\'environnement');
      return NextResponse.json(
        { 
          error: 'Configuration email manquante',
          details: 'La clé API Resend (RESEND_API_KEY) n\'est pas configurée. Veuillez configurer les variables d\'environnement.',
          sentCount: 0,
          failedCount: subscribers.length,
          totalRecipients: subscribers.length,
        },
        { status: 500 }
      );
    }
    
    if (emailService === 'sendgrid' && !sendgridApiKey) {
      console.error('❌ SENDGRID_API_KEY n\'est pas configurée dans les variables d\'environnement');
      return NextResponse.json(
        { 
          error: 'Configuration email manquante',
          details: 'La clé API SendGrid (SENDGRID_API_KEY) n\'est pas configurée. Veuillez configurer les variables d\'environnement.',
          sentCount: 0,
          failedCount: subscribers.length,
          totalRecipients: subscribers.length,
        },
        { status: 500 }
      );
    }

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
        
        console.log(`📧 [Newsletter] Tentative d'envoi à ${subscriber.email}${subscriber.name ? ` (${subscriber.name})` : ''}:`, {
          subject,
          htmlLength: htmlMessage.length,
          textLength: textMessage.length,
          emailService,
        });
        
        const result = await sendEmail({
          to: subscriber.email,
          subject,
          html: htmlMessage,
          text: textMessage,
        });
        
        if (result.success) {
          console.log(`✅ [Newsletter] Email envoyé avec succès à ${subscriber.email}, ID: ${result.messageId}`);
        } else {
          console.error(`❌ [Newsletter] Échec de l'envoi à ${subscriber.email}:`, result.error);
        }
        
        // ✅ AMÉLIORATION : Retourner un objet avec plus de détails
        return {
          ...result,
          email: subscriber.email,
          name: subscriber.name,
        };
      } catch (error: any) {
        console.error(`❌ [Newsletter] Erreur lors de l'envoi à ${subscriber.email}:`, error);
        return {
          success: false,
          error: error.message || 'Erreur inconnue lors de l\'envoi',
          email: subscriber.email,
          name: subscriber.name,
        };
      }
    });

    const results = await Promise.allSettled(emailPromises);
    
    // ✅ AMÉLIORATION : Compter les succès et échecs avec plus de détails
    let sentCount = 0;
    let failedCount = 0;
    const failedEmails: Array<{ email: string; error: string }> = [];
    const successfulEmails: string[] = [];
    
    results.forEach((result) => {
      if (result.status === 'fulfilled') {
        const emailResult = result.value;
        if (emailResult.success) {
          sentCount++;
          successfulEmails.push(emailResult.email);
        } else {
          failedCount++;
          failedEmails.push({
            email: emailResult.email,
            error: emailResult.error || 'Erreur inconnue',
          });
          console.error(`❌ [Newsletter] Échec pour ${emailResult.email}:`, emailResult.error);
        }
      } else {
        failedCount++;
        const email = result.reason?.email || 'email inconnu';
        failedEmails.push({
          email,
          error: result.reason?.message || 'Erreur lors de l\'envoi',
        });
        console.error(`❌ [Newsletter] Erreur pour ${email}:`, result.reason);
      }
    });
    
    console.log(`📊 [Newsletter] Résumé de l'envoi: ${sentCount} succès, ${failedCount} échecs sur ${subscribers.length} destinataires`);
    
    if (failedCount > 0) {
      console.error(`❌ [Newsletter] Emails en échec:`, failedEmails);
    }

    // ✅ AMÉLIORATION : Retourner un message d'erreur si tous les emails ont échoué
    if (sentCount === 0 && failedCount > 0) {
      return NextResponse.json({
        success: false,
        error: 'Aucun email n\'a pu être envoyé',
        details: failedEmails.length > 0 ? failedEmails[0].error : 'Erreur inconnue',
        sentCount: 0,
        failedCount,
        totalRecipients: subscribers.length,
        failedEmails: failedEmails.map(f => f.email),
      }, { status: 500 });
    }

    return NextResponse.json({
      success: sentCount > 0,
      sentCount,
      failedCount,
      totalRecipients: subscribers.length,
      message: sentCount > 0 
        ? `Email envoyé à ${sentCount} destinataire(s)${failedCount > 0 ? ` (${failedCount} échec(s))` : ''}`
        : `Aucun email n'a pu être envoyé`,
      failedEmails: failedCount > 0 ? failedEmails : undefined,
    });

  } catch (error) {
    console.error('Error in send newsletter email API:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

