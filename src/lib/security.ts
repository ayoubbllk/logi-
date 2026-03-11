// ============================================================================
// SÉCURITÉ — Fonctions utilitaires CSRF, XSS, sanitization
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';

// ============================================================================
// 1. PROTECTION CSRF — Double Submit Cookie + Origin Check
// ============================================================================

const CSRF_COOKIE_NAME = 'qc-csrf-token';
const CSRF_HEADER_NAME = 'x-csrf-token';
const CSRF_TOKEN_LENGTH = 32;

/**
 * Génère un token CSRF cryptographiquement aléatoire.
 * Utilise l'API Web Crypto (compatible Edge Runtime).
 */
export function generateCSRFToken(): string {
  const bytes = new Uint8Array(CSRF_TOKEN_LENGTH);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Vérifie la protection CSRF sur une requête mutante (POST, PUT, DELETE, PATCH).
 * Deux vérifications :
 *   1. Origin / Referer header → doit correspondre à l'app
 *   2. Double-submit cookie → le header x-csrf-token doit égaler le cookie csrf
 *
 * @returns null si OK, un message d'erreur sinon
 */
export function verifyCSRF(request: NextRequest): string | null {
  const method = request.method.toUpperCase();

  // GET / HEAD / OPTIONS ne sont pas soumis au CSRF
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    return null;
  }

  // 1. Vérification Origin/Referer
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const allowedOrigin = new URL(appUrl).origin;

  if (origin && origin !== allowedOrigin) {
    return `CSRF: Origin mismatch (got ${origin}, expected ${allowedOrigin})`;
  }

  if (!origin && referer) {
    try {
      const refererOrigin = new URL(referer).origin;
      if (refererOrigin !== allowedOrigin) {
        return `CSRF: Referer mismatch`;
      }
    } catch {
      return 'CSRF: Invalid Referer header';
    }
  }

  // 2. Double-submit cookie (pour les API)
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const cookieToken = request.cookies.get(CSRF_COOKIE_NAME)?.value;
    const headerToken = request.headers.get(CSRF_HEADER_NAME);

    // Si le cookie existe, le header doit correspondre
    if (cookieToken && headerToken !== cookieToken) {
      return 'CSRF: Token mismatch';
    }
  }

  return null;
}

/**
 * Injecte le cookie CSRF si absent (pour le pattern double-submit).
 */
export function ensureCSRFCookie(
  request: NextRequest,
  response: NextResponse
): NextResponse {
  const existingToken = request.cookies.get(CSRF_COOKIE_NAME)?.value;

  if (!existingToken) {
    const token = generateCSRFToken();
    response.cookies.set(CSRF_COOKIE_NAME, token, {
      httpOnly: false, // Doit être lisible par le JS client pour le header
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 8 * 60 * 60, // 8h
    });
  }

  return response;
}

// ============================================================================
// 2. PROTECTION XSS — Sanitization des entrées
// ============================================================================

/**
 * Élimine les caractères/balises HTML dangereuses d'une chaîne.
 * Ne doit PAS remplacer l'échappement React (qui est automatique),
 * mais protège les données qui seraient utilisées dans des contextes non-React
 * (PDF, emails, logs, exports CSV…).
 */
export function sanitizeString(input: string): string {
  return input
    // Supprimer les balises HTML/script
    .replace(/<\/?[^>]+(>|$)/g, '')
    // Encoder les caractères spéciaux HTML
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    // Supprimer les event handlers JS inline (onload, onerror, etc.)
    .replace(/on\w+\s*=/gi, '')
    // Supprimer javascript: urls
    .replace(/javascript\s*:/gi, '')
    // Supprimer data: urls potentiellement dangereuses
    .replace(/data\s*:\s*text\/html/gi, '')
    .trim();
}

/**
 * Sanitize récursivement toutes les chaînes dans un objet/tableau.
 */
export function sanitizeDeep<T>(data: T): T {
  if (typeof data === 'string') {
    return sanitizeString(data) as T;
  }

  if (Array.isArray(data)) {
    return data.map(sanitizeDeep) as T;
  }

  if (data !== null && typeof data === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      sanitized[key] = sanitizeDeep(value);
    }
    return sanitized as T;
  }

  return data;
}

// ============================================================================
// 3. HEADERS DE SÉCURITÉ
// ============================================================================

/**
 * Headers de sécurité HTTP à injecter dans chaque réponse.
 * Conformes aux recommandations OWASP et aux best practices N.js.
 */
export const SECURITY_HEADERS: Record<string, string> = {
  // Empêcher le MIME sniffing
  'X-Content-Type-Options': 'nosniff',
  // Empêcher le clickjacking
  'X-Frame-Options': 'DENY',
  // Protection XSS navigateur (legacy, toujours utile)
  'X-XSS-Protection': '1; mode=block',
  // HSTS — forcer HTTPS pendant 2 ans
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  // Contrôlement du Referrer
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  // Désactiver les API navigateur non utilisées
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  // CSP — Content Security Policy
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",  // Next.js requires unsafe-eval in dev
    "style-src 'self' 'unsafe-inline'",                   // TailwindCSS inline styles
    "img-src 'self' data: blob:",
    "font-src 'self'",
    "connect-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; '),
  // Empêcher DNS prefetching vers des domaines tiers
  'X-DNS-Prefetch-Control': 'off',
  // Déclarer le format du document
  'X-Permitted-Cross-Domain-Policies': 'none',
};

/**
 * Applique les headers de sécurité sur une réponse NextResponse.
 */
export function applySecurityHeaders(response: NextResponse): NextResponse {
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }
  return response;
}

// ============================================================================
// 4. IP EXTRACTION
// ============================================================================

/**
 * Extrait l'adresse IP du client depuis la requête.
 * Prend en compte les proxys (X-Forwarded-For, X-Real-IP).
 */
export function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    // Prendre la première IP (le client original)
    return forwarded.split(',')[0].trim();
  }

  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP.trim();
  }

  // Fallback
  return request.headers.get('x-client-ip') ?? '127.0.0.1';
}
