'use client';

import { usePathname } from 'next/navigation';
import Footer from './Footer';

/**
 * Composant Footer conditionnel qui ne s'affiche pas dans l'interface admin
 */
export default function ConditionalFooter() {
    const pathname = usePathname();
    
    // Ne pas afficher le Footer dans l'interface admin
    if (pathname?.startsWith('/admin')) {
        return null;
    }
    
    return <Footer />;
}

