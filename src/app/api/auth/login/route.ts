// ============================================================================
// API ROUTE — POST /api/auth/login
// Authentifie un utilisateur et retourne un cookie JWT
// ============================================================================

import { NextRequest } from 'next/server';
import { login } from '@/services/auth.service';
import { loginSchema, formatZodErrors } from '@/validations/auth.schema';
import { setAuthCookie } from '@/lib/auth';
import { apiSuccess, apiError } from '@/lib/utils';
import { AUTH_ERRORS } from '@/lib/constants';

export async function POST(request: NextRequest) {
  try {
    // 1. Parser le body
    const body = await request.json();

    // 2. Valider avec Zod
    const validation = loginSchema.safeParse(body);
    if (!validation.success) {
      return apiError(formatZodErrors(validation.error), 400);
    }

    // 3. Appeler le service d'authentification
    const result = await login(validation.data);

    if (!result.success) {
      return apiError(result.error, 401);
    }

    // 4. Créer le cookie HttpOnly
    await setAuthCookie(result.token);

    // 5. Retourner les données utilisateur (jamais le token dans le body)
    return apiSuccess({
      user: result.user,
      message: 'Connexion réussie',
    });
  } catch (error) {
    console.error('[LOGIN ERROR]', error);
    return apiError(AUTH_ERRORS.INTERNAL_ERROR, 500);
  }
}
