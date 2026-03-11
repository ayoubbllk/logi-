// ============================================================================
// API ROUTE — GET /api/validation/historique
// Historique des validations / rejets
// Accès : ADMIN uniquement
// ============================================================================

import { NextRequest } from 'next/server';
import { requireAdmin, AuthError } from '@/lib/api-helpers';
import { apiSuccess, apiError } from '@/lib/utils';
import { AUTH_ERRORS } from '@/lib/constants';
import { getHistoriqueValidations } from '@/services/validation.service';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const _admin = await requireAdmin();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') ?? '1');
    const limit = parseInt(searchParams.get('limit') ?? '20');
    const action = searchParams.get('action') as 'VALIDATION' | 'REJET' | null;

    const result = await getHistoriqueValidations({
      page,
      limit,
      action: action ?? undefined,
    });

    return apiSuccess(result);
  } catch (error) {
    if (error instanceof AuthError) {
      return apiError(error.message, error.statusCode);
    }
    console.error('[GET HISTORIQUE ERROR]', error);
    return apiError(AUTH_ERRORS.INTERNAL_ERROR, 500);
  }
}
