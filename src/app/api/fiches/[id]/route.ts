// ============================================================================
// API ROUTE — GET /api/fiches/[id] — Détail d'une fiche
// ============================================================================

import { NextRequest } from 'next/server';
import { requireAuth, AuthError } from '@/lib/api-helpers';
import { apiSuccess, apiError } from '@/lib/utils';
import { AUTH_ERRORS } from '@/lib/constants';
import { getFicheById } from '@/services/fiche.service';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const fiche = await getFicheById(id, user.id, user.role);

    if (!fiche) {
      return apiError('Fiche de contrôle introuvable', 404);
    }

    return apiSuccess(fiche);
  } catch (error) {
    if (error instanceof AuthError) {
      return apiError(error.message, error.statusCode);
    }
    console.error('[GET FICHE DETAIL ERROR]', error);
    return apiError(AUTH_ERRORS.INTERNAL_ERROR, 500);
  }
}
