'use client';

import { usePathname } from 'next/navigation';
import Header from './Header';

/**
 * Composant Header conditionnel qui ne s'affiche pas dans l'interface admin
 */
export default function ConditionalHeader() {
    const pathname = usePathname();
    
    // Ne pas afficher le Header dans l'interface admin
    if (pathname?.startsWith('/admin')) {
        return null;
    }
    
    return <Header />;
}

