import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * GET - Récupère tous les retours ou filtre par orderId (admin)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');

    let query = supabaseAdmin
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
      .order('created_at', { ascending: false });

    if (orderId) {
      query = query.eq('order_id', orderId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching returns:', error);
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des retours' },
        { status: 500 }
      );
    }

    // Transformer les données pour inclure order_number
    const returnsWithOrderNumber = (data || []).map((returnItem: any) => {
      const order = Array.isArray(returnItem.orders) ? returnItem.orders[0] : returnItem.orders;
      return {
        ...returnItem,
        order_number: order?.order_number || null,
      };
    });

    return NextResponse.json({
      success: true,
      returns: returnsWithOrderNumber,
    });

  } catch (error) {
    console.error('Error in returns GET API:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
