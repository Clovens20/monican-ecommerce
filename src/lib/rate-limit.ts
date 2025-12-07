// ============================================================================
// RATE LIMITING - Protection contre les attaques brute force et DDoS
// ✅ CORRECTION 3: Utilise Supabase pour un rate limiting distribué
// ============================================================================

import { NextRequest } from 'next/server';
import { supabaseAdmin } from './supabase';

// Fallback en mémoire si Supabase n'est pas disponible
interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}
const memoryStore: RateLimitStore = {};

const RATE_LIMIT_CONFIG = {
  checkout: { requests: 10, window: 60 * 1000 },
  api: { requests: 100, window: 60 * 1000 },
  login: { requests: 5, window: 15 * 60 * 1000 },
  search: { requests: 50, window: 60 * 1000 },
  webhook: { requests: 1000, window: 60 * 1000 },
  upload: { requests: 20, window: 60 * 60 * 1000 },
} as const;

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

// Configuration pour compatibilité avec l'ancien code
export const RATE_LIMITS = {
  login: { limit: 5, windowMs: 15 * 60 * 1000 },
  api: { limit: 100, windowMs: 60 * 1000 },
  checkout: { limit: 10, windowMs: 60 * 1000 },
  webhook: { limit: 1000, windowMs: 60 * 1000 },
  upload: { limit: 20, windowMs: 60 * 60 * 1000 },
} as const;

/**
 * Rate limiting avec Supabase (production)
 */
export async function rateLimit(
  request: NextRequest,
  type: keyof typeof RATE_LIMIT_CONFIG = 'api'
): Promise<RateLimitResult> {
  const config = RATE_LIMIT_CONFIG[type];
  const identifier = getIdentifier(request);
  
  try {
    return await rateLimitWithSupabase(identifier, type, config);
  } catch (error) {
    console.error('Rate limit Supabase error:', error);
    // En cas d'erreur Supabase, utiliser le fallback mémoire
    return rateLimitWithMemory(identifier, type, config);
  }
}

/**
 * Rate limiting avec Supabase (production)
 * Utilise la fonction SQL check_rate_limit pour atomicité
 */
async function rateLimitWithSupabase(
  identifier: string,
  type: keyof typeof RATE_LIMIT_CONFIG,
  config: { requests: number; window: number }
): Promise<RateLimitResult> {
  try {
    const { data, error } = await supabaseAdmin.rpc('check_rate_limit', {
      p_identifier: identifier,
      p_type: type,
      p_limit: config.requests,
      p_window_ms: config.window,
    });

    if (error) {
      console.error('Rate limit SQL error:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      // En cas d'erreur, autoriser la requête (fail-open)
      return {
        success: true,
        limit: config.requests,
        remaining: config.requests,
        reset: Date.now() + config.window,
      };
    }

    const result = data[0];
    const allowed = result.allowed as boolean;
    const remaining = result.remaining as number;
    const resetAt = result.reset_at as number;
    const count = result.count as number;

    return {
      success: allowed,
      limit: config.requests,
      remaining: Math.max(0, remaining),
      reset: resetAt,
    };
  } catch (error) {
    console.error('Rate limit Supabase error:', error);
    throw error;
  }
}

/**
 * Rate limiting avec mémoire (fallback)
 */
function rateLimitWithMemory(
  identifier: string,
  type: keyof typeof RATE_LIMIT_CONFIG,
  config: { requests: number; window: number }
): RateLimitResult {
  const now = Date.now();
  const key = `${type}:${identifier}`;
  const entry = memoryStore[key];

  if (!entry || entry.resetTime < now) {
    memoryStore[key] = {
      count: 1,
      resetTime: now + config.window,
    };
    return {
      success: true,
      limit: config.requests,
      remaining: config.requests - 1,
      reset: now + config.window,
    };
  }

  entry.count += 1;

  if (entry.count > config.requests) {
    return {
      success: false,
      limit: config.requests,
      remaining: 0,
      reset: entry.resetTime,
    };
  }

  return {
    success: true,
    limit: config.requests,
    remaining: config.requests - entry.count,
    reset: entry.resetTime,
  };
}

/**
 * Obtient l'identifiant unique pour le rate limiting
 */
function getIdentifier(request: NextRequest): string {
  const userId = request.headers.get('x-user-id');
  if (userId) return `user:${userId}`;
  
  return `ip:${getClientIP(request)}`;
}

/**
 * Obtient l'IP de la requête
 */
export function getClientIP(request: Request | NextRequest): string {
  // Vérifier les headers proxy (Vercel, Cloudflare, etc.)
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP.trim();
  }

  // Fallback (ne devrait jamais arriver en production)
  return 'unknown';
}

/**
 * Middleware helper pour Next.js API routes (compatibilité)
 */
export function rateLimitMiddleware(
  request: Request,
  config: { limit: number; windowMs: number }
): Response | null {
  // Convertir Request en NextRequest pour compatibilité
  const nextRequest = request as unknown as NextRequest;
  
  // Déterminer le type depuis la config
  let type: keyof typeof RATE_LIMIT_CONFIG = 'api';
  for (const [key, value] of Object.entries(RATE_LIMITS)) {
    if (value.limit === config.limit && value.windowMs === config.windowMs) {
      type = key as keyof typeof RATE_LIMIT_CONFIG;
      break;
    }
  }

  // Utiliser la nouvelle fonction async (on doit la rendre synchrone pour compatibilité)
  // Pour une vraie migration, il faudrait rendre toutes les routes async
  const ip = getClientIP(request);
  
  // Fallback synchrone avec mémoire pour compatibilité immédiate
  const now = Date.now();
  const key = `${type}:${ip}`;
  const entry = memoryStore[key];

  if (!entry || entry.resetTime < now) {
    memoryStore[key] = {
      count: 1,
      resetTime: now + config.windowMs,
    };
    return null;
  }

  entry.count += 1;

  if (entry.count > config.limit) {
    return new Response(
      JSON.stringify({
        error: 'Trop de requêtes',
        message: `Limite de ${config.limit} requêtes atteinte. Réessayez dans ${Math.ceil((entry.resetTime - now) / 1000)} secondes.`,
        retryAfter: Math.ceil((entry.resetTime - now) / 1000),
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': config.limit.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': new Date(entry.resetTime).toISOString(),
          'Retry-After': Math.ceil((entry.resetTime - now) / 1000).toString(),
        },
      }
    );
  }

  return null;
}

/**
 * Fonction de compatibilité pour checkRateLimit
 */
export function checkRateLimit(
  identifier: string,
  limit: number,
  windowMs: number
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const key = identifier;
  const entry = memoryStore[key];

  if (!entry || entry.resetTime < now) {
    memoryStore[key] = {
      count: 1,
      resetTime: now + windowMs,
    };
    return {
      allowed: true,
      remaining: limit - 1,
      resetAt: now + windowMs,
    };
  }

  entry.count += 1;

  if (entry.count > limit) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetTime,
    };
  }

  return {
    allowed: true,
    remaining: limit - entry.count,
    resetAt: entry.resetTime,
  };
}

