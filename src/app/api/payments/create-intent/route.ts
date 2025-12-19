import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2025-12-15.clover',
});

/**
 * POST - Crée un PaymentIntent Stripe
 */
export async function POST(request: NextRequest) {
    try {
        const { amount, currency } = await request.json();

        if (!amount || !currency) {
            return NextResponse.json(
                { error: 'Amount and currency are required' },
                { status: 400 }
            );
        }

        if (!process.env.STRIPE_SECRET_KEY) {
            return NextResponse.json(
                { error: 'Stripe not configured' },
                { status: 500 }
            );
        }

        // Créer le PaymentIntent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount), // S'assurer que c'est un entier
            currency: currency.toLowerCase(),
            automatic_payment_methods: {
                enabled: true,
            },
        });

        return NextResponse.json({
            clientSecret: paymentIntent.client_secret,
        });
    } catch (error: any) {
        console.error('Error creating PaymentIntent:', error);
        return NextResponse.json(
            { error: error.message || 'Error creating payment intent' },
            { status: 500 }
        );
    }
}

