// ============================================================================
// API ROUTE — GET /api/stats
// Retourne les statistiques du dashboard
// Admin → toutes les fiches | Contrôleur → ses fiches uniquement
// ============================================================================

import { requireAuth, AuthError } from '@/lib/api-helpers';
import {
  getDashboardStats,
  getDashboardStatsControleur,
} from '@/services/stats.service';
import { apiSuccess, apiError } from '@/lib/utils';
import { AUTH_ERRORS } from '@/lib/constants';

export const dynamic = 'force-dynamic'; // Pas de cache — données temps réel

export async function GET() {
  try {
    const user = await requireAuth();

    // Admin → stats globales | Contrôleur → ses stats uniquement
    const stats =
      user.role === 'ADMIN'
        ? await getDashboardStats()
        : await getDashboardStatsControleur(user.id);

    return apiSuccess(stats);
  } catch (error) {
    if (error instanceof AuthError) {
      return apiError(error.message, error.statusCode);
    }
    console.error('[GET STATS ERROR]', error);
    return apiError(AUTH_ERRORS.INTERNAL_ERROR, 500);
  }
}
