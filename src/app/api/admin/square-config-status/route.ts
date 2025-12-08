import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';

/**
 * GET - Vérifie si Square est configuré via les variables d'environnement
 */
export async function GET(request: NextRequest) {
  try {
    // Vérifier l'authentification admin
    const authResult = await verifyAuth(request);
    if (authResult.status !== 200 || authResult.user?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    // Vérifier si les variables d'environnement Square sont configurées
    const squareAccessToken = process.env.SQUARE_ACCESS_TOKEN;
    const squareLocationId = process.env.SQUARE_LOCATION_ID;
    const squareEnvironment = process.env.SQUARE_ENVIRONMENT || 'sandbox';

    const configured = !!(squareAccessToken && squareLocationId);

    return NextResponse.json({
      success: true,
      configured,
      environment: squareEnvironment,
      hasAccessToken: !!squareAccessToken,
      hasLocationId: !!squareLocationId,
    });
  } catch (error) {
    console.error('Error checking Square config status:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

