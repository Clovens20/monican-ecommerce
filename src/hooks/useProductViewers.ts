'use client';

import { useState, useEffect, useRef } from 'react';

interface UseProductViewersOptions {
    productId: string;
    interval?: number; // Heartbeat interval in milliseconds
}

export function useProductViewers({ productId, interval = 10000 }: UseProductViewersOptions) {
    const [viewerCount, setViewerCount] = useState<number | null>(null);
    const [isActive, setIsActive] = useState(true);
    const heartbeatRef = useRef<NodeJS.Timeout | null>(null);
    const cleanupRef = useRef<NodeJS.Timeout | null>(null);

    // ✅ CORRECTION: Générer sessionId de manière pure avec useState lazy initialization
    const [sessionId] = useState<string>(() => {
        if (typeof window === 'undefined') return '';
        
        const existing = localStorage.getItem(`viewer_session_${productId}`);
        if (existing) return existing;
        
        return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    });

    useEffect(() => {
        if (typeof window === 'undefined' || !productId) return;

        // Save session ID to localStorage
        localStorage.setItem(`viewer_session_${productId}`, sessionId);

        // Function to send heartbeat
        const sendHeartbeat = async () => {
            try {
                const response = await fetch('/api/product-viewers', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        productId,
                        sessionId: sessionId,
                        action: 'heartbeat',
                    }),
                });

                if (response.ok) {
                    const data = await response.json();
                    setViewerCount(data.viewerCount || 0);
                }
            } catch (error) {
                console.error('Error sending heartbeat:', error);
            }
        };

        // Function to register as viewer
        const registerViewer = async () => {
            try {
                const response = await fetch('/api/product-viewers', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        productId,
                        sessionId: sessionId,
                        action: 'register',
                    }),
                });

                if (response.ok) {
                    const data = await response.json();
                    setViewerCount(data.viewerCount || 0);
                }
            } catch (error) {
                console.error('Error registering viewer:', error);
            }
        };

        // Function to unregister as viewer
        const unregisterViewer = async () => {
            try {
                await fetch('/api/product-viewers', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        productId,
                        sessionId: sessionId,
                        action: 'unregister',
                    }),
                });
            } catch (error) {
                console.error('Error unregistering viewer:', error);
            }
        };

        // Initial registration
        registerViewer();

        // Set up heartbeat interval
        heartbeatRef.current = setInterval(() => {
            if (isActive) {
                sendHeartbeat();
            }
        }, interval);

        // Handle page visibility changes
        const handleVisibilityChange = () => {
            if (document.hidden) {
                setIsActive(false);
            } else {
                setIsActive(true);
                sendHeartbeat(); // Send immediately when page becomes visible
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        // Handle page unload
        const handleBeforeUnload = () => {
            unregisterViewer();
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        // Cleanup function
        return () => {
            const currentHeartbeat = heartbeatRef.current;
            const currentCleanup = cleanupRef.current;
            
            if (currentHeartbeat) {
                clearInterval(currentHeartbeat);
            }
            if (currentCleanup) {
                clearTimeout(currentCleanup);
            }
            unregisterViewer();
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [productId, interval, isActive, sessionId]);

    return viewerCount;
}