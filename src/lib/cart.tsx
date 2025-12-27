'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Product } from '@/lib/products';

export interface CartItem extends Product {
    cartId: string;
    selectedSize: string;
    quantity: number;
}

interface CartContextType {
    items: CartItem[];
    addItem: (product: Product, size: string) => void;
    removeItem: (cartId: string) => void;
    updateQuantity: (cartId: string, quantity: number) => void;
    clearCart: () => void;
    total: number;
    itemCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
    const [items, setItems] = useState<CartItem[]>([]);

    // ✅ CORRECTION: Charger depuis localStorage de manière asynchrone
    useEffect(() => {
        const loadCart = () => {
            const saved = localStorage.getItem('monican_cart');
            if (saved) {
                try {
                    setItems(JSON.parse(saved));
                } catch (e) {
                    console.error('Failed to parse cart', e);
                }
            }
        };
        
        // Utiliser queueMicrotask pour éviter l'appel synchrone
        queueMicrotask(loadCart);
    }, []);

    // Save to local storage on change
    useEffect(() => {
        localStorage.setItem('monican_cart', JSON.stringify(items));
    }, [items]);

    const addItem = (product: Product, size: string) => {
        setItems((prev) => {
            const existing = prev.find((item) => item.id === product.id && item.selectedSize === size);
            if (existing) {
                return prev.map((item) =>
                    item.cartId === existing.cartId
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            }
            return [...prev, { ...product, selectedSize: size, quantity: 1, cartId: `${product.id}-${size}-${Date.now()}` }];
        });
    };

    const removeItem = (cartId: string) => {
        setItems((prev) => prev.filter((item) => item.cartId !== cartId));
    };

    const updateQuantity = (cartId: string, quantity: number) => {
        if (quantity < 1) return removeItem(cartId);
        setItems((prev) =>
            prev.map((item) => (item.cartId === cartId ? { ...item, quantity } : item))
        );
    };

    const clearCart = () => setItems([]);

    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

    return (
        <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, total, itemCount }}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
}