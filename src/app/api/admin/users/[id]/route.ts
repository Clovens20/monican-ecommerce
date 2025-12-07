import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyAuth } from '@/lib/auth';

/**
 * DELETE - Supprime un sous-admin (soft delete ou hard delete)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Vérifier l'authentification admin
    const authResult = await verifyAuth(request);
    if (authResult.status !== 200 || authResult.user?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Non autorisé. Seuls les administrateurs peuvent supprimer des sous-admins.' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Vérifier que l'utilisateur à supprimer existe et est un sous-admin
    const { data: userToDelete, error: fetchError } = await supabaseAdmin
      .from('user_profiles')
      .select('id, role, email, name, subadmin_code')
      .eq('id', id)
      .single();

    if (fetchError || !userToDelete) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    // Empêcher la suppression d'un admin
    if (userToDelete.role === 'admin') {
      return NextResponse.json(
        { error: 'Impossible de supprimer un administrateur. Vous pouvez seulement désactiver son compte.' },
        { status: 403 }
      );
    }

    // Empêcher l'auto-suppression
    if (userToDelete.id === authResult.user.id) {
      return NextResponse.json(
        { error: 'Vous ne pouvez pas supprimer votre propre compte' },
        { status: 403 }
      );
    }

    console.log(`🗑️ Suppression du sous-admin: ${userToDelete.name} (${userToDelete.subadmin_code})`);

    // Supprimer l'utilisateur Auth de Supabase (supprime aussi le profil via cascade)
    const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(id);

    if (deleteAuthError) {
      console.error('Error deleting auth user:', deleteAuthError);
      
      // Si la suppression de l'auth échoue, faire un soft delete (désactiver)
      const { error: softDeleteError } = await supabaseAdmin
        .from('user_profiles')
        .update({ 
          is_active: false,
          subadmin_code: null, // Retirer le code pour qu'il ne puisse plus se connecter
        })
        .eq('id', id);

      if (softDeleteError) {
        console.error('Error doing soft delete:', softDeleteError);
        return NextResponse.json(
          { error: 'Erreur lors de la suppression. Tentative de désactivation échouée.' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Le sous-admin a été désactivé (suppression partielle). Le compte auth n\'a pas pu être supprimé.',
        warning: true
      });
    }

    // La suppression du profil user_profiles se fait automatiquement via CASCADE
    // Vérifier que le profil a bien été supprimé
    const { data: verifyDelete } = await supabaseAdmin
      .from('user_profiles')
      .select('id')
      .eq('id', id)
      .single();

    if (verifyDelete) {
      // Si le profil existe encore, le supprimer manuellement
      const { error: deleteProfileError } = await supabaseAdmin
        .from('user_profiles')
        .delete()
        .eq('id', id);

      if (deleteProfileError) {
        console.error('Error deleting profile manually:', deleteProfileError);
        return NextResponse.json(
          { error: 'Erreur lors de la suppression complète du profil' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: `Sous-admin "${userToDelete.name}" (${userToDelete.subadmin_code}) supprimé avec succès`,
    });

  } catch (error: any) {
    console.error('Error in DELETE /api/admin/users/[id]:', error);
    return NextResponse.json(
      { error: 'Erreur serveur', details: process.env.NODE_ENV === 'development' ? error.message : undefined },
      { status: 500 }
    );
  }
}

