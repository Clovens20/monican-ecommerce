import { NextRequest, NextResponse } from 'next/server';

/**
 * Génère l'URL OAuth Square côté serveur pour éviter les problèmes de configuration côté client.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Identifiant utilisateur manquant' },
        { status: 400 }
      );
    }

    const clientId =
      process.env.NEXT_PUBLIC_SQUARE_CLIENT_ID || process.env.SQUARE_CLIENT_ID;
    const redirectUri =
      process.env.NEXT_PUBLIC_SQUARE_REDIRECT_URI ||
      process.env.SQUARE_REDIRECT_URI ||
      'https://www.monican.shop/oauth/callback';

    if (!clientId) {
      console.error('Square Client ID not configured');
      return NextResponse.json(
        {
          success: false,
          error:
            'Square Client ID manquant. Vérifiez NEXT_PUBLIC_SQUARE_CLIENT_ID ou SQUARE_CLIENT_ID.',
        },
        { status: 500 }
      );
    }

    const scope = 'PAYMENTS_WRITE MERCHANT_PROFILE_READ';
    const state = `${userId}-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}`;

    const oauthUrl = `https://connect.squareup.com/oauth2/authorize?client_id=${clientId}&scope=${encodeURIComponent(
      scope
    )}&session=false&state=${encodeURIComponent(
      state
    )}&redirect_uri=${encodeURIComponent(redirectUri)}`;

    return NextResponse.json({
      success: true,
      url: oauthUrl,
      state,
    });
  } catch (error) {
    console.error('Error generating Square auth URL:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}


