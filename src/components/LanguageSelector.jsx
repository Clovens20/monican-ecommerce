// src/components/LanguageSelector.jsx
'use client';

import { useLanguage } from '../contexts/LanguageContext';
import { languages } from '../translations.mjs';

export default function LanguageSelector() {
  const { language, setLanguage } = useLanguage();

  return (
    <select
      value={language}
      onChange={(e) => setLanguage(e.target.value)}
      style={{
        padding: '0.25rem 0.5rem',
        borderRadius: '4px',
        border: '1px solid #e5e7eb',
        marginRight: '1rem',
        cursor: 'pointer',
        fontSize: '0.9rem',
        backgroundColor: 'white',
        color: '#374151',
        fontWeight: '500'
      }}
      className="language-selector"
    >
      {languages.map((lang) => (
        <option key={lang.code} value={lang.code}>
          {lang.flag} {lang.name}
        </option>
      ))}
    </select>
  );
}