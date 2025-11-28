import { NextRequest, NextResponse } from 'next/server';
import { 
    ShippingAddress, 
    PackageDimensions, 
    getAllShippingOptions,
    calculatePackageDimensions,
    ShippingCalculatorConfig 
} from '@/lib/shipping-calculator';

/**
 * API Route pour calculer les frais de livraison avec USPS et FedEx
 * 
 * Cette route :
 * 1. Reçoit l'adresse de destination et les articles du panier
 * 2. Calcule les dimensions et poids du colis
 * 3. Appelle les APIs USPS et FedEx pour obtenir les tarifs
 * 4. Retourne toutes les options de livraison disponibles
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { 
            shippingAddress, 
            items 
        }: { 
            shippingAddress: ShippingAddress;
            items: Array<{ quantity: number; weight?: number }>;
        } = body;

        // Validation
        if (!shippingAddress || !items || items.length === 0) {
            return NextResponse.json(
                { error: 'Adresse de livraison et articles sont requis' },
                { status: 400 }
            );
        }

        // Validate shipping address
        if (!shippingAddress.street || !shippingAddress.city || !shippingAddress.state || !shippingAddress.zip) {
            return NextResponse.json(
                { error: 'Adresse de livraison incomplète' },
                { status: 400 }
            );
        }

        // Calculate package dimensions
        const packageDimensions = calculatePackageDimensions(items);

        // Get origin address from environment or use default
        const originAddress: ShippingAddress = {
            street: process.env.SHIPPING_ORIGIN_STREET || '123 Main St',
            city: process.env.SHIPPING_ORIGIN_CITY || 'New York',
            state: process.env.SHIPPING_ORIGIN_STATE || 'NY',
            zip: process.env.SHIPPING_ORIGIN_ZIP || '10001',
            country: (process.env.SHIPPING_ORIGIN_COUNTRY as 'US' | 'CA' | 'MX') || 'US',
        };

        // Shipping calculator configuration
        const config: ShippingCalculatorConfig = {
            originAddress,
            uspsUserId: process.env.USPS_USER_ID,
            fedExApiKey: process.env.FEDEX_API_KEY,
            fedExApiSecret: process.env.FEDEX_API_SECRET,
            fedExAccountNumber: process.env.FEDEX_ACCOUNT_NUMBER,
        };

        // Get all shipping options
        const shippingOptions = await getAllShippingOptions(
            shippingAddress,
            packageDimensions,
            config
        );

        // Convert costs to destination currency if needed
        const currency = shippingAddress.country === 'US' ? 'USD' : 
                        shippingAddress.country === 'CA' ? 'CAD' : 'MXN';
        
        const exchangeRates = {
            USD: 1,
            CAD: 1.35,
            MXN: 17.50,
        };

        const exchangeRate = exchangeRates[currency as keyof typeof exchangeRates] || 1;

        const optionsWithCurrency = shippingOptions.map(option => ({
            ...option,
            cost: option.cost * exchangeRate,
            currency,
        }));

        return NextResponse.json({
            success: true,
            options: optionsWithCurrency,
            packageDimensions,
        });

    } catch (error: any) {
        console.error('Error calculating shipping:', error);
        return NextResponse.json(
            { error: error.message || 'Erreur lors du calcul des frais de livraison' },
            { status: 500 }
        );
    }
}

