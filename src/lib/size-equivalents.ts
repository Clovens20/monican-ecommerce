// ============================================================================
// ÉQUIVALENCES DE TAILLES - Jeans
// ============================================================================

export interface SizeEquivalent {
  us: string;
  eu: string;
  uk: string;
  waist: string; // Taille de tour de taille en pouces
}

/**
 * Mapping des tailles de jeans avec leurs équivalences
 * US (pouces de tour de taille) | EU | UK | Waist (inches)
 */
export const JEANS_SIZE_EQUIVALENTS: Record<string, SizeEquivalent> = {
  '28': { us: '28', eu: '38', uk: '28', waist: '28"' },
  '30': { us: '30', eu: '40', uk: '30', waist: '30"' },
  '31': { us: '31', eu: '41', uk: '31', waist: '31"' },
  '32': { us: '32', eu: '42', uk: '32', waist: '32"' },
  '33': { us: '33', eu: '43', uk: '33', waist: '33"' },
  '34': { us: '34', eu: '44', uk: '34', waist: '34"' },
  '35': { us: '35', eu: '45', uk: '35', waist: '35"' },
  '36': { us: '36', eu: '46', uk: '36', waist: '36"' },
  '37': { us: '37', eu: '47', uk: '37', waist: '37"' },
  '38': { us: '38', eu: '48', uk: '38', waist: '38"' },
  '39': { us: '39', eu: '49', uk: '39', waist: '39"' },
  '40': { us: '40', eu: '50', uk: '40', waist: '40"' },
  '41': { us: '41', eu: '51', uk: '41', waist: '41"' },
  '42': { us: '42', eu: '52', uk: '42', waist: '42"' },
  '43': { us: '43', eu: '53', uk: '43', waist: '43"' },
  '44': { us: '44', eu: '54', uk: '44', waist: '44"' },
  '46': { us: '46', eu: '56', uk: '46', waist: '46"' },
  '48': { us: '48', eu: '58', uk: '48', waist: '48"' },
};

/**
 * Obtient les équivalences de taille pour un jeans
 */
export function getJeansSizeEquivalent(size: string): SizeEquivalent | null {
  return JEANS_SIZE_EQUIVALENTS[size] || null;
}

/**
 * Formate l'affichage d'une taille avec ses équivalences
 * Exemple: "32 (EU: 42, US: 32)"
 */
export function formatSizeWithEquivalents(size: string, category: string): string {
  if (category === 'jeans') {
    const equivalent = getJeansSizeEquivalent(size);
    if (equivalent) {
      return `${size} (EU: ${equivalent.eu}, US: ${equivalent.us})`;
    }
  }
  return size;
}

/**
 * Formate l'affichage détaillé d'une taille avec toutes les équivalences
 * Exemple: "32 - EU: 42 | US: 32 | UK: 32 | Waist: 32\""
 */
export function formatSizeDetailed(size: string, category: string): string {
  if (category === 'jeans') {
    const equivalent = getJeansSizeEquivalent(size);
    if (equivalent) {
      return `${size} - EU: ${equivalent.eu} | US: ${equivalent.us} | UK: ${equivalent.uk} | Waist: ${equivalent.waist}`;
    }
  }
  return size;
}

