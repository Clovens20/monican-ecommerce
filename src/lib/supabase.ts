// CHEMIN: src/lib/supabase.ts
// Configuration des clients Supabase

import { createClient } from '@supabase/supabase-js';

// Récupérer les variables d'environnement
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-service-role-key';

// Vérifier que les variables sont configurées (en développement)
if (process.env.NODE_ENV === 'development') {
  if (!supabaseUrl || supabaseUrl === 'https://placeholder.supabase.co') {
    console.warn('⚠️ NEXT_PUBLIC_SUPABASE_URL n\'est pas configuré');
  }
  if (!supabaseServiceRoleKey || supabaseServiceRoleKey === 'placeholder-service-role-key') {
    console.warn('⚠️ SUPABASE_SERVICE_ROLE_KEY n\'est pas configuré');
  } else {
    console.log('✅ SUPABASE_SERVICE_ROLE_KEY configurée (longueur:', supabaseServiceRoleKey.length, 'caractères)');
  }
}

// Client pour le côté serveur (avec service_role key)
// La clé service role devrait bypasser RLS automatiquement
export const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseServiceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false
    },
    db: {
      schema: 'public'
    },
    global: {
      headers: {
        'apikey': supabaseServiceRoleKey,
        'Authorization': `Bearer ${supabaseServiceRoleKey}`
      }
    }
  }
);

// Client pour le côté client (avec anon key)
export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
      heartbeatIntervalMs: 30000, // 30 secondes
      reconnectAfterMs: (tries: number) => Math.min(tries * 1000, 30000),
    },
    global: {
      headers: {
        'x-client-info': 'monican-ecommerce',
      },
    },
  }
);

// ============================================================================
// ✅ CORRECTION 5: Connection Pooling avec Circuit Breaker
// ============================================================================

/**
 * Classe pour gérer les connexions avec circuit breaker pattern
 */
class DatabaseClient {
  private failureCount = 0;
  private lastFailureTime = 0;
  private circuitOpen = false;
  private readonly FAILURE_THRESHOLD = 5;
  private readonly CIRCUIT_TIMEOUT = 60000; // 60 secondes

  /**
   * Exécute une requête avec retry et circuit breaker
   */
  async query<T>(
    queryFn: () => Promise<T>,
    maxRetries: number = 3
  ): Promise<T> {
    // Vérifier si le circuit breaker est ouvert
    if (this.circuitOpen) {
      // Tenter de réinitialiser après le timeout
      if (Date.now() - this.lastFailureTime > this.CIRCUIT_TIMEOUT) {
        console.log('🔄 Circuit breaker: Tentative de reset');
        this.circuitOpen = false;
        this.failureCount = 0;
      } else {
        const remainingTime = Math.ceil((this.CIRCUIT_TIMEOUT - (Date.now() - this.lastFailureTime)) / 1000);
        throw new Error(`Circuit breaker ouvert. Réessayez dans ${remainingTime} secondes.`);
      }
    }

    let lastError: any;

    // Retry avec exponential backoff
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await queryFn();

        // Réinitialiser le compteur d'échecs en cas de succès
        if (this.failureCount > 0) {
          this.failureCount = Math.max(0, this.failureCount - 1);
        }

        return result;

      } catch (error: any) {
        lastError = error;
        console.error(`❌ Tentative ${attempt}/${maxRetries}:`, error.message);

        this.failureCount++;
        this.lastFailureTime = Date.now();

        // Ouvrir le circuit breaker si trop d'échecs
        if (this.failureCount >= this.FAILURE_THRESHOLD) {
          console.error(`🚨 Circuit breaker ouvert (${this.failureCount} échecs)`);
          this.circuitOpen = true;
          throw new Error('Circuit breaker ouvert - trop d\'échecs consécutifs');
        }

        // Attendre avant de réessayer (exponential backoff)
        if (attempt < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError;
  }

  /**
   * Obtient le statut du circuit breaker
   */
  getStatus() {
    return {
      open: this.circuitOpen,
      failures: this.failureCount,
      lastFailure: this.lastFailureTime,
      timeUntilReset: this.circuitOpen 
        ? Math.max(0, this.CIRCUIT_TIMEOUT - (Date.now() - this.lastFailureTime))
        : 0,
    };
  }

  /**
   * Réinitialise manuellement le circuit breaker
   */
  reset() {
    this.circuitOpen = false;
    this.failureCount = 0;
    this.lastFailureTime = 0;
    console.log('✅ Circuit breaker réinitialisé');
  }
}

export const dbClient = new DatabaseClient();

/**
 * Exécute une requête Supabase avec gestion d'erreurs et retry
 */
export async function safeQuery<T>(
  queryFn: () => Promise<{ data: T | null; error: any }>
): Promise<T> {
  return dbClient.query(async () => {
    const { data, error } = await queryFn();

    if (error) {
      throw new Error(error.message || 'Erreur base de données');
    }

    if (!data) {
      throw new Error('Aucune donnée retournée');
    }

    return data;
  });
}