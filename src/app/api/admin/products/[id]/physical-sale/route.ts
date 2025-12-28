import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyAuth } from '@/lib/auth';
import { z } from 'zod';

const PhysicalSaleItemSchema = z.object({
  size: z.string().min(1, 'La taille est requise'),
  quantity: z.number().int().min(1, 'La quantité doit être au moins 1'),
});

const PhysicalSaleSchema = z.object({
  items: z.array(PhysicalSaleItemSchema).min(1, 'Au moins un item est requis'),
  color: z.string().optional(),
}).or(z.object({
  quantity: z.number().int().min(1, 'La quantité doit être au moins 1'),
  size: z.string().optional(),
  color: z.string().optional(),
}));

/**
 * Route pour enregistrer une vente physique et déduire le stock
 * POST /api/admin/products/[id]/physical-sale
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await verifyAuth(request);
    if (authResult.status !== 200 || authResult.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    // Valider les données
    const validationResult = PhysicalSaleSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    // Récupérer le produit pour vérifier qu'il existe et obtenir le prix
    const { data: product, error: productError } = await supabaseAdmin
      .from('products')
      .select('id, name, price')
      .eq('id', id)
      .single();

    if (productError || !product) {
      return NextResponse.json(
        { error: 'Produit non trouvé' },
        { status: 404 }
      );
    }

    const unitPrice = parseFloat(product.price?.toString() || '0');

    // Gérer le nouveau format avec items ou l'ancien format pour rétrocompatibilité
    let items: Array<{ size: string; quantity: number }> = [];
    let color: string | undefined = undefined;

    if ('items' in validationResult.data) {
      items = validationResult.data.items;
      color = validationResult.data.color;
    } else {
      // Ancien format pour rétrocompatibilité
      const { quantity, size, color: oldColor } = validationResult.data;
      if (size) {
        items = [{ size, quantity }];
      } else {
        // Si pas de taille spécifiée, on traitera cela plus tard
        items = [{ size: '', quantity }];
      }
      color = oldColor;
    }

    // Traiter chaque item (taille + quantité)
    const processedItems: Array<{ size: string; quantity: number; remainingStock: number }> = [];
    const salesRecords: Array<any> = [];
    let totalQuantity = 0;
    let totalAmount = 0;

    for (const item of items) {
      if (!item.size) {
        return NextResponse.json(
          { error: 'Toutes les tailles doivent être spécifiées' },
          { status: 400 }
        );
      }

      // Récupérer l'inventaire pour cette taille et couleur
      let inventoryQuery = supabaseAdmin
        .from('inventory')
        .select('id, stock_quantity, reserved_quantity, size, color')
        .eq('product_id', id)
        .eq('size', item.size);

      if (color) {
        inventoryQuery = inventoryQuery.eq('color', color);
      }

      const { data: inventoryEntries, error: inventoryError } = await inventoryQuery;

      if (inventoryError) {
        console.error('Error fetching inventory:', inventoryError);
        return NextResponse.json(
          { error: `Erreur lors de la récupération de l'inventaire pour la taille ${item.size}` },
          { status: 500 }
        );
      }

      if (!inventoryEntries || inventoryEntries.length === 0) {
        return NextResponse.json(
          { error: `Aucune entrée d'inventaire trouvée pour la taille ${item.size}${color ? ` et la couleur ${color}` : ''}` },
          { status: 400 }
        );
      }

      // Calculer le stock disponible pour cette taille
      const availableStock = inventoryEntries.reduce((sum, entry) => {
        return sum + (entry.stock_quantity - (entry.reserved_quantity || 0));
      }, 0);

      if (availableStock < item.quantity) {
        return NextResponse.json(
          { 
            error: `Stock insuffisant pour la taille ${item.size}. Stock disponible: ${availableStock}, Quantité demandée: ${item.quantity}`,
            size: item.size,
            availableStock 
          },
          { status: 400 }
        );
      }

      // Déduire le stock de chaque entrée d'inventaire pour cette taille
      let remainingQuantity = item.quantity;
      for (const entry of inventoryEntries) {
        if (remainingQuantity <= 0) break;

        const entryAvailableStock = entry.stock_quantity - (entry.reserved_quantity || 0);
        if (entryAvailableStock <= 0) continue;

        const toDeduct = Math.min(remainingQuantity, entryAvailableStock);
        const newStock = entry.stock_quantity - toDeduct;

        const { error: updateError } = await supabaseAdmin
          .from('inventory')
          .update({ 
            stock_quantity: Math.max(0, newStock),
            updated_at: new Date().toISOString()
          })
          .eq('id', entry.id);

        if (updateError) {
          console.error('Error updating inventory:', updateError);
          return NextResponse.json(
            { error: `Erreur lors de la mise à jour du stock pour la taille ${item.size}` },
            { status: 500 }
          );
        }

        remainingQuantity -= toDeduct;
      }

      const finalStock = availableStock - item.quantity;
      processedItems.push({
        size: item.size,
        quantity: item.quantity,
        remainingStock: Math.max(0, finalStock),
      });

      totalQuantity += item.quantity;
      totalAmount += unitPrice * item.quantity;

      // Enregistrer chaque vente dans physical_sales
      const { error: saleError } = await supabaseAdmin
        .from('physical_sales')
        .insert({
          product_id: id,
          product_name: product.name,
          quantity: item.quantity,
          size: item.size,
          color: color || inventoryEntries[0].color || null,
          unit_price: unitPrice,
          total_amount: unitPrice * item.quantity,
          sold_by: authResult.user?.id || null,
        });

      if (saleError) {
        console.error('Error recording physical sale:', saleError);
      } else {
        salesRecords.push({ size: item.size, quantity: item.quantity });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Vente physique enregistrée: ${totalQuantity} unité(s) vendue(s)`,
      productName: product.name,
      items: processedItems,
      totalQuantity,
      totalAmount,
      salesRecords,
    });

  } catch (error: any) {
    console.error('Error recording physical sale:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de l\'enregistrement de la vente physique' },
      { status: 500 }
    );
  }
}

