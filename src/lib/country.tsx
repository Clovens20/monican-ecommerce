'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type CountryCode = 'US' | 'CA' | 'MX';
export type CurrencyCode = 'USD' | 'CAD' | 'MXN';

interface CountrySettings {
    code: CountryCode;
    name: string;
    currency: CurrencyCode;
    currencySymbol: string;
    exchangeRate: number; // Relative to USD
    flag: string;
    shippingRule: {
        flatRate: number;
    };
}

const countrySettings: Record<CountryCode, CountrySettings> = {
    US: {
        code: 'US',
        name: 'United States',
        currency: 'USD',
        currencySymbol: '$',
        exchangeRate: 1,
        flag: '🇺🇸',
        shippingRule: {
            flatRate: 10,
        },
    },
    CA: {
        code: 'CA',
        name: 'Canada',
        currency: 'CAD',
        currencySymbol: 'CA$',
        exchangeRate: 1.35,
        flag: '🇨🇦',
        shippingRule: {
            flatRate: 15, // CAD
        },
    },
    MX: {
        code: 'MX',
        name: 'México',
        currency: 'MXN',
        currencySymbol: 'MX$',
        exchangeRate: 17.50,
        flag: '🇲🇽',
        shippingRule: {
            flatRate: 200, // MXN
        },
    },
};

interface CountryContextType {
    country: CountryCode;
    setCountry: (code: CountryCode) => void;
    settings: CountrySettings;
    formatPrice: (priceInUSD: number) => string;
    convertPrice: (priceInUSD: number) => number;
    shippingCost: (subtotalInUSD?: number) => number; // Returns cost in local currency
}

const CountryContext = createContext<CountryContextType | undefined>(undefined);

export function CountryProvider({ children }: { children: React.ReactNode }) {
    const [country, setCountry] = useState<CountryCode>('US');

    // ✅ CORRECTION: Charger le pays de manière asynchrone
    useEffect(() => {
        const loadCountry = () => {
            const saved = localStorage.getItem('monican_country') as CountryCode;
            if (saved && countrySettings[saved]) {
                setCountry(saved);
            }
        };
        
        // Utiliser setTimeout pour éviter l'appel synchrone
        const timeoutId = setTimeout(loadCountry, 0);
        
        return () => clearTimeout(timeoutId);
    }, []);

    const handleSetCountry = (code: CountryCode) => {
        setCountry(code);
        localStorage.setItem('monican_country', code);
    };

    const settings = countrySettings[country];

    const convertPrice = (priceInUSD: number) => {
        return priceInUSD * settings.exchangeRate;
    };

    const formatPrice = (priceInUSD: number) => {
        const localPrice = convertPrice(priceInUSD);
        return new Intl.NumberFormat(country === 'US' ? 'en-US' : country === 'CA' ? 'en-CA' : 'es-MX', {
            style: 'currency',
            currency: settings.currency,
        }).format(localPrice);
    };

    const shippingCost = (subtotalInUSD?: number) => {
        // Retourne toujours le tarif fixe, sans seuil de livraison gratuite
        // Le paramètre subtotalInUSD est gardé pour la compatibilité mais n'est pas utilisé
        return settings.shippingRule.flatRate;
    };

    return (
        <CountryContext.Provider value={{
            country,
            setCountry: handleSetCountry,
            settings,
            formatPrice,
            convertPrice,
            shippingCost
        }}>
            {children}
        </CountryContext.Provider>
    );
}

export function useCountry() {
    const context = useContext(CountryContext);
    if (context === undefined) {
        throw new Error('useCountry must be used within a CountryProvider');
    }
    return context;
}