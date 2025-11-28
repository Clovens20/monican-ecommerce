import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { loginAdmin } from '@/lib/auth';

const LoginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(6, 'Mot de passe trop court'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const validationResult = LoginSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const { email, password } = validationResult.data;

    // Utiliser l'authentification Supabase
    const result = await loginAdmin({ email, password });

    if (!result.success || !result.user) {
      return NextResponse.json(
        { error: result.error || 'Identifiants invalides' },
        { status: 401 }
      );
    }

    const response = NextResponse.json({
      success: true,
      admin: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        role: result.user.role,
      }
    });

    // Cookie de session sécurisé
    response.cookies.set({
      name: 'admin_token',
      value: `admin-${result.user.id}`,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: parseInt(process.env.SESSION_MAX_AGE || '604800'), // 7 jours par défaut
      path: '/',
    });

    return response;

  } catch (error) {
    console.error('❌ Erreur serveur:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
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
