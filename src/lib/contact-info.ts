/**
 * Utilitaire pour récupérer les informations de contact depuis la base de données
 * Évite les valeurs codées en dur dans tout le projet
 */

export interface ContactInfo {
  email: string;
  phone: string;
  openingHours?: string;
  address?: string;
  siteUrl?: string;
}

// Cache pour éviter les appels répétés
let cachedContactInfo: ContactInfo | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const DEFAULT_CONTACT_INFO: ContactInfo = {
  email: 'support@monican.shop',
  phone: '717-880-1479',
  openingHours: '24/7',
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://monican.shop',
};

/**
 * Récupère les informations de contact depuis la base de données
 * Utilise un cache pour éviter les appels répétés
 */
export async function getContactInfo(language: string = 'fr'): Promise<ContactInfo> {
  // Vérifier le cache
  const now = Date.now();
  if (cachedContactInfo && (now - cacheTimestamp) < CACHE_DURATION) {
    return cachedContactInfo;
  }

  try {
    // Appeler l'API publique pour récupérer les informations de contact
    const baseUrl = typeof window !== 'undefined' 
      ? window.location.origin 
      : process.env.NEXT_PUBLIC_SITE_URL || 'https://monican.shop';
    
    const response = await fetch(`${baseUrl}/api/site-content?pageId=contact&language=${language}`, {
      cache: 'no-store',
    });

    if (response.ok) {
      const data = await response.json();
      if (data.success && data.data?.content) {
        const content = data.data.content;
        cachedContactInfo = {
          email: content.email || DEFAULT_CONTACT_INFO.email,
          phone: content.phone || DEFAULT_CONTACT_INFO.phone,
          openingHours: content.openingHours || DEFAULT_CONTACT_INFO.openingHours,
          address: content.address,
          siteUrl: DEFAULT_CONTACT_INFO.siteUrl,
        };
        cacheTimestamp = now;
        return cachedContactInfo;
      }
    }
  } catch (error) {
    console.error('Error fetching contact info:', error);
  }

  // Retourner les valeurs par défaut en cas d'erreur
  return DEFAULT_CONTACT_INFO;
}

/**
 * Récupère uniquement l'email de contact
 */
export async function getContactEmail(language: string = 'fr'): Promise<string> {
  const info = await getContactInfo(language);
  return info.email;
}

/**
 * Récupère uniquement le téléphone de contact
 */
export async function getContactPhone(language: string = 'fr'): Promise<string> {
  const info = await getContactInfo(language);
  return info.phone;
}

/**
 * Récupère l'URL du site
 */
export function getSiteUrl(): string {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_CONTACT_INFO.siteUrl || 'https://monican.shop';
}

/**
 * Invalide le cache (utile après une mise à jour dans l'admin)
 */
export function invalidateContactInfoCache(): void {
  cachedContactInfo = null;
  cacheTimestamp = 0;
}

/**
 * Version serveur : récupère les informations de contact directement depuis Supabase
 * À utiliser dans les API routes et les fonctions serveur
 */
export async function getContactInfoServer(language: string = 'fr'): Promise<ContactInfo> {
  try {
    // Import dynamique pour éviter les erreurs côté client
    const { supabase } = await import('@/lib/supabase');
    
    const { data, error } = await supabase
      .from('site_content')
      .select('content')
      .eq('page_id', 'contact')
      .eq('language', language)
      .maybeSingle();

    if (!error && data?.content) {
      const content = data.content;
      return {
        email: content.email || DEFAULT_CONTACT_INFO.email,
        phone: content.phone || DEFAULT_CONTACT_INFO.phone,
        openingHours: content.openingHours || DEFAULT_CONTACT_INFO.openingHours,
        address: content.address,
        siteUrl: process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_CONTACT_INFO.siteUrl || 'https://monican.shop',
      };
    }
  } catch (error) {
    console.error('Error fetching contact info from server:', error);
  }

  // Retourner les valeurs par défaut en cas d'erreur
  return {
    ...DEFAULT_CONTACT_INFO,
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_CONTACT_INFO.siteUrl || 'https://monican.shop',
  };
}

