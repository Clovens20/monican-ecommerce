import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2025-12-15.clover',
});

/**
 * GET - Récupère les détails d'un PaymentIntent
 */
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const paymentIntentId = searchParams.get('payment_intent');

        if (!paymentIntentId) {
            return NextResponse.json(
                { error: 'Payment intent ID is required' },
                { status: 400 }
            );
        }

        if (!process.env.STRIPE_SECRET_KEY) {
            return NextResponse.json(
                { error: 'Stripe not configured' },
                { status: 500 }
            );
        }

        // Récupérer le PaymentIntent
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

        return NextResponse.json({
            amount: paymentIntent.amount,
            currency: paymentIntent.currency,
            status: paymentIntent.status,
            email: paymentIntent.receipt_email || paymentIntent.metadata?.customerEmail || null,
        });
    } catch (error: any) {
        console.error('Error fetching payment details:', error);
        return NextResponse.json(
            { error: error.message || 'Error fetching payment details' },
            { status: 500 }
        );
    }
}

