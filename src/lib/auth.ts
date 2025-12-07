// ============================================================================
// AUTHENTICATION - Supabase Auth Integration
// ============================================================================

import { supabase, supabaseAdmin } from './supabase';
import { User, Admin } from './types';
import { NextRequest } from 'next/server';

// ============================================================================
// TYPES
// ============================================================================

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface AuthResult {
    success: boolean;
    user?: User | Admin;
    error?: string;
}

// ============================================================================
// AUTHENTICATION FUNCTIONS
// ============================================================================

/**
 * Connexion d'un admin
 */
export async function loginAdmin(credentials: LoginCredentials): Promise<AuthResult> {
    try {
        // Authentifier avec Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: credentials.email,
            password: credentials.password,
        });

        if (authError) {
            return {
                success: false,
                error: authError.message,
            };
        }

        if (!authData.user) {
            return {
                success: false,
                error: 'Utilisateur non trouvé',
            };
        }

        // Récupérer le profil utilisateur
        const { data: profile, error: profileError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', authData.user.id)
            .single();

        if (profileError || !profile) {
            return {
                success: false,
                error: 'Profil utilisateur non trouvé',
            };
        }

        // Vérifier que c'est un admin
        if (profile.role !== 'admin') {
            return {
                success: false,
                error: 'Accès non autorisé',
            };
        }

        // Vérifier que le compte est actif
        if (!profile.is_active) {
            return {
                success: false,
                error: 'Compte désactivé',
            };
        }

        // Mettre à jour la dernière connexion
        await supabaseAdmin
            .from('user_profiles')
            .update({ last_login: new Date().toISOString() })
            .eq('id', authData.user.id);

        const user: Admin = {
            id: profile.id,
            email: profile.email,
            name: profile.name,
            role: profile.role as 'admin',
            createdAt: profile.created_at,
            lastLogin: profile.last_login || undefined,
            permissions: Array.isArray(profile.permissions) ? profile.permissions : [],
        };

        return {
            success: true,
            user,
        };
    } catch (error) {
        console.error('Error in loginAdmin:', error);
        return {
            success: false,
            error: 'Erreur lors de la connexion',
        };
    }
}

/**
 * Déconnexion
 */
export async function logout(): Promise<void> {
    await supabase.auth.signOut();
}

/**
 * Vérifie si l'utilisateur est connecté
 */
export async function getCurrentUser(): Promise<User | Admin | null> {
    try {
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error || !user) {
            return null;
        }

        const { data: profile, error: profileError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        if (profileError || !profile) {
            return null;
        }

        return {
            id: profile.id,
            email: profile.email,
            name: profile.name,
            role: profile.role as 'admin' | 'subadmin' | 'customer',
            createdAt: profile.created_at,
            lastLogin: profile.last_login || undefined,
        };
    } catch (error) {
        console.error('Error in getCurrentUser:', error);
        return null;
    }
}

/**
 * Vérifie si l'utilisateur est admin
 */
export async function isAdmin(): Promise<boolean> {
    const user = await getCurrentUser();
    return user?.role === 'admin';
}

/**
 * Crée un nouvel admin (utilisé uniquement pour l'initialisation)
 * NOTE: Cette fonction doit être appelée côté serveur uniquement
 */
export async function createAdmin(
    email: string,
    password: string,
    name: string,
    permissions: string[] = []
): Promise<AuthResult> {
    try {
        // Créer l'utilisateur dans Supabase Auth
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true, // Auto-confirmer l'email
        });

        if (authError || !authData.user) {
            return {
                success: false,
                error: authError?.message || 'Erreur lors de la création de l\'utilisateur',
            };
        }

        // Créer le profil admin
        const { error: profileError } = await supabaseAdmin
            .from('user_profiles')
            .insert({
                id: authData.user.id,
                email,
                name,
                role: 'admin',
                permissions,
                is_active: true,
            });

        if (profileError) {
            return {
                success: false,
                error: 'Erreur lors de la création du profil',
            };
        }

        return {
            success: true,
        };
    } catch (error) {
        console.error('Error in createAdmin:', error);
        return {
            success: false,
            error: 'Erreur lors de la création de l\'admin',
        };
    }
}

/**
 * Vérifie l'authentification d'un admin depuis une requête API
 * Utilise le cookie admin_token pour identifier l'utilisateur
 */
export async function verifyAuth(request: NextRequest): Promise<{ status: number; user?: Admin; error?: string }> {
    try {
        // Récupérer le cookie admin_token
        const authCookie = request.cookies.get('admin_token');
        
        if (!authCookie?.value) {
            console.warn('verifyAuth: No admin_token cookie found');
            return {
                status: 401,
                error: 'Session expirée ou non connecté. Veuillez vous reconnecter.',
            };
        }

        // Extraire l'ID utilisateur du cookie (format: admin-{userId})
        const userId = authCookie.value.replace('admin-', '');
        
        if (!userId || userId === authCookie.value) {
            console.warn('verifyAuth: Invalid token format', { cookieValue: authCookie.value.substring(0, 20) });
            return {
                status: 401,
                error: 'Token de session invalide. Veuillez vous reconnecter.',
            };
        }

        // Récupérer le profil utilisateur depuis la base de données
        // Utiliser supabaseAdmin avec service role key qui devrait bypasser RLS
        console.log('[verifyAuth] Attempting to fetch user profile', { 
            userId,
            supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...',
            hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY !== 'placeholder-service-role-key'
        });

        const { data: profile, error: profileError } = await supabaseAdmin
            .from('user_profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (profileError) {
            console.error('[verifyAuth] Database error - Full details:', { 
                error: profileError, 
                errorCode: profileError.code,
                errorMessage: profileError.message,
                errorDetails: profileError.details,
                errorHint: profileError.hint,
                userId,
                supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
                serviceRoleKeyLength: process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0,
                serviceRoleKeyPrefix: process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 20) || 'NOT_SET'
            });
            
            // Si l'erreur est "not found", c'est différent d'une erreur de connexion
            if (profileError.code === 'PGRST116') {
                console.warn('[verifyAuth] User profile not found in database', { userId });
                return {
                    status: 401,
                    error: 'Utilisateur non trouvé. Veuillez vous reconnecter.',
                };
            }
            
            // Si c'est une erreur de permission RLS
            if (profileError.code === '42501' || 
                profileError.message?.includes('permission denied') || 
                profileError.message?.includes('policy') ||
                profileError.message?.includes('new row violates row-level security')) {
                console.error('[verifyAuth] RLS Policy error detected');
                console.error('[verifyAuth] This usually means:');
                console.error('  1. The service role key is not correctly configured');
                console.error('  2. The RLS policies are blocking access');
                console.error('  3. The migration 010_fix_user_profiles_rls.sql has not been executed');
                return {
                    status: 500,
                    error: 'Erreur de permissions. Vérifiez que la clé service role Supabase est correctement configurée et que la migration RLS a été exécutée.',
                };
            }
            
            return {
                status: 500,
                error: 'Erreur de base de données lors de la vérification',
            };
        }

        console.log('[verifyAuth] User profile fetched successfully', { 
            userId: profile?.id, 
            email: profile?.email, 
            role: profile?.role,
            isActive: profile?.is_active 
        });

        if (!profile) {
            console.warn('verifyAuth: Profile not found', { userId });
            return {
                status: 401,
                error: 'Profil utilisateur non trouvé. Veuillez vous reconnecter.',
            };
        }

        // Vérifier que c'est un admin
        if (profile.role !== 'admin') {
            console.warn('verifyAuth: User is not admin', { userId, role: profile.role });
            return {
                status: 403,
                error: 'Accès refusé. Seuls les administrateurs peuvent accéder à cette fonctionnalité.',
            };
        }

        // Vérifier que le compte est actif
        if (!profile.is_active) {
            console.warn('verifyAuth: Account is inactive', { userId });
            return {
                status: 403,
                error: 'Votre compte a été désactivé. Contactez un administrateur.',
            };
        }

        const user: Admin = {
            id: profile.id,
            email: profile.email,
            name: profile.name,
            role: profile.role as 'admin',
            createdAt: profile.created_at,
            lastLogin: profile.last_login || undefined,
            permissions: Array.isArray(profile.permissions) ? profile.permissions : [],
        };

        return {
            status: 200,
            user,
        };
    } catch (error) {
        console.error('Error in verifyAuth:', error);
        return {
            status: 500,
            error: 'Erreur lors de la vérification de l\'authentification',
        };
    }
}

