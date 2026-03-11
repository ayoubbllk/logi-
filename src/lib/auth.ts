// ============================================================================
// AUTH UTILITIES — JWT + Cookie Management
// ============================================================================

import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { Role } from '@prisma/client';
import { AUTH_CONFIG } from './constants';

// ── Types ──

export interface JWTUserPayload extends JWTPayload {
  sub: string;       // userId
  email: string;
  role: Role;
  nom: string;
  prenom: string;
}

// ── Secret key encodée pour jose ──

function getSecretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 64) {
    throw new Error(
      'JWT_SECRET manquant ou trop court (minimum 64 caractères). Vérifiez votre .env'
    );
  }
  return new TextEncoder().encode(secret);
}

// ── Signer un JWT ──

export async function signJWT(payload: Omit<JWTUserPayload, 'iat' | 'exp'>): Promise<string> {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(AUTH_CONFIG.JWT_EXPIRATION)
    .sign(getSecretKey());
}

// ── Vérifier et décoder un JWT ──

export async function verifyJWT(token: string): Promise<JWTUserPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return payload as JWTUserPayload;
  } catch {
    return null;
  }
}

// ── Créer le cookie d'authentification ──

export async function setAuthCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(AUTH_CONFIG.COOKIE_NAME, token, {
    httpOnly: true,                          // Inaccessible au JavaScript client
    secure: process.env.NODE_ENV === 'production', // HTTPS uniquement en prod
    sameSite: 'strict',                      // Protection CSRF
    path: '/',
    maxAge: AUTH_CONFIG.COOKIE_MAX_AGE,      // 8h en secondes
  });
}

// ── Supprimer le cookie d'authentification ──

export async function removeAuthCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(AUTH_CONFIG.COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 0, // Expiration immédiate
  });
}

// ── Lire le token depuis le cookie ──

export async function getTokenFromCookies(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(AUTH_CONFIG.COOKIE_NAME)?.value ?? null;
}

// ── Lire le token depuis une requête (middleware) ──

export function getTokenFromRequest(request: NextRequest): string | null {
  return request.cookies.get(AUTH_CONFIG.COOKIE_NAME)?.value ?? null;
}

// ── Récupérer l'utilisateur courant depuis le cookie ──

export async function getCurrentUser(): Promise<JWTUserPayload | null> {
  const token = await getTokenFromCookies();
  if (!token) return null;
  return await verifyJWT(token);
}

// ── Vérifier qu'un utilisateur a un rôle spécifique ──

export function hasRole(user: JWTUserPayload | null, role: Role): boolean {
  return user?.role === role;
}

// ── Vérifier que l'utilisateur est admin ──

export function isAdmin(user: JWTUserPayload | null): boolean {
  return hasRole(user, 'ADMIN');
}
