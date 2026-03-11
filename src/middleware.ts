// ============================================================================
// MIDDLEWARE NEXT.JS — Protection des routes, sécurité & contrôle d'accès
//
// Ce middleware s'exécute AVANT chaque requête côté serveur.
// Il gère :
//   1. Headers de sécurité (CSP, HSTS, X-Frame-Options…)
//   2. Rate limiting (login/register/API)
//   3. Protection CSRF (Origin check + double-submit cookie)
//   4. Authentification JWT
//   5. Contrôle d'accès basé sur les rôles (ADMIN / CONTROLEUR)
//   6. Injection des infos utilisateur dans les headers
//   7. Logging des requêtes
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromRequest, verifyJWT } from '@/lib/auth';
import { PUBLIC_ROUTES, ADMIN_ONLY_ROUTES, AUTH_ERRORS } from '@/lib/constants';
import { checkRateLimit, rateLimitHeaders, RATE_LIMIT_PRESETS } from '@/lib/rate-limit';
import { verifyCSRF, ensureCSRFCookie, applySecurityHeaders, getClientIP } from '@/lib/security';
import { logger } from '@/lib/logger';

// ── Routes que le middleware doit intercepter ──

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const startTime = Date.now();
  const clientIP = getClientIP(request);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 1. Rate limiting — protéger les endpoints sensibles
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  if (pathname === '/api/auth/login') {
    const result = checkRateLimit('auth_login', clientIP, RATE_LIMIT_PRESETS.AUTH_LOGIN);
    if (!result.allowed) {
      logger.security('Rate limit exceeded: login', { ip: clientIP });
      return NextResponse.json(
        { success: false, error: 'Trop de tentatives. Réessayez plus tard.' },
        { status: 429, headers: rateLimitHeaders(result) }
      );
    }
  }

  if (pathname === '/api/auth/register') {
    const result = checkRateLimit('auth_register', clientIP, RATE_LIMIT_PRESETS.AUTH_REGISTER);
    if (!result.allowed) {
      logger.security('Rate limit exceeded: register', { ip: clientIP });
      return NextResponse.json(
        { success: false, error: 'Trop de tentatives. Réessayez plus tard.' },
        { status: 429, headers: rateLimitHeaders(result) }
      );
    }
  }

  // Rate limit global API (hors auth)
  if (pathname.startsWith('/api/') && !pathname.startsWith('/api/auth/')) {
    const result = checkRateLimit('api', clientIP, RATE_LIMIT_PRESETS.API_STANDARD);
    if (!result.allowed) {
      logger.security('Rate limit exceeded: API', { ip: clientIP, meta: { path: pathname } });
      return NextResponse.json(
        { success: false, error: 'Trop de requêtes. Réessayez plus tard.' },
        { status: 429, headers: rateLimitHeaders(result) }
      );
    }
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 2. Protection CSRF — vérifier Origin/Referer sur les mutations
  //    (les routes d'auth sont exemptées : pas de cookie CSRF au login)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  const isAuthRoute = pathname.startsWith('/api/auth/');
  if (pathname.startsWith('/api/') && !isAuthRoute) {
    const csrfError = verifyCSRF(request);
    if (csrfError) {
      logger.security(csrfError, { ip: clientIP, meta: { path: pathname, method: request.method } });
      return NextResponse.json(
        { success: false, error: 'Requête non autorisée (CSRF).' },
        { status: 403 }
      );
    }
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 3. Routes publiques — check si authentifié
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  const isPublicRoute = PUBLIC_ROUTES.some((route) =>
    pathname === route || pathname.startsWith(route + '/')
  );

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 4. Extraire et vérifier le token JWT
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  const token = getTokenFromRequest(request);
  const user = token ? await verifyJWT(token) : null;

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 5. Utilisateur connecté sur page publique → redirection
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  if (isPublicRoute && user) {
    if (pathname === '/login') {
      return applySecurityHeaders(
        NextResponse.redirect(new URL('/dashboard', request.url))
      );
    }
    const response = applySecurityHeaders(NextResponse.next());
    return ensureCSRFCookie(request, response);
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 6. Route publique, pas de token → laisser passer
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  if (isPublicRoute) {
    const response = applySecurityHeaders(NextResponse.next());
    return ensureCSRFCookie(request, response);
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 7. Route protégée sans token → 401 / redirection login
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  if (!user) {
    if (pathname.startsWith('/api/')) {
      logger.debug('Unauthorized API access', { ip: clientIP, meta: { path: pathname } });
      return applySecurityHeaders(
        NextResponse.json(
          { success: false, error: AUTH_ERRORS.UNAUTHORIZED },
          { status: 401 }
        )
      );
    }

    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return applySecurityHeaders(
      NextResponse.redirect(loginUrl)
    );
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 8. Routes admin → vérification du rôle
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  const isAdminRoute = ADMIN_ONLY_ROUTES.some((route) =>
    pathname === route || pathname.startsWith(route + '/')
  );

  if (isAdminRoute && user.role !== 'ADMIN') {
    if (pathname.startsWith('/api/')) {
      logger.security('Forbidden: non-admin access attempt', {
        userId: user.sub,
        ip: clientIP,
        meta: { path: pathname },
      });
      return applySecurityHeaders(
        NextResponse.json(
          { success: false, error: AUTH_ERRORS.FORBIDDEN },
          { status: 403 }
        )
      );
    }

    const dashboardUrl = new URL('/dashboard', request.url);
    dashboardUrl.searchParams.set('error', 'forbidden');
    return applySecurityHeaders(
      NextResponse.redirect(dashboardUrl)
    );
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 9. OK — injecter les infos utilisateur + headers sécurité
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-user-id', user.sub);
  requestHeaders.set('x-user-email', user.email);
  requestHeaders.set('x-user-role', user.role);
  requestHeaders.set('x-user-nom', user.nom);
  requestHeaders.set('x-user-prenom', user.prenom);

  const response = applySecurityHeaders(
    NextResponse.next({
      request: { headers: requestHeaders },
    })
  );

  // Injecter le cookie CSRF si absent
  ensureCSRFCookie(request, response);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 10. Logging de la requête
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  const duration = Date.now() - startTime;
  if (pathname.startsWith('/api/')) {
    logger.request({
      method: request.method,
      path: pathname,
      statusCode: 200,
      duration,
      userId: user.sub,
      ip: clientIP,
    });
  }

  return response;
}
