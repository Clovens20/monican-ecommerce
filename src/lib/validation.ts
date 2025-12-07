// ============================================================================
// VALIDATION ET SANITIZATION - Protection contre XSS et injections
// ============================================================================

import { z } from 'zod';

/**
 * Sanitize une chaîne de caractères pour éviter XSS
 * Retire les balises HTML dangereuses
 */
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }

  // Retirer les balises HTML
  let sanitized = input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, ''); // Retirer les event handlers

  // Échapper les caractères HTML restants
  sanitized = sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');

  return sanitized.trim();
}

/**
 * Sanitize un objet récursivement
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const sanitized = { ...obj };

  for (const key in sanitized) {
    if (typeof sanitized[key] === 'string') {
      sanitized[key] = sanitizeString(sanitized[key]) as any;
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      if (Array.isArray(sanitized[key])) {
        sanitized[key] = sanitized[key].map((item: any) =>
          typeof item === 'string' ? sanitizeString(item) : item
        ) as any;
      } else {
        sanitized[key] = sanitizeObject(sanitized[key]);
      }
    }
  }

  return sanitized;
}

/**
 * Valide et sanitize un email
 */
export function validateAndSanitizeEmail(email: string): string | null {
  const emailSchema = z.string().email().max(255);
  const result = emailSchema.safeParse(email.trim().toLowerCase());
  
  if (!result.success) {
    return null;
  }

  return result.data;
}

/**
 * Valide un numéro de téléphone (format basique)
 */
export function validatePhone(phone: string): boolean {
  // Format: +1234567890 ou 1234567890 (10-15 chiffres)
  const phoneRegex = /^\+?[1-9]\d{9,14}$/;
  return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
}

/**
 * Valide une URL
 */
export function validateURL(url: string): boolean {
  try {
    const urlObj = new URL(url);
    // Autoriser seulement HTTP/HTTPS
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Valide un type MIME d'image
 */
export function validateImageMimeType(mimeType: string): boolean {
  const allowedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
  ];
  return allowedTypes.includes(mimeType.toLowerCase());
}

/**
 * Valide la taille d'un fichier (en bytes)
 */
export function validateFileSize(size: number, maxSizeMB: number = 5): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return size <= maxSizeBytes;
}

/**
 * Schema Zod pour validation de base
 */
export const BaseValidationSchemas = {
  email: z.string().email().max(255),
  phone: z.string().regex(/^\+?[1-9]\d{9,14}$/).optional(),
  url: z.string().url(),
  nonEmptyString: z.string().min(1).max(10000),
  positiveNumber: z.number().positive(),
  nonNegativeNumber: z.number().min(0),
  uuid: z.string().uuid(),
  orderStatus: z.enum(['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'returned']),
  currency: z.enum(['USD', 'CAD', 'MXN']),
  country: z.enum(['US', 'CA', 'MX']),
};

/**
 * Helper pour valider avec Zod et sanitizer
 */
export function validateAndSanitize<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: z.ZodError } {
  const result = schema.safeParse(data);
  
  if (!result.success) {
    return { success: false, error: result.error };
  }

  // Sanitize les strings dans le résultat
  const sanitized = sanitizeObject(result.data as any) as T;
  
  return { success: true, data: sanitized };
}

