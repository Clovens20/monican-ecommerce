// ============================================================================
// SUPABASE AUTHENTICATION HELPERS
// ============================================================================
// Fonctions utilitaires pour l'authentification sécurisée avec Supabase Auth
// ============================================================================

import { supabaseAdmin, supabase } from './supabase';
import { User, Admin, SubAdmin } from './types';

/**
 * Créer un utilisateur admin dans Supabase Auth
 * À utiliser uniquement côté serveur avec service role key
 */
export async function createAdminUser(email: string, password: string, name: string) {
  try {
    // Créer l'utilisateur dans Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirmer l'email pour les admins
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('Failed to create user');

    // Créer le profil utilisateur
    const { error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .insert({
        id: authData.user.id,
        email,
        name,
        role: 'admin',
      });

    if (profileError) {
      // Si le profil échoue, supprimer l'utilisateur auth
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      throw profileError;
    }

    return { user: authData.user, profile: { id: authData.user.id, email, name, role: 'admin' } };
  } catch (error) {
    console.error('Error creating admin user:', error);
    throw error;
  }
}

/**
 * Authentifier un utilisateur admin
 */
export async function signInAdmin(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    if (!data.user || !data.session) throw new Error('Authentication failed');

    // Récupérer le profil utilisateur
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (profileError) throw profileError;
    if (!profile || profile.role !== 'admin') {
      throw new Error('User is not an admin');
    }

    // Mettre à jour last_login
    await supabaseAdmin
      .from('user_profiles')
      .update({ last_login: new Date().toISOString() })
      .eq('id', data.user.id);

    return {
      user: data.user,
      session: data.session,
      profile: profile as Admin,
    };
  } catch (error) {
    console.error('Error signing in admin:', error);
    throw error;
  }
}

/**
 * Vérifier si un utilisateur est authentifié et est admin
 */
export async function verifyAdminSession(sessionToken: string): Promise<Admin | null> {
  try {
    // Vérifier la session avec Supabase
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(sessionToken);

    if (error || !user) return null;

    // Récupérer le profil
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !profile || profile.role !== 'admin') return null;

    return profile as Admin;
  } catch (error) {
    console.error('Error verifying admin session:', error);
    return null;
  }
}

/**
 * Authentifier un sous-admin par code
 */
export async function signInSubAdmin(code: string) {
  try {
    // Trouver le sous-admin par code
    const { data: subAdmin, error: subAdminError } = await supabaseAdmin
      .from('subadmins')
      .select(`
        *,
        user_profiles (*)
      `)
      .eq('code', code)
      .eq('is_active', true)
      .single();

    if (subAdminError || !subAdmin) {
      throw new Error('Invalid subadmin code');
    }

    // Mettre à jour last_login
    await supabaseAdmin
      .from('user_profiles')
      .update({ last_login: new Date().toISOString() })
      .eq('id', subAdmin.user_id);

    return {
      subAdmin: subAdmin as SubAdmin,
      profile: subAdmin.user_profiles,
    };
  } catch (error) {
    console.error('Error signing in subadmin:', error);
    throw error;
  }
}

/**
 * Déconnexion
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/**
 * Obtenir l'utilisateur actuel
 */
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return profile;
}

