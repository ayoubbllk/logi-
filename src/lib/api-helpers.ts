// ============================================================================
// HELPERS API — Fonctions utilitaires pour les Route Handlers protégés
// Simplifie l'extraction des infos utilisateur injectées par le middleware
// ============================================================================

import { headers } from 'next/headers';
import { Role } from '@prisma/client';
import { apiError } from '@/lib/utils';
import { AUTH_ERRORS } from '@/lib/constants';

// ── Infos utilisateur extraites des headers (injectées par le middleware) ──

export interface RequestUser {
  id: string;
  email: string;
  role: Role;
  nom: string;
  prenom: string;
}

// ── Récupérer l'utilisateur depuis les headers du middleware ──

export async function getRequestUser(): Promise<RequestUser | null> {
  const headersList = await headers();
  const id = headersList.get('x-user-id');
  const email = headersList.get('x-user-email');
  const role = headersList.get('x-user-role') as Role | null;
  const nom = headersList.get('x-user-nom');
  const prenom = headersList.get('x-user-prenom');

  if (!id || !email || !role) return null;

  return { id, email, role, nom: nom ?? '', prenom: prenom ?? '' };
}

// ── Guard : exiger une authentification ──

export async function requireAuth() {
  const user = await getRequestUser();
  if (!user) {
    throw new AuthError(AUTH_ERRORS.UNAUTHORIZED, 401);
  }
  return user;
}

// ── Guard : exiger le rôle admin ──

export async function requireAdmin() {
  const user = await requireAuth();
  if (user.role !== 'ADMIN') {
    throw new AuthError(AUTH_ERRORS.FORBIDDEN, 403);
  }
  return user;
}

// ── Guard : exiger un rôle spécifique ──

export async function requireRole(role: Role) {
  const user = await requireAuth();
  if (user.role !== role) {
    throw new AuthError(AUTH_ERRORS.FORBIDDEN, 403);
  }
  return user;
}

// ── Classe d'erreur auth pour un try/catch propre ──

export class AuthError extends Error {
  constructor(
    message: string,
    public statusCode: number
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

// ── Handler wrapper avec gestion d'erreur automatique ──

export function withAuth(
  handler: (user: RequestUser) => Promise<Response>
) {
  return async () => {
    try {
      const user = await requireAuth();
      return await handler(user);
    } catch (error) {
      if (error instanceof AuthError) {
        return apiError(error.message, error.statusCode);
      }
      console.error('[API ERROR]', error);
      return apiError(AUTH_ERRORS.INTERNAL_ERROR, 500);
    }
  };
}

// ── Handler wrapper admin avec gestion d'erreur automatique ──

export function withAdmin(
  handler: (admin: RequestUser) => Promise<Response>
) {
  return async () => {
    try {
      const admin = await requireAdmin();
      return await handler(admin);
    } catch (error) {
      if (error instanceof AuthError) {
        return apiError(error.message, error.statusCode);
      }
      console.error('[API ERROR]', error);
      return apiError(AUTH_ERRORS.INTERNAL_ERROR, 500);
    }
  };
}
