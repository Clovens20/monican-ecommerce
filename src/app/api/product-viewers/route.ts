import { NextRequest, NextResponse } from 'next/server';

// In-memory store for active viewers
// In production, you might want to use Redis or a database
interface ViewerSession {
    sessionId: string;
    productId: string;
    lastSeen: number;
}

// Store: productId -> Map<sessionId, ViewerSession>
const activeViewers = new Map<string, Map<string, ViewerSession>>();

// Cleanup interval: remove viewers inactive for more than 30 seconds
const CLEANUP_INTERVAL = 30000; // 30 seconds
const INACTIVE_THRESHOLD = 30000; // 30 seconds

// Start cleanup interval
if (typeof setInterval !== 'undefined') {
    setInterval(() => {
        const now = Date.now();
        activeViewers.forEach((sessions, productId) => {
            sessions.forEach((session, sessionId) => {
                if (now - session.lastSeen > INACTIVE_THRESHOLD) {
                    sessions.delete(sessionId);
                }
            });
            // Remove product entry if no active viewers
            if (sessions.size === 0) {
                activeViewers.delete(productId);
            }
        });
    }, CLEANUP_INTERVAL);
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { productId, sessionId, action } = body;

        if (!productId || !sessionId) {
            return NextResponse.json(
                { error: 'productId and sessionId are required' },
                { status: 400 }
            );
        }

        // Get or create product viewers map
        if (!activeViewers.has(productId)) {
            activeViewers.set(productId, new Map());
        }

        const productViewers = activeViewers.get(productId)!;
        const now = Date.now();

        switch (action) {
            case 'register':
            case 'heartbeat':
                // Register or update viewer
                productViewers.set(sessionId, {
                    sessionId,
                    productId,
                    lastSeen: now,
                });
                break;

            case 'unregister':
                // Remove viewer
                productViewers.delete(sessionId);
                break;

            default:
                return NextResponse.json(
                    { error: 'Invalid action' },
                    { status: 400 }
                );
        }

        // Clean up inactive viewers for this product
        productViewers.forEach((session, sid) => {
            if (now - session.lastSeen > INACTIVE_THRESHOLD) {
                productViewers.delete(sid);
            }
        });

        // Get current viewer count
        const viewerCount = productViewers.size;

        return NextResponse.json({
            success: true,
            viewerCount,
            productId,
        });
    } catch (error) {
        console.error('Error in product-viewers API:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// GET endpoint to fetch current viewer count
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const productId = searchParams.get('productId');

        if (!productId) {
            return NextResponse.json(
                { error: 'productId is required' },
                { status: 400 }
            );
        }

        const productViewers = activeViewers.get(productId);
        const viewerCount = productViewers ? productViewers.size : 0;

        // Clean up inactive viewers
        if (productViewers) {
            const now = Date.now();
            productViewers.forEach((session, sessionId) => {
                if (now - session.lastSeen > INACTIVE_THRESHOLD) {
                    productViewers.delete(sessionId);
                }
            });
        }

        return NextResponse.json({
            success: true,
            viewerCount: productViewers ? productViewers.size : 0,
            productId,
        });
    } catch (error) {
        console.error('Error in product-viewers GET API:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

