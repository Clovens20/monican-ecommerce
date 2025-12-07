import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';

/**
 * Route pour récupérer l'utilisateur actuel
 */
export async function GET(request: NextRequest) {
    try {
        const authResult = await verifyAuth(request);
        
        if (authResult.status !== 200 || !authResult.user) {
            return NextResponse.json(
                { error: authResult.error || 'Non autorisé' },
                { status: authResult.status || 401 }
            );
        }

        return NextResponse.json(authResult.user);
    } catch (error) {
        console.error('Error in /api/admin/me:', error);
        return NextResponse.json(
            { error: 'Erreur serveur' },
            { status: 500 }
        );
    }
}
