/**
 * FedEx Shipping Service
 * 
 * Gère l'authentification OAuth et les appels à l'API FedEx Rate
 * pour calculer les frais de livraison internationaux
 */

export interface FedExConfig {
    apiKey: string;
    apiSecret: string;
    accountNumber: string;
    environment?: 'sandbox' | 'production';
    oauthUrl?: string; // URL OAuth personnalisée
    rateUrl?: string; // URL Rate API personnalisée
}

export interface FedExAddress {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
}

export interface FedExPackage {
    weight: number; // en livres
    length?: number; // en pouces
    width?: number; // en pouces
    height?: number; // en pouces
}

export interface FedExRateOption {
    carrier: 'FedEx';
    service: string;
    price: number;
    currency: string;
    serviceName: string;
    estimatedDays?: {
        min: number;
        max: number;
    };
}

interface FedExOAuthToken {
    access_token: string;
    token_type: string;
    expires_in: number;
    scope: string;
    expires_at?: number; // Timestamp d'expiration calculé
}

// Cache du token OAuth
let oauthTokenCache: FedExOAuthToken | null = null;

/**
 * Obtenir un token OAuth FedEx
 */
async function getFedExOAuthToken(config: FedExConfig): Promise<string> {
    // Vérifier si le token en cache est encore valide
    if (oauthTokenCache && oauthTokenCache.expires_at) {
        const now = Date.now();
        // Renouveler 5 minutes avant expiration
        if (now < oauthTokenCache.expires_at - 5 * 60 * 1000) {
            return oauthTokenCache.access_token;
        }
    }

    // Utiliser l'URL personnalisée ou l'URL par défaut selon l'environnement
    const oauthUrl = config.oauthUrl || (
        config.environment === 'production' 
            ? 'https://apis.fedex.com/oauth/token'
            : 'https://apis-sandbox.fedex.com/oauth/token'
    );

    try {
        const response = await fetch(oauthUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                grant_type: 'client_credentials',
                client_id: config.apiKey,
                client_secret: config.apiSecret,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`FedEx OAuth failed: ${response.status} ${errorText}`);
        }

        const tokenData: FedExOAuthToken = await response.json();
        
        // Calculer l'heure d'expiration
        tokenData.expires_at = Date.now() + (tokenData.expires_in * 1000);
        
        // Mettre en cache
        oauthTokenCache = tokenData;

        return tokenData.access_token;
    } catch (error: any) {
        console.error('Error getting FedEx OAuth token:', error);
        throw new Error(`Failed to authenticate with FedEx: ${error.message}`);
    }
}

/**
 * Mapper les codes de service FedEx vers des noms lisibles
 */
function getFedExServiceName(serviceType: string): string {
    const serviceMap: Record<string, string> = {
        'FEDEX_GROUND': 'FedEx Ground',
        'FEDEX_2_DAY': 'FedEx 2Day',
        'FEDEX_2_DAY_AM': 'FedEx 2Day AM',
        'FEDEX_EXPRESS_SAVER': 'FedEx Express Saver',
        'STANDARD_OVERNIGHT': 'FedEx Standard Overnight',
        'PRIORITY_OVERNIGHT': 'FedEx Priority Overnight',
        'FIRST_OVERNIGHT': 'FedEx First Overnight',
        'FEDEX_INTERNATIONAL_ECONOMY': 'FedEx International Economy',
        'FEDEX_INTERNATIONAL_PRIORITY': 'FedEx International Priority',
        'FEDEX_INTERNATIONAL_FIRST': 'FedEx International First',
        'INTERNATIONAL_ECONOMY': 'FedEx International Economy',
        'INTERNATIONAL_PRIORITY': 'FedEx International Priority',
        'INTERNATIONAL_FIRST': 'FedEx International First',
    };

    return serviceMap[serviceType] || serviceType.replace(/_/g, ' ');
}

/**
 * Calculer les frais de livraison FedEx
 */
export async function calculateFedExRates(
    origin: FedExAddress,
    destination: FedExAddress,
    packageInfo: FedExPackage,
    config: FedExConfig
): Promise<FedExRateOption[]> {
    try {
        // Obtenir le token OAuth
        const accessToken = await getFedExOAuthToken(config);

        // Utiliser l'URL personnalisée ou l'URL par défaut selon l'environnement
        const rateUrl = config.rateUrl || (
            config.environment === 'production'
                ? 'https://apis.fedex.com/rate/v1/rates/quotes'
                : 'https://apis-sandbox.fedex.com/rate/v1/rates/quotes'
        );

        // Préparer la requête Rate Quote
        const rateRequest = {
            accountNumber: {
                value: config.accountNumber,
            },
            requestedShipment: {
                shipper: {
                    address: {
                        streetLines: [origin.street],
                        city: origin.city,
                        stateOrProvinceCode: origin.state,
                        postalCode: origin.zip,
                        countryCode: origin.country,
                    },
                },
                recipients: [
                    {
                        address: {
                            streetLines: [destination.street],
                            city: destination.city,
                            stateOrProvinceCode: destination.state,
                            postalCode: destination.zip,
                            countryCode: destination.country,
                        },
                    },
                ],
                rateRequestType: ['ACCOUNT', 'LIST'],
                requestedPackageLineItems: [
                    {
                        weight: {
                            units: 'LB',
                            value: Math.max(0.1, packageInfo.weight),
                        },
                        dimensions: packageInfo.length && packageInfo.width && packageInfo.height ? {
                            length: packageInfo.length,
                            width: packageInfo.width,
                            height: packageInfo.height,
                            units: 'IN',
                        } : undefined,
                    },
                ],
            },
        };

        const response = await fetch(rateUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`,
                'X-locale': 'en_US',
            },
            body: JSON.stringify(rateRequest),
        });

        if (!response.ok) {
            let errorData: any;
            try {
                errorData = await response.json();
            } catch {
                const errorText = await response.text();
                errorData = { message: errorText };
            }
            throw new Error(`FedEx API error: ${response.status} ${JSON.stringify(errorData)}`);
        }

        const data = await response.json();

        // Parser la réponse FedEx
        const rates: FedExRateOption[] = [];

        if (data.output?.rateReplyDetails) {
            for (const rateDetail of data.output.rateReplyDetails) {
                if (rateDetail.ratedShipmentDetails) {
                    for (const shipmentDetail of rateDetail.ratedShipmentDetails) {
                        const totalNetCharge = shipmentDetail.totalNetCharge;
                        if (totalNetCharge && totalNetCharge.amount) {
                            rates.push({
                                carrier: 'FedEx',
                                service: rateDetail.serviceType || 'UNKNOWN',
                                serviceName: getFedExServiceName(rateDetail.serviceType || 'UNKNOWN'),
                                price: parseFloat(totalNetCharge.amount),
                                currency: totalNetCharge.currency || 'USD',
                                estimatedDays: rateDetail.commit?.saturdayDelivery ? {
                                    min: rateDetail.commit.delayDetails?.[0]?.delayType === 'DELAYED' ? 2 : 1,
                                    max: 2,
                                } : rateDetail.commit?.commitDetails?.[0] ? {
                                    min: rateDetail.commit.commitDetails[0].commitTimestamp ? 1 : 2,
                                    max: rateDetail.commit.commitDetails[0].commitTimestamp ? 2 : 5,
                                } : undefined,
                            });
                        }
                    }
                }
            }
        }

        // Trier par prix croissant
        return rates.sort((a, b) => a.price - b.price);

    } catch (error: any) {
        console.error('Error calculating FedEx rates:', error);
        throw new Error(`FedEx rate calculation failed: ${error.message}`);
    }
}

/**
 * Vérifier si une destination est internationale (différente du pays d'origine)
 */
export function isInternationalDestination(originCountry: string, destinationCountry: string): boolean {
    return originCountry !== destinationCountry;
}

