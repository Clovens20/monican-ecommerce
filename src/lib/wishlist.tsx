'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Product } from '@/lib/products';

interface WishlistContextType {
    items: Product[];
    addItem: (product: Product) => void;
    removeItem: (productId: string) => void;
    isInWishlist: (productId: string) => boolean;
    toggleItem: (product: Product) => void;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: ReactNode }) {
    const [items, setItems] = useState<Product[]>([]);

    // ✅ CORRECTION: Charger la wishlist de manière asynchrone
    useEffect(() => {
        const loadWishlist = () => {
            const saved = localStorage.getItem('monican_wishlist');
            if (saved) {
                try {
                    setItems(JSON.parse(saved));
                } catch (e) {
                    console.error('Failed to parse wishlist', e);
                }
            }
        };
        
        // Utiliser queueMicrotask pour éviter l'appel synchrone
        queueMicrotask(loadWishlist);
    }, []);

    useEffect(() => {
        localStorage.setItem('monican_wishlist', JSON.stringify(items));
    }, [items]);

    const addItem = (product: Product) => {
        setItems((prev) => {
            if (prev.find(p => p.id === product.id)) return prev;
            return [...prev, product];
        });
    };

    const removeItem = (productId: string) => {
        setItems((prev) => prev.filter(p => p.id !== productId));
    };

    const isInWishlist = (productId: string) => {
        return items.some(p => p.id === productId);
    };

    const toggleItem = (product: Product) => {
        if (isInWishlist(product.id)) {
            removeItem(product.id);
        } else {
            addItem(product);
        }
    };

    return (
        <WishlistContext.Provider value={{ items, addItem, removeItem, isInWishlist, toggleItem }}>
            {children}
        </WishlistContext.Provider>
    );
}

export function useWishlist() {
    const context = useContext(WishlistContext);
    if (context === undefined) {
        throw new Error('useWishlist must be used within a WishlistProvider');
    }
    return context;
}