import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyAuth } from '@/lib/auth';

/**
 * Route de diagnostic pour vérifier les sous-admins (admin uniquement)
 * GET /api/admin/subadmin/debug
 */
export async function GET(request: NextRequest) {
  try {
    // Vérifier l'authentification admin
    const authResult = await verifyAuth(request);
    if (authResult.status !== 200 || authResult.user?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Non autorisé. Admin uniquement.' },
        { status: 401 }
      );
    }

    // Récupérer tous les sous-admins
    const { data: subAdmins, error } = await supabaseAdmin
      .from('user_profiles')
      .select('id, email, name, role, subadmin_code, is_active, created_at')
      .eq('role', 'subadmin')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Erreur lors de la récupération des sous-admins:', error);
      return NextResponse.json(
        { error: 'Erreur lors de la récupération', details: error.message },
        { status: 500 }
      );
    }

    const allSubAdmins = subAdmins || [];
    const activeSubAdmins = allSubAdmins.filter(sa => sa.is_active);
    const inactiveSubAdmins = allSubAdmins.filter(sa => !sa.is_active);

    return NextResponse.json({
      success: true,
      summary: {
        total: allSubAdmins.length,
        active: activeSubAdmins.length,
        inactive: inactiveSubAdmins.length,
      },
      activeCodes: activeSubAdmins.map(sa => sa.subadmin_code).filter(Boolean),
      allCodes: allSubAdmins.map(sa => sa.subadmin_code).filter(Boolean),
      subAdmins: allSubAdmins.map(sa => ({
        code: sa.subadmin_code,
        name: sa.name,
        email: sa.email,
        isActive: sa.is_active,
        created: sa.created_at,
      })),
    });

  } catch (error: any) {
    console.error('❌ Erreur dans l\'API debug:', error);
    return NextResponse.json(
      { error: 'Erreur serveur', details: process.env.NODE_ENV === 'development' ? error.message : undefined },
      { status: 500 }
    );
  }
}

