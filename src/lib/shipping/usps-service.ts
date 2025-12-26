/**
 * USPS Shipping Service
 * 
 * Gère les appels à l'API USPS Rate pour calculer les frais de livraison
 * locaux et nationaux (même pays)
 */

export interface USPSConfig {
    userId: string;
    environment?: 'production' | 'test';
}

export interface USPSAddress {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
}

export interface USPSPackage {
    weight: number; // en livres (max 70 lbs pour USPS)
    length?: number; // en pouces
    width?: number; // en pouces
    height?: number; // en pouces
}

export interface USPSRateOption {
    carrier: 'USPS';
    service: string;
    price: number;
    currency: string;
    serviceName: string;
    estimatedDays?: {
        min: number;
        max: number;
    };
}

/**
 * Convertir un poids en onces (USPS utilise les onces)
 */
function poundsToOunces(pounds: number): number {
    return Math.ceil(pounds * 16); // Arrondir à l'once supérieure
}

/**
 * Mapper les codes de service USPS vers des noms lisibles
 */
function getUSPSServiceName(serviceId: string): string {
    const serviceMap: Record<string, string> = {
        '0': 'First-Class Mail',
        '1': 'Priority Mail',
        '2': 'Priority Mail Express',
        '3': 'Parcel Post',
        '4': 'Media Mail',
        '6': 'Library Mail',
        '7': 'Priority Mail Express International',
        '8': 'Priority Mail International',
        '9': 'First-Class Mail International',
    };

    return serviceMap[serviceId] || serviceId;
}

/**
 * Parser la réponse XML USPS en JSON
 */
function parseUSPSXMLResponse(xmlString: string): USPSRateOption[] {
    const rates: USPSRateOption[] = [];

    try {
        // Parser XML simple (pour production, utiliser une bibliothèque XML)
        // Extraction des balises <Postage>
        const postageMatches = xmlString.match(/<Postage[^>]*>[\s\S]*?<\/Postage>/g);

        if (!postageMatches) {
            // Essayer de trouver des erreurs
            const errorMatch = xmlString.match(/<Error[^>]*>[\s\S]*?<\/Error>/);
            if (errorMatch) {
                const errorText = errorMatch[0].match(/<Description[^>]*>([^<]*)<\/Description>/)?.[1] || 'Unknown error';
                throw new Error(`USPS API Error: ${errorText}`);
            }
            return rates;
        }

        for (const postageMatch of postageMatches) {
            // Extraire le service ID
            const serviceIdMatch = postageMatch.match(/CLASSID="([^"]*)"/);
            const serviceId = serviceIdMatch ? serviceIdMatch[1] : '';

            // Extraire le prix
            const rateMatch = postageMatch.match(/<Rate>([^<]*)<\/Rate>/);
            const rate = rateMatch ? parseFloat(rateMatch[1]) : 0;

            // Extraire le nom du service
            const mailServiceMatch = postageMatch.match(/<MailService>([^<]*)<\/MailService>/);
            const mailService = mailServiceMatch ? mailServiceMatch[1] : getUSPSServiceName(serviceId);

            if (rate > 0 && serviceId) {
                // Estimer les jours de livraison basés sur le service
                let estimatedDays = { min: 3, max: 7 };
                if (serviceId === '2' || serviceId === '7') {
                    // Priority Mail Express
                    estimatedDays = { min: 1, max: 2 };
                } else if (serviceId === '1' || serviceId === '8') {
                    // Priority Mail
                    estimatedDays = { min: 2, max: 5 };
                } else if (serviceId === '0' || serviceId === '9') {
                    // First-Class
                    estimatedDays = { min: 3, max: 7 };
                } else if (serviceId === '3') {
                    // Parcel Post
                    estimatedDays = { min: 5, max: 10 };
                }

                rates.push({
                    carrier: 'USPS',
                    service: `usps_${serviceId}`,
                    serviceName: mailService,
                    price: rate,
                    currency: 'USD',
                    estimatedDays,
                });
            }
        }
    } catch (error: any) {
        console.error('Error parsing USPS XML response:', error);
        throw new Error(`Failed to parse USPS response: ${error.message}`);
    }

    return rates;
}

/**
 * Calculer les frais de livraison USPS
 */
export async function calculateUSPSRates(
    origin: USPSAddress,
    destination: USPSAddress,
    packageInfo: USPSPackage,
    config: USPSConfig
): Promise<USPSRateOption[]> {
    try {
        // USPS n'accepte que les adresses US pour l'API RateV4
        if (origin.country !== 'US' || destination.country !== 'US') {
            throw new Error('USPS Rate API only supports US addresses');
        }

        const baseUrl = config.environment === 'production'
            ? 'https://secure.shippingapis.com'
            : 'https://stg-secure.shippingapis.com';

        // Construire la requête XML pour RateV4
        const weightOunces = poundsToOunces(Math.min(packageInfo.weight, 70)); // Max 70 lbs pour USPS

        // Service ID: 0=First-Class, 1=Priority, 2=Express, 3=Parcel
        const serviceIds = ['0', '1', '2', '3'];

        const xmlRequest = `<?xml version="1.0" encoding="UTF-8"?>
<RateV4Request USERID="${config.userId}">
    <Revision>2</Revision>
    <Package ID="1">
        <Service>ALL</Service>
        <ZipOrigination>${origin.zip.substring(0, 5)}</ZipOrigination>
        <ZipDestination>${destination.zip.substring(0, 5)}</ZipDestination>
        <Pounds>${Math.floor(weightOunces / 16)}</Pounds>
        <Ounces>${weightOunces % 16}</Ounces>
        ${packageInfo.length && packageInfo.width && packageInfo.height ? `
        <Size>REGULAR</Size>
        <Length>${Math.min(packageInfo.length, 108)}</Length>
        <Width>${Math.min(packageInfo.width, 108)}</Width>
        <Height>${Math.min(packageInfo.height, 108)}</Height>
        ` : '<Size>REGULAR</Size>'}
        <Machinable>true</Machinable>
    </Package>
</RateV4Request>`;

        const apiUrl = `${baseUrl}/ShippingAPI.dll?API=RateV4&XML=${encodeURIComponent(xmlRequest)}`;

        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/xml',
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`USPS API error: ${response.status} ${errorText}`);
        }

        const xmlResponse = await response.text();

        // Parser la réponse XML
        const rates = parseUSPSXMLResponse(xmlResponse);

        // Trier par prix croissant
        return rates.sort((a, b) => a.price - b.price);

    } catch (error: any) {
        console.error('Error calculating USPS rates:', error);
        throw new Error(`USPS rate calculation failed: ${error.message}`);
    }
}

/**
 * Vérifier si une destination est locale/nationale (même pays)
 */
export function isDomesticDestination(originCountry: string, destinationCountry: string): boolean {
    return originCountry === destinationCountry;
}

/**
 * Vérifier si USPS peut livrer dans un pays donné
 * USPS peut livrer depuis les US vers de nombreux pays internationaux
 */
export function canUSPSDeliverToCountry(originCountry: string, destinationCountry: string): boolean {
    // Si c'est domestique, USPS peut toujours livrer
    if (originCountry === destinationCountry) {
        return true;
    }
    
    // Si l'origine est US, USPS peut livrer vers de nombreux pays
    // Liste des pays où USPS peut livrer (principaux pays)
    if (originCountry === 'US') {
        const uspsInternationalCountries = [
            'US', 'CA', 'MX', // Amérique du Nord
            'GB', 'FR', 'DE', 'IT', 'ES', 'NL', 'BE', 'CH', 'AT', 'SE', 'NO', 'DK', 'FI', // Europe
            'AU', 'NZ', 'JP', 'KR', 'CN', 'HK', 'SG', 'TW', // Asie-Pacifique
            'BR', 'AR', 'CL', 'CO', 'PE', // Amérique du Sud
            // Et beaucoup d'autres...
        ];
        return uspsInternationalCountries.includes(destinationCountry);
    }
    
    // Pour les autres origines, USPS ne peut généralement pas livrer à l'international
    // (sauf si c'est domestique, déjà géré ci-dessus)
    return false;
}

