// ============================================================================
// API ROUTE — POST /api/auth/register
// Inscription d'un nouvel utilisateur (réservé aux admins en production)
// ============================================================================

import { NextRequest } from 'next/server';
import { register } from '@/services/auth.service';
import { registerSchema, formatZodErrors } from '@/validations/auth.schema';
import { getCurrentUser, isAdmin, setAuthCookie } from '@/lib/auth';
import { apiSuccess, apiError } from '@/lib/utils';
import { AUTH_ERRORS } from '@/lib/constants';

export async function POST(request: NextRequest) {
  try {
    // 1. Vérifier que l'appelant est un admin (sauf premier utilisateur)
    const currentUser = await getCurrentUser();

    // Si des utilisateurs existent déjà, seul un admin peut en créer
    // En développement, on permet la création sans auth pour le premier user
    if (currentUser && !isAdmin(currentUser)) {
      return apiError(AUTH_ERRORS.FORBIDDEN, 403);
    }

    // 2. Parser le body
    const body = await request.json();

    // 3. Valider avec Zod
    const validation = registerSchema.safeParse(body);
    if (!validation.success) {
      return apiError(formatZodErrors(validation.error), 400);
    }

    // 4. Si non-admin essaie de créer un admin, refuser
    if (validation.data.role === 'ADMIN' && currentUser && !isAdmin(currentUser)) {
      return apiError('Seul un admin peut créer un compte administrateur', 403);
    }

    // 5. Appeler le service d'inscription
    const result = await register(validation.data);

    if (!result.success) {
      return apiError(result.error, 409);
    }

    // 6. Si pas d'utilisateur connecté (premier user), connecter automatiquement
    if (!currentUser) {
      await setAuthCookie(result.token);
    }

    // 7. Retourner les données du nouvel utilisateur
    return apiSuccess(
      {
        user: result.user,
        message: 'Utilisateur créé avec succès',
      },
      201
    );
  } catch (error) {
    console.error('[REGISTER ERROR]', error);
    return apiError(AUTH_ERRORS.INTERNAL_ERROR, 500);
  }
}
