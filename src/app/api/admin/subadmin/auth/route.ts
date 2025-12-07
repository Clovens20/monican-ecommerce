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
    
    // Normaliser le code (uppercase, trim des espaces)
    const normalizedCode = code.toString().trim().toUpperCase();
    
    console.log('🔍 Tentative de connexion avec le code:', normalizedCode);
    
    // Rechercher le sous-admin par code (insensible à la casse avec UPPER)
    const { data: subAdmins, error } = await supabaseAdmin
      .from('user_profiles')
      .select('id, email, name, role, subadmin_code, is_active')
      .eq('role', 'subadmin');
    
    if (error) {
      console.error('❌ Erreur lors de la recherche:', error);
      return NextResponse.json(
        { error: 'Erreur lors de la recherche du sous-admin', details: error.message },
        { status: 500 }
      );
    }
    
    // Trouver le sous-admin avec le code correspondant (insensible à la casse)
    const subAdmin = subAdmins?.find(
      (admin: any) => admin.subadmin_code && 
      admin.subadmin_code.toString().trim().toUpperCase() === normalizedCode
    );
    
    console.log('🔍 Sous-admins trouvés:', subAdmins?.length || 0);
    console.log('🔍 Sous-admin correspondant:', subAdmin ? 'OUI' : 'NON');
    
    if (!subAdmin) {
      // Vérifier tous les codes existants pour le diagnostic
      const allCodes = subAdmins?.map((a: any) => a.subadmin_code).filter(Boolean) || [];
      const activeCodes = subAdmins
        ?.filter((a: any) => a.is_active && a.subadmin_code)
        .map((a: any) => a.subadmin_code) || [];
      
      console.log('📋 Codes existants:', allCodes);
      console.log('✅ Codes actifs:', activeCodes);
      
      // Construire un message d'erreur plus utile
      let errorMessage = `Code invalide: "${normalizedCode}".`;
      
      if (activeCodes.length > 0) {
        const codesList = activeCodes.slice(0, 3).join(', ');
        errorMessage += ` Codes disponibles: ${codesList}${activeCodes.length > 3 ? '...' : ''}`;
      } else {
        errorMessage += ' Aucun sous-admin actif trouvé dans la base de données.';
      }
      
      return NextResponse.json(
        { 
          error: errorMessage,
          debug: process.env.NODE_ENV === 'development' ? {
            searchedCode: normalizedCode,
            totalSubAdmins: subAdmins?.length || 0,
            activeCodes: activeCodes.slice(0, 5),
            allCodes: allCodes.slice(0, 5)
          } : undefined
        },
        { status: 404 }
      );
    }
    
    if (!subAdmin.is_active) {
      return NextResponse.json(
        { error: 'Ce sous-admin est désactivé. Contactez un administrateur pour réactiver votre compte.' },
        { status: 403 }
      );
    }
    
    console.log('✅ Connexion réussie pour:', subAdmin.name);
    
    return NextResponse.json({
      success: true,
      subAdmin: {
        id: subAdmin.id,
        name: subAdmin.name,
        email: subAdmin.email,
        code: subAdmin.subadmin_code
      }
    });
    
  } catch (error: any) {
    console.error('❌ Erreur lors de l\'authentification:', error);
    return NextResponse.json(
      { error: 'Erreur serveur', details: process.env.NODE_ENV === 'development' ? error.message : undefined },
      { status: 500 }
    );
  }
}

