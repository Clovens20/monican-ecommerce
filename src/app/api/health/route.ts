import { NextResponse } from 'next/server';
import { validateEnvironmentVariables } from '@/lib/env-validation';

/**
 * Route de santé pour vérifier l'état de l'application
 * Utile pour le monitoring et les health checks
 */
export async function GET() {
  try {
    const envCheck = validateEnvironmentVariables();
    
    const health = {
      status: envCheck.valid ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      checks: {
        environment: {
          status: envCheck.valid ? 'ok' : 'error',
          missing: envCheck.missing,
          warnings: envCheck.warnings,
        },
        database: 'unknown', // TODO: Ajouter un check de connexion Supabase
      },
    };

    const statusCode = envCheck.valid ? 200 : 503;

    return NextResponse.json(health, { status: statusCode });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: 'Health check failed',
      },
      { status: 503 }
    );
  }
}

