import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * GET - Récupère un retour par ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data, error } = await supabaseAdmin
      .from('returns')
      .select(`
        *,
        orders!inner(
          order_number,
          customer_name,
          customer_email,
          items
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching return:', error);
      return NextResponse.json(
        { error: 'Erreur lors de la récupération du retour' },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Retour non trouvé' },
        { status: 404 }
      );
    }

    // Transformer les données
    const order = Array.isArray(data.orders) ? data.orders[0] : data.orders;
    const returnData = {
      ...data,
      order_number: order?.order_number || null,
    };

    return NextResponse.json({
      success: true,
      return: returnData,
    });

  } catch (error) {
    console.error('Error in return GET API:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

/**
 * PATCH - Met à jour un retour
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, admin_notes } = body;

    const updateData: any = {};

    if (status) {
      updateData.status = status;
      
      // Mettre à jour les dates selon le statut
      if (status === 'received') {
        updateData.received_at = new Date().toISOString();
      } else if (status === 'inspected') {
        updateData.inspected_at = new Date().toISOString();
      }
    }

    if (admin_notes !== undefined) {
      updateData.admin_notes = admin_notes;
    }

    const { data, error } = await supabaseAdmin
      .from('returns')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating return:', error);
      return NextResponse.json(
        { error: 'Erreur lors de la mise à jour' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      return: data,
    });

  } catch (error) {
    console.error('Error in return PATCH API:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

