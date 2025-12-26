import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  compress: true,
  
  // ✅ Ignorer les erreurs ESLint pendant le build (temporaire)
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // ✅ Ignorer les erreurs TypeScript pendant le build (temporaire)
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Configuration des images optimisées
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'ujyjdqmqormbjyfuuwgq.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  
  // En-têtes de sécurité HTTP
  async headers() {
    const baseHeaders = [
      {
        key: 'X-DNS-Prefetch-Control',
        value: 'on'
      },
      {
        key: 'X-Frame-Options',
        value: 'SAMEORIGIN'
      },
      {
        key: 'X-Content-Type-Options',
        value: 'nosniff'
      },
      {
        key: 'X-XSS-Protection',
        value: '1; mode=block'
      },
      {
        key: 'Referrer-Policy',
        value: 'origin-when-cross-origin'
      },
      {
        key: 'Permissions-Policy',
        value: 'camera=(), microphone=(), geolocation=()'
      }
    ];

    return [
      // Headers pour les routes admin
      {
        source: '/admin/:path*',
        headers: [
          ...baseHeaders,
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://*.vercel-insights.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https: blob:",
              "font-src 'self' data:",
              "connect-src 'self' https: wss: https://api.stripe.com https://*.supabase.co",
              "frame-src 'self' https://js.stripe.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "worker-src 'self' blob:",
              "upgrade-insecure-requests",
            ].join('; ')
          },
        ],
      },
      // Headers pour toutes les autres routes
      {
        source: '/((?!admin).*)',
        headers: [
          ...baseHeaders,
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.vercel-insights.com https://js.stripe.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https: blob:",
              "font-src 'self' data:",
              "connect-src 'self' https: wss: https://api.stripe.com https://*.supabase.co",
              "frame-src 'self' https://js.stripe.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'self'",
              "worker-src 'self' blob:",
              "upgrade-insecure-requests",
            ].join('; ')
          },
        ],
      },
      // Headers pour les fichiers statiques
      {
        source: '/:path*.(jpg|jpeg|png|gif|svg|webp|avif|ico|woff|woff2|ttf|eot)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
  
  // Configuration Turbopack (optionnel)
  turbopack: {
    root: process.cwd(),
  },

  // Optimisations de production
  poweredByHeader: false,
  generateEtags: true,
  
  // Configuration expérimentale (optionnel)
  experimental: {
    optimizePackageImports: ['lucide-react', 'date-fns'],
  },
};

export default nextConfig;