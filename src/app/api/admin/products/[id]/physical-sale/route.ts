import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyAuth } from '@/lib/auth';
import { z } from 'zod';

const PhysicalSaleSchema = z.object({
  quantity: z.number().int().min(1, 'La quantité doit être au moins 1'),
  size: z.string().optional(),
  color: z.string().optional(),
});

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

    const { quantity, size, color } = validationResult.data;

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
    const totalAmount = unitPrice * quantity;

    // Si une taille et/ou couleur sont spécifiées, déduire du stock spécifique
    if (size || color) {
      // Construire la requête pour trouver l'entrée d'inventaire
      let inventoryQuery = supabaseAdmin
        .from('inventory')
        .select('id, stock_quantity, reserved_quantity, size, color')
        .eq('product_id', id);

      if (size) {
        inventoryQuery = inventoryQuery.eq('size', size);
      }
      if (color) {
        inventoryQuery = inventoryQuery.eq('color', color);
      }

      const { data: inventoryEntries, error: inventoryError } = await inventoryQuery;

      if (inventoryError) {
        console.error('Error fetching inventory:', inventoryError);
        return NextResponse.json(
          { error: 'Erreur lors de la récupération de l\'inventaire' },
          { status: 500 }
        );
      }

      if (!inventoryEntries || inventoryEntries.length === 0) {
        return NextResponse.json(
          { error: 'Aucune entrée d\'inventaire trouvée pour cette taille/couleur' },
          { status: 400 }
        );
      }

      // Si plusieurs entrées (différentes couleurs pour la même taille), prendre la première disponible
      const inventoryEntry = inventoryEntries[0];
      const availableStock = inventoryEntry.stock_quantity - (inventoryEntry.reserved_quantity || 0);

      if (availableStock < quantity) {
        return NextResponse.json(
          { 
            error: `Stock insuffisant. Stock disponible: ${availableStock}, Quantité demandée: ${quantity}`,
            availableStock 
          },
          { status: 400 }
        );
      }

      // Déduire le stock
      const newStock = inventoryEntry.stock_quantity - quantity;
      const { error: updateError } = await supabaseAdmin
        .from('inventory')
        .update({ 
          stock_quantity: Math.max(0, newStock),
          updated_at: new Date().toISOString()
        })
        .eq('id', inventoryEntry.id);

      if (updateError) {
        console.error('Error updating inventory:', updateError);
        return NextResponse.json(
          { error: 'Erreur lors de la mise à jour du stock' },
          { status: 500 }
        );
      }

      // Enregistrer la vente physique dans la table
      const { error: saleError } = await supabaseAdmin
        .from('physical_sales')
        .insert({
          product_id: id,
          product_name: product.name,
          quantity: quantity,
          size: size || inventoryEntry.size || null,
          color: color || inventoryEntry.color || null,
          unit_price: unitPrice,
          total_amount: totalAmount,
          sold_by: authResult.user?.id || null,
        });

      if (saleError) {
        console.error('Error recording physical sale:', saleError);
        // Ne pas faire échouer la vente si l'enregistrement échoue, mais logger l'erreur
      }

      return NextResponse.json({
        success: true,
        message: `Vente physique enregistrée: ${quantity} unité(s) vendue(s)`,
        productName: product.name,
        size: size || inventoryEntry.size,
        color: color || inventoryEntry.color,
        quantitySold: quantity,
        remainingStock: Math.max(0, newStock),
        totalAmount: totalAmount,
      });
    } else {
      // Si pas de taille/couleur spécifiée, déduire du stock total (répartir sur toutes les entrées)
      const { data: allInventoryEntries, error: allInventoryError } = await supabaseAdmin
        .from('inventory')
        .select('id, stock_quantity, reserved_quantity, size, color')
        .eq('product_id', id)
        .order('stock_quantity', { ascending: false });

      if (allInventoryError) {
        console.error('Error fetching inventory:', allInventoryError);
        return NextResponse.json(
          { error: 'Erreur lors de la récupération de l\'inventaire' },
          { status: 500 }
        );
      }

      if (!allInventoryEntries || allInventoryEntries.length === 0) {
        return NextResponse.json(
          { error: 'Aucune entrée d\'inventaire trouvée pour ce produit' },
          { status: 400 }
        );
      }

      // Calculer le stock total disponible
      const totalAvailableStock = allInventoryEntries.reduce((sum, entry) => {
        return sum + (entry.stock_quantity - (entry.reserved_quantity || 0));
      }, 0);

      if (totalAvailableStock < quantity) {
        return NextResponse.json(
          { 
            error: `Stock insuffisant. Stock total disponible: ${totalAvailableStock}, Quantité demandée: ${quantity}`,
            availableStock: totalAvailableStock 
          },
          { status: 400 }
        );
      }

      // Déduire proportionnellement ou depuis les entrées avec le plus de stock
      let remainingQuantity = quantity;
      const updates: Array<{ id: string; newStock: number; size: string; color: string | null }> = [];

      for (const entry of allInventoryEntries) {
        if (remainingQuantity <= 0) break;

        const availableStock = entry.stock_quantity - (entry.reserved_quantity || 0);
        if (availableStock <= 0) continue;

        const toDeduct = Math.min(remainingQuantity, availableStock);
        const newStock = entry.stock_quantity - toDeduct;
        
        updates.push({
          id: entry.id,
          newStock: Math.max(0, newStock),
          size: entry.size,
          color: entry.color,
        });

        remainingQuantity -= toDeduct;
      }

      // Appliquer toutes les mises à jour
      for (const update of updates) {
        const { error: updateError } = await supabaseAdmin
          .from('inventory')
          .update({ 
            stock_quantity: update.newStock,
            updated_at: new Date().toISOString()
          })
          .eq('id', update.id);

        if (updateError) {
          console.error('Error updating inventory entry:', updateError);
        }
      }

      // Enregistrer la vente physique dans la table
      // Si plusieurs tailles/couleurs, on enregistre une seule vente avec les détails
      const { error: saleError } = await supabaseAdmin
        .from('physical_sales')
        .insert({
          product_id: id,
          product_name: product.name,
          quantity: quantity,
          size: updates.length === 1 ? updates[0].size : null, // Si une seule taille, l'enregistrer
          color: updates.length === 1 && updates[0].color ? updates[0].color : null, // Si une seule couleur, l'enregistrer
          unit_price: unitPrice,
          total_amount: totalAmount,
          sold_by: authResult.user?.id || null,
          notes: updates.length > 1 
            ? `Vente répartie sur ${updates.length} variante(s): ${updates.map(u => `${u.size}${u.color ? ` (${u.color})` : ''}`).join(', ')}`
            : null,
        });

      if (saleError) {
        console.error('Error recording physical sale:', saleError);
        // Ne pas faire échouer la vente si l'enregistrement échoue, mais logger l'erreur
      }

      return NextResponse.json({
        success: true,
        message: `Vente physique enregistrée: ${quantity} unité(s) vendue(s)`,
        productName: product.name,
        quantitySold: quantity,
        totalAmount: totalAmount,
        updates: updates.map(u => ({
          size: u.size,
          color: u.color,
          remainingStock: u.newStock,
        })),
      });
    }

  } catch (error: any) {
    console.error('Error recording physical sale:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de l\'enregistrement de la vente physique' },
      { status: 500 }
    );
  }
}

