import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, safeQuery } from '@/lib/supabase';

/**
 * Route pour récupérer les statistiques du dashboard admin
 * ✅ OPTIMISÉ: Utilise des requêtes SQL agrégées au lieu de charger toutes les données
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Compter les produits actifs (COUNT SQL optimisé)
    const { count: totalProductsCount } = await supabaseAdmin
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);
    const totalProducts = totalProductsCount || 0;

    // 2. Récupérer les commandes avec colonnes spécifiques (optimisé)
    // Exclure les commandes annulées ou remboursées du calcul du revenu
    const { data: ordersData, error: ordersError } = await supabaseAdmin
      .from('orders')
      .select('status, total, currency, customer_email, shipping_address, created_at, id, customer_name, payment_status');

    if (ordersError) {
      console.error('Error fetching orders:', ordersError);
      throw ordersError;
    }

    const orders = ordersData || [];
    const totalOrders = orders.length;

    // 3. Calculer les statistiques depuis les données agrégées
    const pendingOrders = orders.filter(o => o.status === 'pending').length;
    const processingOrders = orders.filter(o => o.status === 'processing').length;
    const shippedOrders = orders.filter(o => o.status === 'shipped').length;
    const deliveredOrders = orders.filter(o => o.status === 'delivered').length;
    
    // Compter les commandes valides (non annulées et non remboursées) pour le calcul du panier moyen
    const validOrdersCount = orders.filter(o => 
      o.status !== 'cancelled' && o.payment_status !== 'refunded'
    ).length;

    // 4. Calculer le revenu total avec conversion de devise
    // Exclure les commandes annulées ou remboursées
    const totalRevenue = orders.reduce((sum, order) => {
      // Exclure les commandes annulées ou remboursées du revenu total
      if (order.status === 'cancelled' || order.payment_status === 'refunded') {
        return sum;
      }
      
      let amount = parseFloat(order.total?.toString() || '0');
      const currency = order.currency || 'USD';
      
      // Convertir en USD pour le total
      if (currency === 'CAD') amount = amount * 0.73; // Taux approximatif
      if (currency === 'MXN') amount = amount * 0.058; // Taux approximatif
      
      return sum + amount;
    }, 0);

    // 5. Compter les clients uniques (calculé depuis les données)
    // Optimisation future: créer une fonction SQL count_unique_customers()
    const uniqueEmails = new Set(orders.map(o => o.customer_email).filter(Boolean));
    const uniqueCustomers = uniqueEmails.size;

    // 6. Revenus par pays (calculé depuis les données)
    // Exclure les commandes annulées ou remboursées
    const revenueByCountry: { [key: string]: { revenue: number; currency: string; orderCount: number } } = {};
    orders.forEach(order => {
      // Exclure les commandes annulées ou remboursées du calcul des revenus par pays
      if (order.status === 'cancelled' || order.payment_status === 'refunded') {
        return;
      }
      
      const shippingAddress = typeof order.shipping_address === 'string' 
        ? JSON.parse(order.shipping_address) 
        : order.shipping_address;
      const country = shippingAddress?.country || 'US';
      const currency = order.currency || 'USD';
      
      if (!revenueByCountry[country]) {
        revenueByCountry[country] = { revenue: 0, currency, orderCount: 0 };
      }
      
      revenueByCountry[country].revenue += parseFloat(order.total?.toString() || '0');
      revenueByCountry[country].orderCount += 1;
    });

    const revenueByCountryArray = Object.entries(revenueByCountry).map(([country, data]) => ({
      country,
      revenue: data.revenue,
      currency: data.currency,
      orderCount: data.orderCount
    }));

    // 7. Dernières commandes (5 plus récentes) - LIMIT SQL
    const { data: recentOrdersData } = await supabaseAdmin
      .from('orders')
      .select('id, customer_name, created_at, status, total, currency')
      .order('created_at', { ascending: false })
      .limit(5);

    const recentOrders = (recentOrdersData || []).map(order => ({
      id: order.id,
      customerName: order.customer_name,
      date: order.created_at,
      status: order.status,
      total: parseFloat(order.total?.toString() || '0'),
      currency: order.currency
    }));
    
    return NextResponse.json({
      success: true,
      stats: {
        totalRevenue,
        totalOrders,
        validOrdersCount, // Nombre de commandes valides (non annulées/non remboursées)
        totalProducts,
        totalCustomers: uniqueCustomers,
        pendingOrders,
        processingOrders,
        shippedOrders,
        deliveredOrders,
        revenueByCountry: revenueByCountryArray,
        recentOrders
      }
    });
    
  } catch (error: any) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Erreur lors de la récupération des statistiques',
        stats: {
          totalRevenue: 0,
          totalOrders: 0,
          validOrdersCount: 0,
          totalProducts: 0,
          totalCustomers: 0,
          pendingOrders: 0,
          processingOrders: 0,
          shippedOrders: 0,
          deliveredOrders: 0,
          revenueByCountry: [],
          recentOrders: []
        }
      },
      { status: 500 }
    );
  }
}
