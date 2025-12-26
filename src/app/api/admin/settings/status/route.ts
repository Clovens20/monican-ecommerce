import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * GET /api/admin/settings/status
 * Retourne le statut de la configuration (sans exposer les valeurs sensibles)
 */
export async function GET(request: NextRequest) {
    try {
        // Vérifier la connexion à la base de données
        let databaseConnected = false;
        let databaseError: string | null = null;
        let databaseErrorCode: string | null = null;
        
        // Vérifier d'abord si les variables sont présentes
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        
        const hasSupabaseUrl = !!(supabaseUrl && supabaseUrl !== 'https://placeholder.supabase.co' && !supabaseUrl.includes('placeholder'));
        const hasServiceRoleKey = !!(serviceRoleKey && serviceRoleKey !== 'placeholder-service-role-key' && !serviceRoleKey.includes('placeholder'));
        
        // Log pour debug (sans exposer les valeurs)
        console.log('[Settings Status] Supabase URL configured:', hasSupabaseUrl, 'Length:', supabaseUrl?.length || 0);
        console.log('[Settings Status] Service Role Key configured:', hasServiceRoleKey, 'Length:', serviceRoleKey?.length || 0);
        
        if (!hasSupabaseUrl || !hasServiceRoleKey) {
            let missingVars = [];
            if (!hasSupabaseUrl) missingVars.push('NEXT_PUBLIC_SUPABASE_URL');
            if (!hasServiceRoleKey) missingVars.push('SUPABASE_SERVICE_ROLE_KEY');
            
            databaseError = `Variables d'environnement manquantes: ${missingVars.join(', ')}`;
            databaseErrorCode = 'MISSING_ENV';
        } else {
            try {
                // Créer un nouveau client Supabase avec les variables actuelles pour éviter les problèmes de cache
                const { createClient } = await import('@supabase/supabase-js');
                const testClient = createClient(
                    supabaseUrl!,
                    serviceRoleKey!,
                    {
                        auth: {
                            autoRefreshToken: false,
                            persistSession: false,
                            detectSessionInUrl: false
                        }
                    }
                );
                
                const { data, error } = await testClient.from('products').select('id').limit(1);
                if (error) {
                    databaseError = error.message || 'Erreur de connexion';
                    databaseErrorCode = error.code || 'UNKNOWN';
                    
                    // Messages plus clairs selon le type d'erreur
                    if (error.message?.includes('Invalid API key') || error.message?.includes('JWT') || error.message?.includes('invalid')) {
                        databaseError = 'Clé API Supabase invalide - Vérifiez que SUPABASE_SERVICE_ROLE_KEY est la bonne clé service_role (pas anon)';
                    } else if (error.message?.includes('relation') || error.message?.includes('does not exist')) {
                        databaseError = 'Table introuvable - Vérifiez que les migrations ont été exécutées';
                    } else if (error.message?.includes('permission') || error.message?.includes('RLS')) {
                        databaseError = 'Problème de permissions - Vérifiez les politiques RLS';
                    }
                    
                    console.error('[Settings Status] Database connection error:', {
                        message: error.message,
                        code: error.code,
                        details: error.details,
                        hint: error.hint
                    });
                } else {
                    databaseConnected = true;
                    console.log('[Settings Status] Database connection successful');
                }
            } catch (err: any) {
                databaseError = err.message || 'Erreur inconnue lors de la connexion';
                databaseErrorCode = 'EXCEPTION';
                console.error('[Settings Status] Database connection exception:', err);
            }
        }

        // Vérifier les configurations (sans exposer les valeurs)
        // Vérifier Resend - tester si la clé existe et a le bon format
        const resendApiKey = process.env.RESEND_API_KEY;
        const resendApiKeyExists = !!resendApiKey;
        const resendApiKeyFormat = resendApiKey 
            ? (resendApiKey.startsWith('re_') ? 'correct' : 'incorrect') 
            : 'missing';
        const resendConfigured = !!(resendApiKey && resendApiKey.startsWith('re_') && resendApiKey.length > 10);
        
        const status = {
            // Email
            emailService: process.env.EMAIL_SERVICE || 'resend',
            emailFrom: process.env.EMAIL_FROM || '',
            emailFromName: process.env.EMAIL_FROM_NAME || '',
            resendConfigured,
            resendApiKeyExists,
            resendApiKeyFormat,
            stripeSecretConfigured: !!process.env.STRIPE_SECRET_KEY,
            stripePublishableConfigured: !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
            stripeMode: process.env.STRIPE_SECRET_KEY?.includes('test') ? 'test' : 'live',

            // Livraison
            shippingOriginStreet: process.env.SHIPPING_ORIGIN_STREET || '',
            shippingOriginCity: process.env.SHIPPING_ORIGIN_CITY || '',
            shippingOriginState: process.env.SHIPPING_ORIGIN_STATE || '',
            shippingOriginZip: process.env.SHIPPING_ORIGIN_ZIP || '',
            shippingOriginCountry: process.env.SHIPPING_ORIGIN_COUNTRY || 'US',
            uspsEnabled: !!process.env.USPS_USER_ID,
            fedexEnabled: !!(process.env.FEDEX_API_KEY && process.env.FEDEX_API_SECRET),

            // Base de données
            supabaseConfigured: hasSupabaseUrl && hasServiceRoleKey,
            supabaseUrlConfigured: hasSupabaseUrl,
            serviceRoleKeyConfigured: hasServiceRoleKey,
            supabaseUrlLength: supabaseUrl?.length || 0,
            serviceRoleKeyLength: serviceRoleKey?.length || 0,
            databaseConnected,
            databaseError: databaseError || null,
            databaseErrorCode: databaseErrorCode || null,

            // Environnement
            environment: process.env.NODE_ENV || 'development',
        };

        return NextResponse.json({
            success: true,
            status,
        });
    } catch (error: any) {
        console.error('Error getting settings status:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Erreur serveur' },
            { status: 500 }
        );
    }
}

