import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { z } from 'zod';
import { refundPayment } from '@/lib/payments';

const RefundSchema = z.object({
  orderId: z.string().uuid(),
  returnIds: z.array(z.string()).optional(),
  items: z.array(z.object({
    id: z.string().optional(),
    productId: z.string().optional(),
    name: z.string(),
    quantity: z.number(),
    price: z.number(),
  })),
  refundAmount: z.number().min(0),
  refundMethod: z.enum(['original', 'manual']),
  currency: z.enum(['USD', 'CAD', 'MXN']),
});

/**
 * POST - Process un remboursement
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const validationResult = RefundSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const { orderId, returnIds, items, refundAmount, refundMethod, currency } = validationResult.data;

    // Récupérer la commande
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { error: 'Commande non trouvée' },
        { status: 404 }
      );
    }

    // Si refundMethod est 'original' et qu'il y a un payment_id, traiter le remboursement
    let refundTransactionId = null;
    if (refundMethod === 'original' && order.payment_id) {
      try {
        // Convertir le montant en centimes
        const amountInCents = Math.round(refundAmount * 100);
        
        const refundResult = await refundPayment({
          paymentId: order.payment_id,
          amount: amountInCents,
          reason: 'Product return',
        });

        if (!refundResult.success) {
          return NextResponse.json(
            { error: refundResult.error || 'Erreur lors du remboursement' },
            { status: 500 }
          );
        }

        refundTransactionId = refundResult.refundId || null;
      } catch (refundError: any) {
        console.error('Error processing refund:', refundError);
        return NextResponse.json(
          { error: 'Erreur lors du traitement du remboursement' },
          { status: 500 }
        );
      }
    }

    // Mettre à jour les retours associés
    if (returnIds && returnIds.length > 0) {
      const { error: updateError } = await supabaseAdmin
        .from('returns')
        .update({
          status: 'refunded',
          refund_amount: refundAmount,
          refund_method: refundMethod,
          refund_transaction_id: refundTransactionId,
          refunded_at: new Date().toISOString(),
          selected_items: items,
        })
        .in('id', returnIds);

      if (updateError) {
        console.error('Error updating returns:', updateError);
        // Ne pas faire échouer la requête si la mise à jour échoue
      }
    } else {
      // Créer un enregistrement de retour pour le remboursement
      const { error: insertError } = await supabaseAdmin
        .from('returns')
        .insert({
          order_id: orderId,
          return_label: `REFUND-${order.order_number}-${Date.now()}`,
          customer_email: order.customer_email,
          customer_name: order.customer_name,
          items: items,
          status: 'refunded',
          refund_amount: refundAmount,
          refund_method: refundMethod,
          refund_transaction_id: refundTransactionId,
          currency: currency,
          refunded_at: new Date().toISOString(),
          selected_items: items,
        });

      if (insertError) {
        console.error('Error creating return record:', insertError);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Remboursement effectué avec succès',
      refund: {
        amount: refundAmount,
        currency,
        method: refundMethod,
        transactionId: refundTransactionId,
        items: items.length,
      },
    });

  } catch (error) {
    console.error('Error in refund API:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

