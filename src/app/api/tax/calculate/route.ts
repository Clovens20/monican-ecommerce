import { NextRequest, NextResponse } from 'next/server';
import { calculateTotalWithTax, CountryCode, CurrencyCode } from '@/lib/tax-calculator';

/**
 * API Route pour calculer les taxes selon le pays/état
 * 
 * Cette route :
 * 1. Reçoit le subtotal, shipping, country, state
 * 2. Calcule les taxes appropriées
 * 3. Retourne le montant des taxes et le total
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { 
            subtotal, 
            shipping, 
            country, 
            state,
            currency 
        }: { 
            subtotal: number;
            shipping: number;
            country: CountryCode;
            state?: string;
            currency?: CurrencyCode;
        } = body;

        // Validation
        if (subtotal === undefined || shipping === undefined || !country) {
            return NextResponse.json(
                { error: 'Subtotal, shipping et country sont requis' },
                { status: 400 }
            );
        }

        if (subtotal < 0 || shipping < 0) {
            return NextResponse.json(
                { error: 'Les montants doivent être positifs' },
                { status: 400 }
            );
        }

        // Calculer les taxes
        const result = calculateTotalWithTax(
            subtotal,
            shipping,
            country,
            state,
            currency || (country === 'US' ? 'USD' : country === 'CA' ? 'CAD' : 'MXN')
        );

        return NextResponse.json({
            success: true,
            ...result,
        });

    } catch (error: any) {
        console.error('Error calculating tax:', error);
        return NextResponse.json(
            { error: error.message || 'Erreur lors du calcul des taxes' },
            { status: 500 }
        );
    }
}

