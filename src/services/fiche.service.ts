// ============================================================================
// SERVICE — Fiches de contrôle qualité
// CRUD + numérotation automatique + audit trail
// ─ Optimisé : includes conditionnels, logging structuré
// ============================================================================

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { SECTIONS_META } from '@/types/fiche.types';
import { buildFicheNumero } from '@/lib/utils';
import type { CreateFicheInput } from '@/validations/fiche.schema';
import type { StatutControle } from '@/types/fiche.types';

// ============================================================================
// Générer le prochain numéro de fiche (atomique via transaction)
// ============================================================================

/**
 * Génère un numéro au format FC-YYYY-NNNNN
 * Utilise une transaction Prisma pour garantir l'unicité.
 */
async function genererNumeroFiche(): Promise<string> {
  const annee = new Date().getFullYear();
  const prefix = `FC-${annee}-`;

  return await prisma.$transaction(async (tx: any) => {
    // Chercher la dernière fiche de l'année en cours
    const derniere = await tx.qualityControl.findFirst({
      where: { numero: { startsWith: prefix } },
      orderBy: { numero: 'desc' },
      select: { numero: true },
    });

    let sequence = 1;
    if (derniere) {
      const parts = derniere.numero.split('-');
      sequence = parseInt(parts[2], 10) + 1;
    }

    return buildFicheNumero(annee, sequence);
  });
}

// ============================================================================
// Créer une fiche de contrôle qualité
// ============================================================================

export interface CreateFicheResult {
  id: string;
  numero: string;
  titre: string;
  produit: string;
  referenceDocument: string;
  versionDocument: string;
  dateApplication: Date | null;
  dateFiche: Date | null;
  statut: StatutControle;
  createdAt: Date;
}

/**
 * Crée une fiche + ses sections en une seule transaction.
 * - Génère automatiquement le numéro FC-YYYY-NNNNN
 * - Statut initial = EN_ATTENTE
 * - Enregistre l'action CREATION dans le journal d'audit
 */
export async function createFiche(
  data: CreateFicheInput,
  userId: string
): Promise<CreateFicheResult> {
  return await prisma.$transaction(async (tx: any) => {
    // 1. Générer le numéro
    const annee = new Date().getFullYear();
    const prefix = `FC-${annee}-`;
    const derniere = await tx.qualityControl.findFirst({
      where: { numero: { startsWith: prefix } },
      orderBy: { numero: 'desc' },
      select: { numero: true },
    });
    let sequence = 1;
    if (derniere) {
      sequence = parseInt(derniere.numero.split('-')[2], 10) + 1;
    }
    const numero = buildFicheNumero(annee, sequence);

    // 2. Créer la fiche
    const fiche = await tx.qualityControl.create({
      data: {
        numero,
        titre: data.titre,
        produit: data.produit,
        referenceDocument: data.referenceDocument,
        versionDocument: data.versionDocument,
        dateApplication: data.dateApplication ? new Date(data.dateApplication) : null,
        dateFiche: data.dateFiche ? new Date(data.dateFiche) : null,
        statut: 'EN_ATTENTE',
        dateSoumission: new Date(),
        createdById: userId,
        // 3. Créer les sections en même temps (nested create)
        sections: {
          create: data.sections.map((s) => ({
            titre: s.titre,
            ordre: s.ordre,
            donnees: s.donnees as any,
          })),
        },
        // 4. Créer le log d'audit
        validationLogs: {
          create: {
            action: 'CREATION',
            userId,
            details: {
              titre: data.titre,
              produit: data.produit,
              nbSections: data.sections.length,
            } as any,
          },
        },
      },
      select: {
        id: true,
        numero: true,
        titre: true,
        produit: true,
        referenceDocument: true,
        versionDocument: true,
        dateApplication: true,
        dateFiche: true,
        statut: true,
        createdAt: true,
      },
    });

    return fiche;
  });
}

// ============================================================================
// Récupérer une fiche par ID (avec includes conditionnels)
// ============================================================================

interface GetFicheOptions {
  includeSections?: boolean;
  includeValidationLogs?: boolean;
  includeCreatedBy?: boolean;
  includeValidatedBy?: boolean;
}

const DEFAULT_FICHE_OPTIONS: GetFicheOptions = {
  includeSections: true,
  includeValidationLogs: true,
  includeCreatedBy: true,
  includeValidatedBy: true,
};

export async function getFicheById(
  ficheId: string,
  userId?: string,
  role?: string,
  options: GetFicheOptions = DEFAULT_FICHE_OPTIONS
) {
  const where: any = { id: ficheId };
  
  // Un contrôleur ne peut voir que ses propres fiches
  if (role === 'CONTROLEUR' && userId) {
    where.createdById = userId;
  }

  const startMs = Date.now();

  const fiche = await prisma.qualityControl.findFirst({
    where,
    include: {
      sections: options.includeSections
        ? { orderBy: { ordre: 'asc' } }
        : false,
      createdBy: options.includeCreatedBy
        ? { select: { id: true, nom: true, prenom: true, email: true } }
        : false,
      validatedBy: options.includeValidatedBy
        ? { select: { id: true, nom: true, prenom: true } }
        : false,
      validationLogs: options.includeValidationLogs
        ? {
            orderBy: { createdAt: 'desc' },
            include: {
              user: { select: { nom: true, prenom: true } },
            },
          }
        : false,
    },
  });

  const duration = Date.now() - startMs;
  if (duration > 300) {
    logger.slowQuery('getFicheById', duration, { ficheId });
  }

  return fiche;
}

// ============================================================================
// Lister les fiches (avec pagination et filtres)
// ============================================================================

export interface ListFichesParams {
  page?: number;
  limit?: number;
  statut?: StatutControle;
  produit?: string;
  search?: string;
  userId?: string;
  role?: string;
}

export async function listFiches(params: ListFichesParams) {
  const {
    page = 1,
    limit = 10,
    statut,
    produit,
    search,
    userId,
    role,
  } = params;

  const where: any = {};

  // Filtre par rôle
  if (role === 'CONTROLEUR' && userId) {
    where.createdById = userId;
  }

  // Filtre par statut
  if (statut) {
    where.statut = statut;
  }

  // Filtre par produit
  if (produit) {
    where.produit = produit;
  }

  // Recherche textuelle
  if (search) {
    where.OR = [
      { numero: { contains: search } },
      { titre: { contains: search } },
      { produit: { contains: search } },
    ];
  }

  const [fiches, total] = await Promise.all([
    prisma.qualityControl.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        createdBy: {
          select: { id: true, nom: true, prenom: true },
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
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}
