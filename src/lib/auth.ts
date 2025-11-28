// ============================================================================
// AUTHENTICATION - Supabase Auth Integration
// ============================================================================

import { supabase, supabaseAdmin } from './supabase';
import { User, Admin } from './types';

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
        if (profile.role !== 'admin' && profile.role !== 'super_admin') {
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
    return user?.role === 'admin' || user?.role === 'super_admin';
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

