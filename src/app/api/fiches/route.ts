// ============================================================================
// ROUTES — GET /api/fiches + POST /api/fiches
// GET  : Lister les fiches (admin = toutes, contrôleur = les siennes)
// POST : Créer une nouvelle fiche de contrôle qualité
// ============================================================================

import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth, AuthError } from '@/lib/api-helpers';
import { apiSuccess, apiError } from '@/lib/utils';
import { AUTH_ERRORS } from '@/lib/constants';
import { validateCreateFiche, createFicheSchema } from '@/validations/fiche.schema';
import { createFiche } from '@/services/fiche.service';

export const dynamic = 'force-dynamic';

// ── GET /api/fiches — Lister les fiches de contrôle ──

export async function GET(request: NextRequest) {
  try {
    // 1. Vérifier l'authentification (lève une AuthError si non connecté)
    const user = await requireAuth();

    // 2. Paramètres de pagination & filtres
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') ?? '1');
    const limit = parseInt(searchParams.get('limit') ?? '20');
    const statut = searchParams.get('statut');
    const produit = searchParams.get('produit');
    const skip = (page - 1) * limit;

    // 3. Construire le filtre — le contrôleur ne voit que ses fiches
    const where = {
      // ── CONTRÔLE D'ACCÈS PAR RÔLE ──
      // Admin → toutes les fiches | Contrôleur → uniquement les siennes
      ...(user.role === 'CONTROLEUR' && { createdById: user.id }),

      // Filtres optionnels
      ...(statut && { statut: statut as 'BROUILLON' | 'EN_ATTENTE' | 'VALIDE' | 'REFUSE' }),
      ...(produit && { produit }),
    };

    // 4. Requêtes en parallèle (données + comptage)
    const [fiches, total] = await prisma.$transaction([
      prisma.qualityControl.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          createdBy: { select: { id: true, nom: true, prenom: true } },
          validatedBy: { select: { id: true, nom: true, prenom: true } },
          _count: { select: { sections: true } },
        },
      }),
      prisma.qualityControl.count({ where }),
    ]);

    // 5. Retourner avec pagination
    return apiSuccess({
      fiches,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return apiError(error.message, error.statusCode);
    }
    console.error('[GET FICHES ERROR]', error);
    return apiError(AUTH_ERRORS.INTERNAL_ERROR, 500);
  }
}

// ── POST /api/fiches — Créer une nouvelle fiche de contrôle qualité ──

export async function POST(request: NextRequest) {
  try {
    // 1. Authentification requise
    const user = await requireAuth();

    // 2. Parser le body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return apiError('Le corps de la requête est invalide (JSON attendu)', 400);
    }

    // 3. Validation complète (Zod structurel + métier par champ)
    const validation = validateCreateFiche(body);
    if (!validation.success) {
      return apiError(
        JSON.stringify({
          message: 'Erreurs de validation',
          details: validation.errors,
        }),
        422
      );
    }

    // 4. Parser avec Zod pour obtenir les données typées
    const parsed = createFicheSchema.parse(body);

    // 5. Créer la fiche via le service
    const fiche = await createFiche(parsed, user.id);

    // 6. Retourner la fiche créée
    return apiSuccess(
      {
        id: fiche.id,
        numero: fiche.numero,
        titre: fiche.titre,
        produit: fiche.produit,
        referenceDocument: fiche.referenceDocument,
        versionDocument: fiche.versionDocument,
        dateApplication: fiche.dateApplication?.toISOString() ?? null,
        dateFiche: fiche.dateFiche?.toISOString() ?? null,
        statut: fiche.statut,
        createdAt: fiche.createdAt.toISOString(),
      },
      201
    );
  } catch (error) {
    if (error instanceof AuthError) {
      return apiError(error.message, error.statusCode);
    }
    console.error('[POST FICHES ERROR]', error);
    return apiError(AUTH_ERRORS.INTERNAL_ERROR, 500);
  }
}
