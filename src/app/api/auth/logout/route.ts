import { NextRequest, NextResponse } from 'next/server';
import { logout } from '@/lib/auth';

/**
 * Route API pour la déconnexion admin
 * POST /api/auth/logout
 */
export async function POST(request: NextRequest) {
  try {
    // Déconnexion de Supabase Auth si nécessaire
    try {
      await logout();
    } catch (error) {
      // Ignorer les erreurs de déconnexion Supabase (peut ne pas être utilisé)
      console.warn('Supabase logout error (ignored):', error);
    }

    const response = NextResponse.json({
      success: true,
      message: 'Déconnexion réussie',
    });

    // Supprimer le cookie admin_token
    response.cookies.set({
      name: 'admin_token',
      value: '',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0, // Expirer immédiatement
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('❌ Erreur lors de la déconnexion:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la déconnexion' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Méthode non autorisée' },
    { status: 405 }
  );
}

