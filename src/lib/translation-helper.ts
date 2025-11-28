/**
 * Translation Helper - Utilitaire pour faciliter les traductions
 * 
 * Ce fichier fournit des helpers pour s'assurer que tous les nouveaux fichiers
 * utilisent automatiquement les traductions.
 */

import { useLanguage } from '@/contexts/LanguageContext';

/**
 * Hook personnalisé pour les traductions avec validation
 * Affiche un warning en développement si une clé de traduction est manquante
 */
export function useTranslation() {
  const { t, language } = useLanguage();

  const translate = (key: string, fallback?: string): string => {
    const translation = t(key);
    
    // En développement, vérifier si la traduction existe
    if (process.env.NODE_ENV === 'development') {
      if (translation === key && !fallback) {
        console.warn(
          `⚠️ Translation missing for key: "${key}" in language: "${language}". ` +
          `Add this key to src/translations.mjs`
        );
      }
    }

    // Utiliser le fallback si la traduction n'existe pas
    if (translation === key && fallback) {
      return fallback;
    }

    return translation;
  };

  return { t: translate, language };
}

/**
 * Helper pour les composants serveur (Server Components)
 * Note: Les Server Components ne peuvent pas utiliser les hooks
 * Utilisez cette fonction uniquement si vous avez besoin de traductions côté serveur
 */
export function getTranslation(language: string, key: string): string {
  // Cette fonction nécessiterait d'importer translations directement
  // Pour l'instant, retourne la clé (les Server Components devraient utiliser des Client Components pour les traductions)
  return key;
}

