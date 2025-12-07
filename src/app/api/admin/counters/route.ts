import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, safeQuery } from '@/lib/supabase';

/**
 * Route pour récupérer les compteurs en temps réel
 * Utilisé pour les badges dans le sidebar et les notifications
 * ✅ OPTIMISÉ: Utilise COUNT SQL au lieu de charger toutes les commandes
 */
export async function GET(request: NextRequest) {
  try {
    // Compter les commandes en attente avec COUNT SQL (optimisé)
    const { count: pendingOrdersCount, error: ordersError } = await supabaseAdmin
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    if (ordersError) {
      console.error('Error counting pending orders:', ordersError);
    }

    const pendingOrders = pendingOrdersCount || 0;

    // Compter les retours en attente avec COUNT SQL (optimisé)
    const { count: pendingReturnsCount, error: returnsError } = await supabaseAdmin
      .from('returns')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    if (returnsError) {
      console.error('Error counting pending returns:', returnsError);
    }

    const pendingReturns = pendingReturnsCount || 0;
    
    // Calculer le total des notifications
    // Notifications = commandes en attente + retours en attente
    const totalNotifications = pendingOrders + pendingReturns;
    
    return NextResponse.json({
      success: true,
      counters: {
        pendingOrders,
        pendingReturns,
        totalNotifications,
      }
    });
    
  } catch (error: any) {
    console.error('Error fetching counters:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Erreur lors de la récupération des compteurs',
        counters: {
          pendingOrders: 0,
          pendingReturns: 0,
          totalNotifications: 0,
        }
      },
      { status: 500 }
    );
  }
}

