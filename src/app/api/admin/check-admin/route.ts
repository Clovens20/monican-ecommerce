import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * Route pour vérifier s'il y a un admin existant
 */
export async function GET(request: NextRequest) {
  try {
    // Récupérer tous les admins
    const { data: admins, error } = await supabaseAdmin
      .from('user_profiles')
      .select('id, email, name, role, is_active, created_at')
      .in('role', ['admin', 'super_admin'])
      .eq('is_active', true);

    if (error) {
      console.error('Error checking admins:', error);
      return NextResponse.json(
        { error: 'Erreur lors de la vérification des admins' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      hasAdmin: (admins && admins.length > 0),
      admins: admins || [],
      count: admins?.length || 0,
    });

  } catch (error) {
    console.error('Error in check-admin:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

