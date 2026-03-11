// ============================================================================
// SERVICE — Validation des contrôles qualité
// Logique métier : valider, refuser, historique, stats admin
// ============================================================================

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import type { DecisionInput } from '@/validations/validation.schema';
import type { Prisma, StatutControle } from '@prisma/client';

// ============================================================================
// Prendre une décision (valider / refuser)
// ============================================================================

export interface DecisionResult {
  id: string;
  numero: string;
  statut: StatutControle;
  commentaire: string | null;
  dateDecision: Date;
  validatedBy: {
    nom: string;
    prenom: string;
  };
}

/**
 * Valide ou refuse une fiche en une seule transaction atomique :
 * 1. Vérifie que la fiche existe et est EN_ATTENTE
 * 2. Met à jour le statut, le commentaire, la date et l'admin validateur
 * 3. Crée une entrée dans le journal d'audit (ValidationLog)
 */
export async function prendreDecision(
  ficheId: string,
  adminId: string,
  decision: DecisionInput
): Promise<DecisionResult> {
  return await prisma.$transaction(async (tx) => {
    // 1. Vérifier l'existence et le statut
    const fiche = await tx.qualityControl.findUnique({
      where: { id: ficheId },
      select: {
        id: true,
        numero: true,
        statut: true,
        titre: true,
        produit: true,
      },
    });

    if (!fiche) {
      throw new ValidationError('Fiche de contrôle introuvable', 404);
    }

    if (fiche.statut !== 'EN_ATTENTE') {
      const statusLabel: Record<string, string> = {
        VALIDE: 'déjà validée',
        REFUSE: 'déjà refusée',
        BROUILLON: 'encore en brouillon (non soumise)',
      };
      throw new ValidationError(
        `Cette fiche est ${statusLabel[fiche.statut] ?? fiche.statut}. Seules les fiches en attente peuvent être traitées.`,
        409
      );
    }

    // 2. Déterminer le nouveau statut
    const nouveauStatut: StatutControle = decision.action === 'VALIDATION' ? 'VALIDE' : 'REFUSE';
    const now = new Date();

    // 3. Mettre à jour la fiche
    const ficheUpdated = await tx.qualityControl.update({
      where: { id: ficheId },
      data: {
        statut: nouveauStatut,
        commentaire: decision.commentaire?.trim() || null,
        dateDecision: now,
        validatedById: adminId,
      },
      select: {
        id: true,
        numero: true,
        statut: true,
        commentaire: true,
        dateDecision: true,
        validatedBy: {
          select: { nom: true, prenom: true },
        },
      },
    });

    // 4. Créer le log d'audit
    await tx.validationLog.create({
      data: {
        action: decision.action,
        qualityControlId: ficheId,
        userId: adminId,
        details: {
          ancienStatut: 'EN_ATTENTE',
          nouveauStatut,
          commentaire: decision.commentaire?.trim() || null,
          ficheNumero: fiche.numero,
          ficheTitre: fiche.titre,
        } as Prisma.InputJsonValue,
      },
    });

    return {
      id: ficheUpdated.id,
      numero: ficheUpdated.numero,
      statut: ficheUpdated.statut,
      commentaire: ficheUpdated.commentaire,
      dateDecision: ficheUpdated.dateDecision!,
      validatedBy: ficheUpdated.validatedBy!,
    };
  });
}

// ============================================================================
// Lister les fiches en attente de validation (admin)
// ============================================================================

export interface ListEnAttenteParams {
  page?: number;
  limit?: number;
  search?: string;
  produit?: string;
}

export async function listFichesEnAttente(params: ListEnAttenteParams) {
  const { page = 1, limit = 10, search, produit } = params;

  const where: Prisma.QualityControlWhereInput = {
    statut: 'EN_ATTENTE',
  };

  if (search) {
    where.OR = [
      { numero: { contains: search } },
      { titre: { contains: search } },
      { produit: { contains: search } },
      { createdBy: { nom: { contains: search } } },
      { createdBy: { prenom: { contains: search } } },
    ];
  }

  if (produit) {
    where.produit = produit;
  }

  const [fiches, total] = await Promise.all([
    prisma.qualityControl.findMany({
      where,
      orderBy: { dateSoumission: 'asc' }, // FIFO : plus anciennes d'abord
      skip: (page - 1) * limit,
      take: limit,
      include: {
        createdBy: {
          select: { id: true, nom: true, prenom: true, email: true },
        },
        _count: {
          select: { sections: true },
        },
      },
    }),
    prisma.qualityControl.count({ where }),
  ]);

  return {
    fiches,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

// ============================================================================
// Récupérer le détail d'une fiche pour validation (admin)
// ============================================================================

export async function getFicheForValidation(ficheId: string) {
  return await prisma.qualityControl.findUnique({
    where: { id: ficheId },
    include: {
      sections: { orderBy: { ordre: 'asc' } },
      createdBy: {
        select: { id: true, nom: true, prenom: true, email: true },
      },
      validatedBy: {
        select: { id: true, nom: true, prenom: true },
      },
      validationLogs: {
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { nom: true, prenom: true } },
        },
      },
    },
  });
}

// ============================================================================
// Historique des validations (toutes décisions)
// ============================================================================

export interface ListHistoriqueParams {
  page?: number;
  limit?: number;
  action?: 'VALIDATION' | 'REJET';
  adminId?: string;
}

export async function getHistoriqueValidations(params: ListHistoriqueParams) {
  const { page = 1, limit = 20, action, adminId } = params;

  const where: Prisma.ValidationLogWhereInput = {
    action: { in: ['VALIDATION', 'REJET'] },
  };

  if (action) {
    where.action = action;
  }

  if (adminId) {
    where.userId = adminId;
  }

  const [logs, total] = await Promise.all([
    prisma.validationLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        user: { select: { nom: true, prenom: true } },
        qualityControl: {
          select: {
            id: true,
            numero: true,
            titre: true,
            produit: true,
            statut: true,
            createdBy: {
              select: { nom: true, prenom: true },
            },
          },
        },
      },
    }),
    prisma.validationLog.count({ where }),
  ]);

  return {
    logs,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

// ============================================================================
// Stats rapides pour l'interface admin
// ============================================================================

export async function getValidationStats() {
  const aujourdhui = new Date();
  aujourdhui.setHours(0, 0, 0, 0);

  const [enAttente, validees, refusees, totalAujourdhui] = await prisma.$transaction([
    prisma.qualityControl.count({ where: { statut: 'EN_ATTENTE' } }),
    prisma.qualityControl.count({ where: { statut: 'VALIDE' } }),
    prisma.qualityControl.count({ where: { statut: 'REFUSE' } }),
    prisma.validationLog.count({
      where: {
        action: { in: ['VALIDATION', 'REJET'] },
        createdAt: { gte: aujourdhui },
      },
    }),
  ]);

  return { enAttente, validees, refusees, totalAujourdhui };
}

// ============================================================================
// Classe d'erreur validation
// ============================================================================

export class ValidationError extends Error {
  constructor(
    message: string,
    public statusCode: number
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}
