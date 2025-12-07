import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * PATCH - Met à jour le statut d'un abonné
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    if (!status || !['active', 'unsubscribed', 'bounced'].includes(status)) {
      return NextResponse.json(
        { error: 'Statut invalide' },
        { status: 400 }
      );
    }

    const updateData: any = {
      status,
    };

    if (status === 'unsubscribed') {
      updateData.unsubscribed_at = new Date().toISOString();
    } else if (status === 'active') {
      updateData.unsubscribed_at = null;
      updateData.subscribed_at = new Date().toISOString();
    }

    const { data, error } = await supabaseAdmin
      .from('newsletter_subscribers')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating subscriber status:', error);
      return NextResponse.json(
        { error: 'Erreur lors de la mise à jour' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      subscriber: data,
    });

  } catch (error) {
    console.error('Error in update subscriber status API:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

