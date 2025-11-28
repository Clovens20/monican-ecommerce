/**
 * Tax Calculator - Calcul des taxes selon le pays/état/province
 * 
 * Ce module calcule les taxes de vente selon la localisation du client
 */

export type CountryCode = 'US' | 'CA' | 'MX';
export type CurrencyCode = 'USD' | 'CAD' | 'MXN';

export interface TaxRate {
    country: CountryCode;
    state?: string; // État/Province (pour US et CA)
    rate: number; // Taux en pourcentage (ex: 8.5 pour 8.5%)
    name: string; // Nom de la taxe (ex: "Sales Tax", "GST", "IVA")
}

/**
 * Taux de taxes par pays/état/province
 * 
 * Note: Ces taux sont des exemples. En production, vous devriez :
 * 1. Utiliser une API de calcul de taxes (comme TaxJar, Avalara)
 * 2. Mettre à jour régulièrement les taux
 * 3. Gérer les exemptions et règles spéciales
 */
const taxRates: TaxRate[] = [
    // États-Unis - Sales Tax par état
    { country: 'US', state: 'AL', rate: 4.0, name: 'Sales Tax' },
    { country: 'US', state: 'AK', rate: 0.0, name: 'Sales Tax' }, // Pas de sales tax
    { country: 'US', state: 'AZ', rate: 5.6, name: 'Sales Tax' },
    { country: 'US', state: 'AR', rate: 6.5, name: 'Sales Tax' },
    { country: 'US', state: 'CA', rate: 7.25, name: 'Sales Tax' },
    { country: 'US', state: 'CO', rate: 2.9, name: 'Sales Tax' },
    { country: 'US', state: 'CT', rate: 6.35, name: 'Sales Tax' },
    { country: 'US', state: 'DE', rate: 0.0, name: 'Sales Tax' }, // Pas de sales tax
    { country: 'US', state: 'FL', rate: 6.0, name: 'Sales Tax' },
    { country: 'US', state: 'GA', rate: 4.0, name: 'Sales Tax' },
    { country: 'US', state: 'HI', rate: 4.17, name: 'Sales Tax' },
    { country: 'US', state: 'ID', rate: 6.0, name: 'Sales Tax' },
    { country: 'US', state: 'IL', rate: 6.25, name: 'Sales Tax' },
    { country: 'US', state: 'IN', rate: 7.0, name: 'Sales Tax' },
    { country: 'US', state: 'IA', rate: 6.0, name: 'Sales Tax' },
    { country: 'US', state: 'KS', rate: 6.5, name: 'Sales Tax' },
    { country: 'US', state: 'KY', rate: 6.0, name: 'Sales Tax' },
    { country: 'US', state: 'LA', rate: 4.45, name: 'Sales Tax' },
    { country: 'US', state: 'ME', rate: 5.5, name: 'Sales Tax' },
    { country: 'US', state: 'MD', rate: 6.0, name: 'Sales Tax' },
    { country: 'US', state: 'MA', rate: 6.25, name: 'Sales Tax' },
    { country: 'US', state: 'MI', rate: 6.0, name: 'Sales Tax' },
    { country: 'US', state: 'MN', rate: 6.875, name: 'Sales Tax' },
    { country: 'US', state: 'MS', rate: 7.0, name: 'Sales Tax' },
    { country: 'US', state: 'MO', rate: 4.225, name: 'Sales Tax' },
    { country: 'US', state: 'MT', rate: 0.0, name: 'Sales Tax' }, // Pas de sales tax
    { country: 'US', state: 'NE', rate: 5.5, name: 'Sales Tax' },
    { country: 'US', state: 'NV', rate: 6.85, name: 'Sales Tax' },
    { country: 'US', state: 'NH', rate: 0.0, name: 'Sales Tax' }, // Pas de sales tax
    { country: 'US', state: 'NJ', rate: 6.625, name: 'Sales Tax' },
    { country: 'US', state: 'NM', rate: 5.125, name: 'Sales Tax' },
    { country: 'US', state: 'NY', rate: 4.0, name: 'Sales Tax' },
    { country: 'US', state: 'NC', rate: 4.75, name: 'Sales Tax' },
    { country: 'US', state: 'ND', rate: 5.0, name: 'Sales Tax' },
    { country: 'US', state: 'OH', rate: 5.75, name: 'Sales Tax' },
    { country: 'US', state: 'OK', rate: 4.5, name: 'Sales Tax' },
    { country: 'US', state: 'OR', rate: 0.0, name: 'Sales Tax' }, // Pas de sales tax
    { country: 'US', state: 'PA', rate: 6.0, name: 'Sales Tax' },
    { country: 'US', state: 'RI', rate: 7.0, name: 'Sales Tax' },
    { country: 'US', state: 'SC', rate: 6.0, name: 'Sales Tax' },
    { country: 'US', state: 'SD', rate: 4.5, name: 'Sales Tax' },
    { country: 'US', state: 'TN', rate: 7.0, name: 'Sales Tax' },
    { country: 'US', state: 'TX', rate: 6.25, name: 'Sales Tax' },
    { country: 'US', state: 'UT', rate: 6.1, name: 'Sales Tax' },
    { country: 'US', state: 'VT', rate: 6.0, name: 'Sales Tax' },
    { country: 'US', state: 'VA', rate: 5.3, name: 'Sales Tax' },
    { country: 'US', state: 'WA', rate: 6.5, name: 'Sales Tax' },
    { country: 'US', state: 'WV', rate: 6.0, name: 'Sales Tax' },
    { country: 'US', state: 'WI', rate: 5.0, name: 'Sales Tax' },
    { country: 'US', state: 'WY', rate: 4.0, name: 'Sales Tax' },
    { country: 'US', state: 'DC', rate: 6.0, name: 'Sales Tax' },

    // Canada - GST/HST/PST par province
    { country: 'CA', state: 'AB', rate: 5.0, name: 'GST' }, // Alberta - GST seulement
    { country: 'CA', state: 'BC', rate: 12.0, name: 'GST + PST' }, // British Columbia
    { country: 'CA', state: 'MB', rate: 12.0, name: 'GST + PST' }, // Manitoba
    { country: 'CA', state: 'NB', rate: 15.0, name: 'HST' }, // New Brunswick - HST
    { country: 'CA', state: 'NL', rate: 15.0, name: 'HST' }, // Newfoundland and Labrador - HST
    { country: 'CA', state: 'NT', rate: 5.0, name: 'GST' }, // Northwest Territories - GST seulement
    { country: 'CA', state: 'NS', rate: 15.0, name: 'HST' }, // Nova Scotia - HST
    { country: 'CA', state: 'NU', rate: 5.0, name: 'GST' }, // Nunavut - GST seulement
    { country: 'CA', state: 'ON', rate: 13.0, name: 'HST' }, // Ontario - HST
    { country: 'CA', state: 'PE', rate: 15.0, name: 'HST' }, // Prince Edward Island - HST
    { country: 'CA', state: 'QC', rate: 14.975, name: 'GST + QST' }, // Quebec - GST + QST
    { country: 'CA', state: 'SK', rate: 11.0, name: 'GST + PST' }, // Saskatchewan
    { country: 'CA', state: 'YT', rate: 5.0, name: 'GST' }, // Yukon - GST seulement

    // Mexique - IVA (Impuesto al Valor Agregado)
    { country: 'MX', state: 'AGU', rate: 16.0, name: 'IVA' }, // Aguascalientes
    { country: 'MX', state: 'BCN', rate: 16.0, name: 'IVA' }, // Baja California
    { country: 'MX', state: 'BCS', rate: 16.0, name: 'IVA' }, // Baja California Sur
    { country: 'MX', state: 'CAM', rate: 16.0, name: 'IVA' }, // Campeche
    { country: 'MX', state: 'CHP', rate: 16.0, name: 'IVA' }, // Chiapas
    { country: 'MX', state: 'CHH', rate: 16.0, name: 'IVA' }, // Chihuahua
    { country: 'MX', state: 'COA', rate: 16.0, name: 'IVA' }, // Coahuila
    { country: 'MX', state: 'COL', rate: 16.0, name: 'IVA' }, // Colima
    { country: 'MX', state: 'DIF', rate: 16.0, name: 'IVA' }, // Ciudad de México
    { country: 'MX', state: 'DUR', rate: 16.0, name: 'IVA' }, // Durango
    { country: 'MX', state: 'GUA', rate: 16.0, name: 'IVA' }, // Guanajuato
    { country: 'MX', state: 'GRO', rate: 16.0, name: 'IVA' }, // Guerrero
    { country: 'MX', state: 'HID', rate: 16.0, name: 'IVA' }, // Hidalgo
    { country: 'MX', state: 'JAL', rate: 16.0, name: 'IVA' }, // Jalisco
    { country: 'MX', state: 'MEX', rate: 16.0, name: 'IVA' }, // Estado de México
    { country: 'MX', state: 'MIC', rate: 16.0, name: 'IVA' }, // Michoacán
    { country: 'MX', state: 'MOR', rate: 16.0, name: 'IVA' }, // Morelos
    { country: 'MX', state: 'NAY', rate: 16.0, name: 'IVA' }, // Nayarit
    { country: 'MX', state: 'NLE', rate: 16.0, name: 'IVA' }, // Nuevo León
    { country: 'MX', state: 'OAX', rate: 16.0, name: 'IVA' }, // Oaxaca
    { country: 'MX', state: 'PUE', rate: 16.0, name: 'IVA' }, // Puebla
    { country: 'MX', state: 'QUE', rate: 16.0, name: 'IVA' }, // Querétaro
    { country: 'MX', state: 'ROO', rate: 16.0, name: 'IVA' }, // Quintana Roo
    { country: 'MX', state: 'SLP', rate: 16.0, name: 'IVA' }, // San Luis Potosí
    { country: 'MX', state: 'SIN', rate: 16.0, name: 'IVA' }, // Sinaloa
    { country: 'MX', state: 'SON', rate: 16.0, name: 'IVA' }, // Sonora
    { country: 'MX', state: 'TAB', rate: 16.0, name: 'IVA' }, // Tabasco
    { country: 'MX', state: 'TAM', rate: 16.0, name: 'IVA' }, // Tamaulipas
    { country: 'MX', state: 'TLA', rate: 16.0, name: 'IVA' }, // Tlaxcala
    { country: 'MX', state: 'VER', rate: 16.0, name: 'IVA' }, // Veracruz
    { country: 'MX', state: 'YUC', rate: 16.0, name: 'IVA' }, // Yucatán
    { country: 'MX', state: 'ZAC', rate: 16.0, name: 'IVA' }, // Zacatecas
];

/**
 * Trouve le taux de taxe pour un pays/état donné
 */
export function getTaxRate(country: CountryCode, state?: string): TaxRate {
    // Normaliser le code d'état (uppercase, trim)
    const normalizedState = state?.trim().toUpperCase();

    // Chercher un taux spécifique pour le pays et l'état
    if (normalizedState) {
        const specificRate = taxRates.find(
            rate => rate.country === country && rate.state === normalizedState
        );
        if (specificRate) {
            return specificRate;
        }
    }

    // Fallback: taux par défaut pour le pays
    // Pour US: taux moyen national (environ 6%)
    // Pour CA: taux moyen (environ 10%)
    // Pour MX: IVA standard (16%)
    const defaultRates: Record<CountryCode, TaxRate> = {
        US: { country: 'US', rate: 6.0, name: 'Sales Tax' },
        CA: { country: 'CA', rate: 10.0, name: 'GST/HST' },
        MX: { country: 'MX', rate: 16.0, name: 'IVA' },
    };

    return defaultRates[country];
}

/**
 * Calcule le montant des taxes pour un montant donné
 */
export function calculateTax(
    subtotal: number, // Montant avant taxes (en USD)
    country: CountryCode,
    state?: string,
    currency: CurrencyCode = 'USD'
): {
    taxRate: TaxRate;
    taxAmount: number; // Montant des taxes dans la devise locale
    taxAmountUSD: number; // Montant des taxes en USD
} {
    const taxRate = getTaxRate(country, state);
    
    // Calculer les taxes sur le subtotal
    const taxAmountUSD = (subtotal * taxRate.rate) / 100;
    
    // Convertir en devise locale si nécessaire
    const exchangeRates: Record<CurrencyCode, number> = {
        USD: 1,
        CAD: 1.35,
        MXN: 17.50,
    };
    
    const exchangeRate = exchangeRates[currency] || 1;
    const taxAmount = taxAmountUSD * exchangeRate;

    return {
        taxRate,
        taxAmount: Math.round(taxAmount * 100) / 100, // Arrondir à 2 décimales
        taxAmountUSD: Math.round(taxAmountUSD * 100) / 100,
    };
}

/**
 * Calcule le total avec taxes incluses
 */
export function calculateTotalWithTax(
    subtotal: number, // Montant avant taxes (en USD)
    shipping: number, // Frais de livraison (en USD)
    country: CountryCode,
    state?: string,
    currency: CurrencyCode = 'USD'
): {
    subtotal: number;
    shipping: number;
    tax: number;
    total: number;
    taxRate: TaxRate;
    currency: CurrencyCode;
} {
    // Les taxes sont calculées sur le subtotal + shipping (selon les règles fiscales)
    // Note: Dans certains pays, les taxes ne s'appliquent pas au shipping
    // Pour simplifier, on calcule les taxes sur subtotal + shipping
    const taxableAmount = subtotal + shipping;
    
    const { taxAmount, taxAmountUSD, taxRate } = calculateTax(
        taxableAmount,
        country,
        state,
        currency
    );

    const exchangeRates: Record<CurrencyCode, number> = {
        USD: 1,
        CAD: 1.35,
        MXN: 17.50,
    };
    
    const exchangeRate = exchangeRates[currency] || 1;
    const subtotalLocal = subtotal * exchangeRate;
    const shippingLocal = shipping * exchangeRate;
    const totalLocal = subtotalLocal + shippingLocal + taxAmount;

    return {
        subtotal: Math.round(subtotalLocal * 100) / 100,
        shipping: Math.round(shippingLocal * 100) / 100,
        tax: taxAmount,
        total: Math.round(totalLocal * 100) / 100,
        taxRate,
        currency,
    };
}

