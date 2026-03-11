// ============================================================================
// API ROUTE — POST /api/fiches/[id]/validate
// Valider ou refuser une fiche de contrôle qualité
// Accès : ADMIN uniquement
// ============================================================================

import { NextRequest } from 'next/server';
import { requireAdmin, AuthError } from '@/lib/api-helpers';
import { apiSuccess, apiError } from '@/lib/utils';
import { AUTH_ERRORS } from '@/lib/constants';
import { decisionSchema } from '@/validations/validation.schema';
import { prendreDecision, ValidationError } from '@/services/validation.service';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Vérifier que c'est un admin
    const admin = await requireAdmin();
    const { id } = await params;

    // 2. Parser le body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return apiError('Le corps de la requête est invalide (JSON attendu)', 400);
    }

    // 3. Valider avec Zod
    const parsed = decisionSchema.safeParse(body);
    if (!parsed.success) {
      const erreurs = parsed.error.errors.map((e) => e.message).join(', ');
      return apiError(erreurs, 422);
    }

    // 4. Exécuter la décision via le service
    const result = await prendreDecision(id, admin.id, parsed.data);

    // 5. Retourner le résultat
    return apiSuccess({
      id: result.id,
      numero: result.numero,
      statut: result.statut,
      commentaire: result.commentaire,
      dateDecision: result.dateDecision.toISOString(),
      validatedBy: result.validatedBy,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return apiError(error.message, error.statusCode);
    }
    if (error instanceof ValidationError) {
      return apiError(error.message, error.statusCode);
    }
    console.error('[POST VALIDATE ERROR]', error);
    return apiError(AUTH_ERRORS.INTERNAL_ERROR, 500);
  }
}
