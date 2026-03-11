// ============================================================================
// API ROUTE — GET /api/auth/me
// Retourne l'utilisateur actuellement connecté
// ============================================================================

import { getCurrentUser } from '@/lib/auth';
import { getUserById } from '@/services/auth.service';
import { apiSuccess, apiError } from '@/lib/utils';
import { AUTH_ERRORS } from '@/lib/constants';

export async function GET() {
  try {
    // 1. Vérifier le JWT dans le cookie
    const payload = await getCurrentUser();

    if (!payload || !payload.sub) {
      return apiError(AUTH_ERRORS.UNAUTHORIZED, 401);
    }

    // 2. Chercher l'utilisateur en base (données fraîches)
    const user = await getUserById(payload.sub);

    if (!user) {
      return apiError(AUTH_ERRORS.UNAUTHORIZED, 401);
    }

    if (!user.estActif) {
      return apiError(AUTH_ERRORS.USER_INACTIVE, 403);
    }

    // 3. Retourner les données
    return apiSuccess({ user });
  } catch (error) {
    console.error('[ME ERROR]', error);
    return apiError(AUTH_ERRORS.INTERNAL_ERROR, 500);
  }
}
