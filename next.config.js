/** @type {import('next').NextConfig} */
const nextConfig = {
  // ── Mode standalone pour Docker ──
  // Génère un dossier .next/standalone autonome (~100 MB vs ~1 GB node_modules)
  output: 'standalone',

  // ── Désactiver le header X-Powered-By ──
  // Évite de révéler la stack technique aux attaquants
  poweredByHeader: false,

  // ── Compression ──
  // En production derrière Nginx/Caddy, désactiver (le reverse proxy s'en charge)
  // En standalone, activer
  compress: true,

  // ── Optimisation des images ──
  images: {
    // Formats modernes prioritaires
    formats: ['image/avif', 'image/webp'],
    // Domaines autorisés (ajouter si CDN)
    remotePatterns: [],
    // Taille max de cache (Mo)
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 jours
  },

  // ── Strict Mode React (détection des problèmes en dev) ──
  reactStrictMode: true,

  // ── Headers de sécurité HTTP ──
  // Appliqués à TOUTES les réponses (pages + assets)
  // Les headers critiques sont aussi injectés dans le middleware pour les API
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          },
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'off',
          },
          // HSTS — uniquement en production (sinon localhost bloque)
          ...(process.env.NODE_ENV === 'production'
            ? [
                {
                  key: 'Strict-Transport-Security',
                  value: 'max-age=63072000; includeSubDomains; preload',
                },
              ]
            : []),
          // CSP — Content Security Policy
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob:",
              "font-src 'self'",
              "connect-src 'self'",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; '),
          },
        ],
      },
    ];
  },

  // ── Redirections de sécurité ──
  async redirects() {
    return [
      // Rediriger / vers /dashboard
      {
        source: '/',
        destination: '/dashboard',
        permanent: false,
      },
    ];
  },

  // ── Variables d'environnement exposées au client ──
  // Ne JAMAIS exposer JWT_SECRET ou DATABASE_URL ici
  env: {
    NEXT_PUBLIC_APP_NAME: 'Contrôle Qualité',
  },

  // ── Configuration expérimentale ──
  experimental: {
    // Optimiser les imports de packages
    optimizePackageImports: ['chart.js', 'react-chartjs-2', 'jspdf'],
  },
};

module.exports = nextConfig;
