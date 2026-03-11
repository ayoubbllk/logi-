// ============================================================================
// EXEMPLE — Route admin uniquement : GET /api/users
// Accessible UNIQUEMENT aux utilisateurs avec le rôle ADMIN
// ============================================================================

import prisma from '@/lib/prisma';
import { requireAdmin, AuthError } from '@/lib/api-helpers';
import { apiSuccess, apiError } from '@/lib/utils';
import { AUTH_ERRORS } from '@/lib/constants';

// ── GET /api/users — Lister tous les utilisateurs (admin only) ──

export async function GET() {
  try {
    // 1. Vérifier que l'utilisateur est admin
    //    (lève AuthError 401 si non connecté, 403 si non admin)
    await requireAdmin();

    // 2. Récupérer tous les utilisateurs
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        nom: true,
        prenom: true,
        role: true,
        estActif: true,
        createdAt: true,
        _count: {
          select: { controlesCreees: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return apiSuccess({ users });
  } catch (error) {
    if (error instanceof AuthError) {
      return apiError(error.message, error.statusCode);
    }
    console.error('[GET USERS ERROR]', error);
    return apiError(AUTH_ERRORS.INTERNAL_ERROR, 500);
  }
}
