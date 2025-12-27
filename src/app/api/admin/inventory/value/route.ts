import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyAuth } from '@/lib/auth';

/**
 * Route pour calculer la valeur totale de l'inventaire
 * GET /api/admin/inventory/value
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request);
    if (authResult.status !== 200 || authResult.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Récupérer tous les produits actifs
    const { data: productsData, error: productsError } = await supabaseAdmin
      .from('products')
      .select('id, name, price, category')
      .eq('is_active', true);

    if (productsError) {
      console.error('Error fetching products:', productsError);
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des produits' },
        { status: 500 }
      );
    }

    if (!productsData || productsData.length === 0) {
      return NextResponse.json({
        success: true,
        summary: {
          totalValue: 0,
          totalItems: 0,
          totalProducts: 0,
        },
        products: [],
      });
    }

    // Récupérer l'inventaire pour tous les produits
    const productIds = productsData.map(p => p.id);
    const { data: inventoryData, error: inventoryError } = await supabaseAdmin
      .from('inventory')
      .select('product_id, stock_quantity, reserved_quantity')
      .in('product_id', productIds);

    if (inventoryError) {
      console.error('Error fetching inventory:', inventoryError);
      return NextResponse.json(
        { error: 'Erreur lors de la récupération de l\'inventaire' },
        { status: 500 }
      );
    }

    // Calculer la valeur totale
    let totalValue = 0;
    let totalItems = 0;
    const productsValue: Array<{
      productId: string;
      productName: string;
      category: string;
      price: number;
      stock: number;
      reserved: number;
      available: number;
      value: number;
    }> = [];

    // Créer un map des produits pour accès rapide
    const productsMap = new Map(productsData.map(p => [p.id, p]));

    // Grouper l'inventaire par produit
    const productMap = new Map<string, {
      productId: string;
      productName: string;
      category: string;
      price: number;
      totalStock: number;
      totalReserved: number;
    }>();

    // Initialiser tous les produits avec 0 stock
    productsData.forEach(product => {
      productMap.set(product.id, {
        productId: product.id,
        productName: product.name,
        category: product.category,
        price: parseFloat(product.price.toString()),
        totalStock: 0,
        totalReserved: 0,
      });
    });

    // Agréger le stock par produit
    inventoryData?.forEach((item: any) => {
      const product = productsMap.get(item.product_id);
      if (!product) return;

      const stockQty = item.stock_quantity || 0;
      const reservedQty = item.reserved_quantity || 0;

      const existing = productMap.get(item.product_id);
      if (existing) {
        existing.totalStock += stockQty;
        existing.totalReserved += reservedQty;
      }
    });

    // Calculer la valeur pour chaque produit
    productMap.forEach((product) => {
      const availableStock = product.totalStock - product.totalReserved;
      const productValue = product.price * availableStock;
      
      totalValue += productValue;
      totalItems += availableStock;

      productsValue.push({
        productId: product.productId,
        productName: product.productName,
        category: product.category,
        price: product.price,
        stock: product.totalStock,
        reserved: product.totalReserved,
        available: availableStock,
        value: productValue,
      });
    });

    // Trier par valeur décroissante
    productsValue.sort((a, b) => b.value - a.value);

    return NextResponse.json({
      success: true,
      summary: {
        totalValue: totalValue,
        totalItems: totalItems,
        totalProducts: productMap.size,
      },
      products: productsValue,
    });

  } catch (error: any) {
    console.error('Error calculating inventory value:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors du calcul de la valeur de l\'inventaire' },
      { status: 500 }
    );
  }
}

