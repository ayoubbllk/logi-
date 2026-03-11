// ============================================================================
// API ROUTE — GET /api/validation/en-attente
// Lister les fiches en attente de validation
// Accès : ADMIN uniquement
// ============================================================================

import { NextRequest } from 'next/server';
import { requireAdmin, AuthError } from '@/lib/api-helpers';
import { apiSuccess, apiError } from '@/lib/utils';
import { AUTH_ERRORS } from '@/lib/constants';
import { listFichesEnAttente } from '@/services/validation.service';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const _admin = await requireAdmin();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') ?? '1');
    const limit = parseInt(searchParams.get('limit') ?? '10');
    const search = searchParams.get('search') ?? undefined;
    const produit = searchParams.get('produit') ?? undefined;

    const result = await listFichesEnAttente({ page, limit, search, produit });

    return apiSuccess(result);
  } catch (error) {
    if (error instanceof AuthError) {
      return apiError(error.message, error.statusCode);
    }
    console.error('[GET EN ATTENTE ERROR]', error);
    return apiError(AUTH_ERRORS.INTERNAL_ERROR, 500);
  }
}
