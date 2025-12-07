import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase';

const ChangePasswordSchema = z.object({
  email: z.string().email('Email invalide'),
  newPassword: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
});

/**
 * Route pour changer le mot de passe d'un admin
 * Nécessite l'email de l'admin et le nouveau mot de passe
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const validationResult = ChangePasswordSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const { email, newPassword } = validationResult.data;

    // Vérifier que l'utilisateur existe et est un admin
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('id, email, role')
      .eq('email', email)
      .in('role', ['admin', 'super_admin'])
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Admin non trouvé avec cet email' },
        { status: 404 }
      );
    }

    // Changer le mot de passe via Supabase Auth Admin API
    const { data: updateData, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      profile.id,
      {
        password: newPassword,
      }
    );

    if (updateError) {
      console.error('Error updating password:', updateError);
      return NextResponse.json(
        { error: 'Erreur lors de la mise à jour du mot de passe', details: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Mot de passe mis à jour avec succès',
      user: {
        id: profile.id,
        email: profile.email,
      },
    });

  } catch (error) {
    console.error('Error in change-password:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

