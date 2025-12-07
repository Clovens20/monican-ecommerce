import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * GET - Récupère tous les abonnés à la newsletter (admin)
 */
export async function GET(request: NextRequest) {
  try {
    const { data, error } = await supabaseAdmin
      .from('newsletter_subscribers')
      .select('*')
      .order('subscribed_at', { ascending: false });

    if (error) {
      console.error('Error fetching newsletter subscribers:', error);
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des abonnés' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      subscribers: data || [],
    });

  } catch (error) {
    console.error('Error in newsletter subscribers GET API:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

