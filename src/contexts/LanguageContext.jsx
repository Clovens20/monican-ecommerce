// src/contexts/LanguageContext.jsx
'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { translations } from '../translations.mjs';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState('en');
  const [mounted, setMounted] = useState(false);

  // ✅ CORRECTION: Charger la langue de manière asynchrone
  useEffect(() => {
    const loadLanguage = () => {
      const storedLanguage = localStorage.getItem('language') || 'en';
      setLanguage(storedLanguage);
      setMounted(true);
    };
    
    // Utiliser setTimeout pour éviter l'appel synchrone
    const timeoutId = setTimeout(loadLanguage, 0);
    
    return () => clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    // Sauvegarder dans localStorage uniquement après le montage
    if (mounted) {
      localStorage.setItem('language', language);
    }
  }, [language, mounted]);

  const t = (key) => {
    if (!mounted) {
      // Pendant le SSR et l'hydratation, retourner la traduction anglaise
      return translations['en'][key] || key;
    }
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, mounted }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}