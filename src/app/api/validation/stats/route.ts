// ============================================================================
// API ROUTE — GET /api/validation/stats
// Statistiques rapides pour l'interface de validation admin
// Accès : ADMIN uniquement
// ============================================================================

import { requireAdmin, AuthError } from '@/lib/api-helpers';
import { apiSuccess, apiError } from '@/lib/utils';
import { AUTH_ERRORS } from '@/lib/constants';
import { getValidationStats } from '@/services/validation.service';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const _admin = await requireAdmin();
    const stats = await getValidationStats();
    return apiSuccess(stats);
  } catch (error) {
    if (error instanceof AuthError) {
      return apiError(error.message, error.statusCode);
    }
    console.error('[GET VALIDATION STATS ERROR]', error);
    return apiError(AUTH_ERRORS.INTERNAL_ERROR, 500);
  }
}
