import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * Route pour authentifier un sous-admin par code
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code } = body;
    
    if (!code) {
      return NextResponse.json(
        { error: 'Code requis' },
        { status: 400 }
      );
    }
    
    // Rechercher le sous-admin par code
    const { data: subAdmin, error } = await supabaseAdmin
      .from('user_profiles')
      .select('id, email, name, role, subadmin_code, is_active')
      .eq('subadmin_code', code)
      .eq('role', 'subadmin')
      .single();
    
    if (error || !subAdmin) {
      return NextResponse.json(
        { error: 'Code invalide ou sous-admin inactif' },
        { status: 404 }
      );
    }
    
    if (!subAdmin.is_active) {
      return NextResponse.json(
        { error: 'Ce sous-admin est désactivé' },
        { status: 403 }
      );
    }
    
    return NextResponse.json({
      success: true,
      subAdmin: {
        id: subAdmin.id,
        name: subAdmin.name,
        email: subAdmin.email,
        code: subAdmin.subadmin_code
      }
    });
    
  } catch (error) {
    console.error('Error authenticating subadmin:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

