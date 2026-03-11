// ============================================================================
// API ROUTE — POST /api/auth/logout
// Déconnexion — supprime le cookie JWT
// ============================================================================

import { removeAuthCookie } from '@/lib/auth';
import { apiSuccess, apiError } from '@/lib/utils';
import { AUTH_ERRORS } from '@/lib/constants';

export async function POST() {
  try {
    await removeAuthCookie();

    return apiSuccess({ message: 'Déconnexion réussie' });
  } catch (error) {
    console.error('[LOGOUT ERROR]', error);
    return apiError(AUTH_ERRORS.INTERNAL_ERROR, 500);
  }
}
