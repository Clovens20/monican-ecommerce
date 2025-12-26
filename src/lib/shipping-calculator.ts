/**
 * Shipping Calculator - USPS and FedEx Integration
 * 
 * This module calculates shipping costs using USPS and FedEx APIs
 * based on the shipping address and selected shipping method.
 * 
 * Logic:
 * - Si USPS peut livrer dans le pays de destination: USPS + FedEx (client peut comparer et choisir le moins cher)
 * - Si USPS ne peut pas livrer: FedEx only
 * - Options are automatically sorted by price (cheapest first)
 */

import { 
    calculateUSPSRates, 
    isDomesticDestination,
    canUSPSDeliverToCountry,
    USPSConfig,
    USPSAddress as USPSAddr,
    USPSPackage as USPSPkg,
} from './shipping/usps-service';

import {
    calculateFedExRates,
    isInternationalDestination,
    FedExConfig,
    FedExAddress as FedExAddr,
    FedExPackage as FedExPkg,
} from './shipping/fedex-service';

export interface ShippingAddress {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: 'US' | 'CA' | 'MX';
}

export interface PackageDimensions {
    weight: number; // in pounds
    length: number; // in inches
    width: number; // in inches
    height: number; // in inches
}

export interface ShippingOption {
    carrier: 'USPS' | 'FedEx';
    service: string;
    serviceName: string;
    cost: number; // in USD
    estimatedDays?: {
        min: number;
        max: number;
    };
    currency: 'USD' | 'CAD' | 'MXN';
}

export interface ShippingCalculatorConfig {
    originAddress: {
        street: string;
        city: string;
        state: string;
        zip: string;
        country: 'US' | 'CA' | 'MX';
    };
    uspsUserId?: string; // USPS API User ID
    fedExApiKey?: string; // FedEx API Key
    fedExApiSecret?: string; // FedEx API Secret
    fedExAccountNumber?: string; // FedEx Account Number
    fedExEnvironment?: 'sandbox' | 'production'; // FedEx environment
    uspsEnvironment?: 'production' | 'test'; // USPS environment
}

/**
 * Calculate package dimensions and weight from cart items
 */
export function calculatePackageDimensions(items: Array<{ quantity: number; weight?: number }>): PackageDimensions {
    // Default dimensions per item (can be customized)
    const defaultItemWeight = 1; // 1 pound per item
    const defaultDimensions = {
        length: 12, // inches
        width: 10, // inches
        height: 6, // inches
    };

    const totalWeight = items.reduce((sum, item) => {
        return sum + (item.weight || defaultItemWeight) * item.quantity;
    }, 0);

    // Calculate total dimensions (simplified - assumes items are stacked)
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
    const height = defaultDimensions.height * Math.ceil(totalItems / 2); // Stack items

    return {
        weight: Math.max(0.1, totalWeight), // Minimum 0.1 lbs
        length: defaultDimensions.length,
        width: defaultDimensions.width,
        height: Math.min(height, 108), // Maximum 108 inches (USPS limit)
    };
}

/**
 * Calculate shipping costs using USPS API
 * USPS peut livrer aux destinations domestiques ET à certains pays internationaux
 */
export async function calculateUSPSShipping(
    destination: ShippingAddress,
    packageDimensions: PackageDimensions,
    config: ShippingCalculatorConfig
): Promise<ShippingOption[]> {
    // Vérifier si USPS peut livrer dans ce pays
    if (!canUSPSDeliverToCountry(config.originAddress.country, destination.country)) {
        // USPS ne peut pas livrer dans ce pays
        return [];
    }

    if (!config.uspsUserId) {
        console.warn('USPS User ID not configured, using fallback rates');
        return getUSPSFallbackRates(destination, packageDimensions);
    }

    try {
        const uspsConfig: USPSConfig = {
            userId: config.uspsUserId,
            environment: config.uspsEnvironment || 'production',
        };

        const uspsOrigin: USPSAddr = {
            street: config.originAddress.street,
            city: config.originAddress.city,
            state: config.originAddress.state,
            zip: config.originAddress.zip,
            country: config.originAddress.country,
        };

        const uspsDestination: USPSAddr = {
            street: destination.street,
            city: destination.city,
            state: destination.state,
            zip: destination.zip,
            country: destination.country,
        };

        const uspsPackage: USPSPkg = {
            weight: packageDimensions.weight,
            length: packageDimensions.length,
            width: packageDimensions.width,
            height: packageDimensions.height,
        };

        const uspsRates = await calculateUSPSRates(uspsOrigin, uspsDestination, uspsPackage, uspsConfig);

        // Convertir en format ShippingOption
        return uspsRates.map(rate => ({
            carrier: rate.carrier,
            service: rate.service,
            serviceName: rate.serviceName,
            cost: rate.price,
            estimatedDays: rate.estimatedDays || { min: 3, max: 7 }, // Valeur par défaut si non fournie
            currency: rate.currency as 'USD' | 'CAD' | 'MXN',
        }));
    } catch (error) {
        console.error('Error calculating USPS rates:', error);
        // En cas d'erreur, utiliser les fallback rates
        return getUSPSFallbackRates(destination, packageDimensions);
    }
}

/**
 * Calculate shipping costs using FedEx API
 * FedEx peut être utilisé pour les destinations domestiques ET internationales
 */
export async function calculateFedExShipping(
    destination: ShippingAddress,
    packageDimensions: PackageDimensions,
    config: ShippingCalculatorConfig
): Promise<ShippingOption[]> {
    // FedEx peut être utilisé pour toutes les destinations (domestiques et internationales)
    if (!config.fedExApiKey || !config.fedExApiSecret || !config.fedExAccountNumber) {
        console.warn('FedEx credentials not configured, using fallback rates');
        return getFedExFallbackRates(destination, packageDimensions);
    }

    try {
        const fedExConfig: FedExConfig = {
            apiKey: config.fedExApiKey,
            apiSecret: config.fedExApiSecret,
            accountNumber: config.fedExAccountNumber,
            environment: config.fedExEnvironment || 'production',
            // URLs depuis .env (production uniquement)
            oauthUrl: process.env.FEDEX_OAUTH_URL,
            rateUrl: process.env.FEDEX_RATE_URL,
        };

        const fedExOrigin: FedExAddr = {
            street: config.originAddress.street,
            city: config.originAddress.city,
            state: config.originAddress.state,
            zip: config.originAddress.zip,
            country: config.originAddress.country,
        };

        const fedExDestination: FedExAddr = {
            street: destination.street,
            city: destination.city,
            state: destination.state,
            zip: destination.zip,
            country: destination.country,
        };

        const fedExPackage: FedExPkg = {
            weight: packageDimensions.weight,
            length: packageDimensions.length,
            width: packageDimensions.width,
            height: packageDimensions.height,
        };

        const fedExRates = await calculateFedExRates(fedExOrigin, fedExDestination, fedExPackage, fedExConfig);

        // Convertir en format ShippingOption
        // Note: rate.price de FedEx est en USD, on le garde comme cost
        return fedExRates.map(rate => ({
            carrier: rate.carrier,
            service: rate.service,
            serviceName: rate.serviceName,
            cost: rate.price, // FedEx retourne toujours en USD
            estimatedDays: rate.estimatedDays || { min: 3, max: 7 }, // Valeur par défaut si non fournie
            currency: 'USD', // FedEx retourne toujours en USD, la conversion se fait dans l'API
        }));
    } catch (error) {
        console.error('Error calculating FedEx rates:', error);
        // En cas d'erreur, utiliser les fallback rates
        return getFedExFallbackRates(destination, packageDimensions);
    }
}

/**
 * Get USPS fallback rates (simplified calculation)
 * These are approximate rates and should be replaced with actual API calls
 */
function getUSPSFallbackRates(
    destination: ShippingAddress,
    packageDimensions: PackageDimensions
): ShippingOption[] {
    const baseRate = 5; // Base rate in USD
    const weightMultiplier = packageDimensions.weight * 0.5;
    const zoneMultiplier = getZoneMultiplier(destination.zip);

    const options: ShippingOption[] = [
        {
            carrier: 'USPS',
            service: 'usps_priority',
            serviceName: 'USPS Priority Mail',
            cost: (baseRate + weightMultiplier) * zoneMultiplier,
            estimatedDays: { min: 2, max: 5 },
            currency: 'USD',
        },
        {
            carrier: 'USPS',
            service: 'usps_priority_express',
            serviceName: 'USPS Priority Mail Express',
            cost: (baseRate * 2 + weightMultiplier) * zoneMultiplier,
            estimatedDays: { min: 1, max: 2 },
            currency: 'USD',
        },
        {
            carrier: 'USPS',
            service: 'usps_ground',
            serviceName: 'USPS Ground',
            cost: (baseRate * 0.7 + weightMultiplier) * zoneMultiplier,
            estimatedDays: { min: 5, max: 10 },
            currency: 'USD',
        },
    ];

    return options;
}

/**
 * Get FedEx fallback rates (simplified calculation)
 * These are approximate rates and should be replaced with actual API calls
 */
function getFedExFallbackRates(
    destination: ShippingAddress,
    packageDimensions: PackageDimensions
): ShippingOption[] {
    const baseRate = 8; // Base rate in USD (FedEx is typically more expensive)
    const weightMultiplier = packageDimensions.weight * 0.6;
    const zoneMultiplier = getZoneMultiplier(destination.zip);

    const options: ShippingOption[] = [
        {
            carrier: 'FedEx',
            service: 'fedex_ground',
            serviceName: 'FedEx Ground',
            cost: (baseRate + weightMultiplier) * zoneMultiplier,
            estimatedDays: { min: 3, max: 7 },
            currency: 'USD',
        },
        {
            carrier: 'FedEx',
            service: 'fedex_2day',
            serviceName: 'FedEx 2Day',
            cost: (baseRate * 2.5 + weightMultiplier) * zoneMultiplier,
            estimatedDays: { min: 2, max: 2 },
            currency: 'USD',
        },
        {
            carrier: 'FedEx',
            service: 'fedex_overnight',
            serviceName: 'FedEx Overnight',
            cost: (baseRate * 4 + weightMultiplier) * zoneMultiplier,
            estimatedDays: { min: 1, max: 1 },
            currency: 'USD',
        },
    ];

    return options;
}

/**
 * Calculate zone multiplier based on ZIP code
 * This is a simplified calculation - in production, use actual zone lookup
 */
function getZoneMultiplier(zip: string): number {
    // Simplified zone calculation based on ZIP code
    // Zone 1-2: Local (1.0x)
    // Zone 3-4: Regional (1.2x)
    // Zone 5-6: Cross-country (1.5x)
    // Zone 7-8: Remote (2.0x)

    const zipNum = parseInt(zip.substring(0, 3));
    
    if (zipNum >= 100 && zipNum <= 199) return 1.0; // NY area
    if (zipNum >= 900 && zipNum <= 999) return 1.5; // CA area
    if (zipNum >= 600 && zipNum <= 699) return 1.2; // Midwest
    if (zipNum >= 300 && zipNum <= 399) return 1.2; // Southeast
    
    return 1.3; // Default multiplier
}

/**
 * Get all available shipping options
 * 
 * Logic:
 * - Si USPS peut livrer dans le pays de destination: Proposer USPS + FedEx (client peut comparer et choisir le moins cher)
 * - Si USPS ne peut pas livrer dans le pays: Proposer FedEx uniquement
 * - Options triées automatiquement par prix croissant
 */
export async function getAllShippingOptions(
    destination: ShippingAddress,
    packageDimensions: PackageDimensions,
    config: ShippingCalculatorConfig
): Promise<ShippingOption[]> {
    const canUSPSDeliver = canUSPSDeliverToCountry(config.originAddress.country, destination.country);
    const isInternational = isInternationalDestination(config.originAddress.country, destination.country);

    const options: ShippingOption[] = [];

    try {
        // Si USPS peut livrer dans ce pays, proposer USPS ET FedEx
        if (canUSPSDeliver) {
            // Calculer les options USPS
            const uspsOptions = await calculateUSPSShipping(destination, packageDimensions, config);
            options.push(...uspsOptions);

            // Calculer les options FedEx (pour comparaison)
            const fedExOptions = await calculateFedExShipping(destination, packageDimensions, config);
            options.push(...fedExOptions);
        } else if (isInternational) {
            // Si USPS ne peut pas livrer et c'est international, utiliser FedEx uniquement
            const fedExOptions = await calculateFedExShipping(destination, packageDimensions, config);
            options.push(...fedExOptions);
        }

        // Trier par prix croissant (le moins cher en premier)
        return options.sort((a, b) => a.cost - b.cost);
    } catch (error) {
        console.error('Error getting shipping options:', error);
        // En cas d'erreur, retourner les fallback rates
        const fallbackOptions: ShippingOption[] = [];
        
        // Ajouter USPS fallback si USPS peut livrer dans ce pays
        if (canUSPSDeliver) {
            fallbackOptions.push(...getUSPSFallbackRates(destination, packageDimensions));
        }
        
        // Toujours ajouter FedEx fallback
        fallbackOptions.push(...getFedExFallbackRates(destination, packageDimensions));
        
        return fallbackOptions.sort((a, b) => a.cost - b.cost);
    }
}

