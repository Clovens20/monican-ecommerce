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

    // Generate a unique session ID for this viewer
    const sessionIdRef = useRef<string>(
        typeof window !== 'undefined' 
            ? localStorage.getItem(`viewer_session_${productId}`) || 
              `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
            : ''
    );

    useEffect(() => {
        if (typeof window === 'undefined' || !productId) return;

        // Save session ID to localStorage
        localStorage.setItem(`viewer_session_${productId}`, sessionIdRef.current);

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
                        sessionId: sessionIdRef.current,
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
                        sessionId: sessionIdRef.current,
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
                        sessionId: sessionIdRef.current,
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
            if (heartbeatRef.current) {
                clearInterval(heartbeatRef.current);
            }
            if (cleanupRef.current) {
                clearTimeout(cleanupRef.current);
            }
            unregisterViewer();
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [productId, interval, isActive]);

    return viewerCount;
}

