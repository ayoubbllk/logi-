// ============================================================================
// EXEMPLES DE REQUÊTES PRISMA
// Fichier de référence — ne pas importer directement en production
// ============================================================================

import { PrismaClient, Role, StatutControle, ActionType } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================================================
// 1. UTILISATEURS
// ============================================================================

// ── Créer un utilisateur admin ──
async function creerAdmin() {
  // En production, hasher le mot de passe avec bcrypt avant
  return await prisma.user.create({
    data: {
      email: 'admin@entreprise.com',
      password: '$2b$12$hashedPasswordHere',
      nom: 'Dupont',
      prenom: 'Jean',
      role: Role.ADMIN,
    },
  });
}

// ── Créer un contrôleur ──
async function creerControleur() {
  return await prisma.user.create({
    data: {
      email: 'controleur@entreprise.com',
      password: '$2b$12$hashedPasswordHere',
      nom: 'Martin',
      prenom: 'Sophie',
      role: Role.CONTROLEUR,
    },
  });
}

// ── Trouver un utilisateur par email (login) ──
async function findByEmail(email: string) {
  return await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      password: true, // Pour vérification bcrypt
      nom: true,
      prenom: true,
      role: true,
      estActif: true,
    },
  });
}

// ── Lister tous les contrôleurs actifs ──
async function listerControleurs() {
  return await prisma.user.findMany({
    where: {
      role: Role.CONTROLEUR,
      estActif: true,
    },
    select: {
      id: true,
      email: true,
      nom: true,
      prenom: true,
      createdAt: true,
    },
    orderBy: { nom: 'asc' },
  });
}

// ── Désactiver un utilisateur (soft delete) ──
async function desactiverUtilisateur(userId: string) {
  return await prisma.user.update({
    where: { id: userId },
    data: { estActif: false },
  });
}

// ============================================================================
// 2. FICHES DE CONTRÔLE QUALITÉ
// ============================================================================

// ── Générer un numéro de fiche unique ──
async function genererNumero(): Promise<string> {
  const annee = new Date().getFullYear();
  const prefixe = `FC-${annee}-`;

  return await prisma.$transaction(async (tx) => {
    const derniere = await tx.qualityControl.findFirst({
      where: { numero: { startsWith: prefixe } },
      orderBy: { numero: 'desc' },
      select: { numero: true },
    });

    const sequence = derniere
      ? parseInt(derniere.numero.split('-')[2]) + 1
      : 1;

    return `${prefixe}${sequence.toString().padStart(5, '0')}`;
  });
}

// ── Créer une fiche complète avec sections et log ──
async function creerFicheComplete(userId: string) {
  const numero = await genererNumero();

  return await prisma.qualityControl.create({
    data: {
      numero,
      titre: 'Contrôle Bitume 50/70 - Lot 2026-042',
      produit: 'BITUME_ROUTIER',
      statut: StatutControle.BROUILLON,
      createdById: userId,

      // Sections dynamiques en JSON
      sections: {
        create: [
          {
            titre: 'Identification de l\'échantillon',
            ordre: 0,
            donnees: {
              champs: [
                { label: 'Référence lot', type: 'TEXT', valeur: 'LOT-2026-042' },
                { label: 'Date prélèvement', type: 'DATE', valeur: '2026-02-12' },
                { label: 'Provenance', type: 'TEXT', valeur: 'Raffinerie Sud' },
                { label: 'Grade', type: 'SELECT', valeur: '50/70', options: ['35/50', '50/70', '70/100'] },
              ],
            },
          },
          {
            titre: 'Essais physiques',
            ordre: 1,
            donnees: {
              champs: [
                {
                  label: 'Pénétrabilité à 25°C',
                  type: 'NUMBER',
                  valeur: 58,
                  unite: '1/10 mm',
                  min: 50,
                  max: 70,
                  conforme: true,
                },
                {
                  label: 'Point de ramollissement TBA',
                  type: 'NUMBER',
                  valeur: 49,
                  unite: '°C',
                  min: 46,
                  max: 54,
                  conforme: true,
                },
                {
                  label: 'Ductilité à 25°C',
                  type: 'NUMBER',
                  valeur: 105,
                  unite: 'cm',
                  min: 100,
                  max: null,
                  conforme: true,
                },
              ],
            },
          },
          {
            titre: 'Conclusion',
            ordre: 2,
            donnees: {
              champs: [
                { label: 'Conformité globale', type: 'BOOLEAN', valeur: true },
                { label: 'Observations', type: 'TEXT', valeur: 'Échantillon conforme aux spécifications.' },
              ],
            },
          },
        ],
      },

      // Log de création
      validationLogs: {
        create: {
          action: ActionType.CREATION,
          userId,
          details: { message: 'Création de la fiche de contrôle' },
        },
      },
    },

    // Inclure les relations dans le retour
    include: {
      sections: { orderBy: { ordre: 'asc' } },
      createdBy: { select: { id: true, nom: true, prenom: true } },
      validationLogs: true,
    },
  });
}

// ── Lister les fiches avec filtres et pagination ──
async function listerFiches(params: {
  page?: number;
  limit?: number;
  statut?: StatutControle;
  produit?: string;
  userId?: string;       // Pour filtrer par contrôleur
  recherche?: string;    // Recherche dans le numéro ou le titre
}) {
  const { page = 1, limit = 20, statut, produit, userId, recherche } = params;
  const skip = (page - 1) * limit;

  const where = {
    ...(statut && { statut }),
    ...(produit && { produit }),
    ...(userId && { createdById: userId }),
    ...(recherche && {
      OR: [
        { numero: { contains: recherche } },
        { titre: { contains: recherche } },
      ],
    }),
  };

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

// ── Récupérer une fiche complète par ID ──
async function getFicheComplete(ficheId: string) {
  return await prisma.qualityControl.findUnique({
    where: { id: ficheId },
    include: {
      createdBy: {
        select: { id: true, nom: true, prenom: true, email: true },
      },
      validatedBy: {
        select: { id: true, nom: true, prenom: true, email: true },
      },
      sections: {
        orderBy: { ordre: 'asc' },
      },
      validationLogs: {
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, nom: true, prenom: true } },
        },
      },
    },
  });
}

// ── Mettre à jour une section ──
async function mettreAJourSection(
  sectionId: string,
  ficheId: string,
  userId: string,
  nouvelleDonnees: Record<string, unknown>
) {
  return await prisma.$transaction(async (tx) => {
    // 1. Mettre à jour les données de la section
    const section = await tx.sectionData.update({
      where: { id: sectionId },
      data: {
        donnees: nouvelleDonnees,
        updatedAt: new Date(),
      },
    });

    // 2. Logger la modification
    await tx.validationLog.create({
      data: {
        action: ActionType.MODIFICATION,
        qualityControlId: ficheId,
        userId,
        details: {
          sectionId,
          sectionTitre: section.titre,
          message: 'Modification des données de la section',
        },
      },
    });

    // 3. Mettre à jour le timestamp de la fiche
    await tx.qualityControl.update({
      where: { id: ficheId },
      data: { updatedAt: new Date() },
    });

    return section;
  });
}

// ── Soumettre une fiche pour validation ──
async function soumettreFiche(ficheId: string, userId: string) {
  return await prisma.$transaction(async (tx) => {
    const fiche = await tx.qualityControl.update({
      where: { id: ficheId },
      data: {
        statut: StatutControle.EN_ATTENTE,
        dateSoumission: new Date(),
      },
    });

    await tx.validationLog.create({
      data: {
        action: ActionType.SOUMISSION,
        qualityControlId: ficheId,
        userId,
        details: { message: 'Fiche soumise pour validation' },
      },
    });

    return fiche;
  });
}

// ── Valider une fiche (admin) ──
async function validerFiche(ficheId: string, adminId: string, commentaire?: string) {
  return await prisma.$transaction(async (tx) => {
    const fiche = await tx.qualityControl.update({
      where: { id: ficheId },
      data: {
        statut: StatutControle.VALIDE,
        validatedById: adminId,
        dateDecision: new Date(),
        commentaire: commentaire || 'Fiche validée',
      },
    });

    await tx.validationLog.create({
      data: {
        action: ActionType.VALIDATION,
        qualityControlId: ficheId,
        userId: adminId,
        details: { commentaire, message: 'Fiche validée par l\'administrateur' },
      },
    });

    return fiche;
  });
}

// ── Refuser une fiche (admin) ──
async function refuserFiche(ficheId: string, adminId: string, commentaire: string) {
  return await prisma.$transaction(async (tx) => {
    const fiche = await tx.qualityControl.update({
      where: { id: ficheId },
      data: {
        statut: StatutControle.REFUSE,
        validatedById: adminId,
        dateDecision: new Date(),
        commentaire,
      },
    });

    await tx.validationLog.create({
      data: {
        action: ActionType.REJET,
        qualityControlId: ficheId,
        userId: adminId,
        details: { commentaire, message: 'Fiche refusée par l\'administrateur' },
      },
    });

    return fiche;
  });
}

// ============================================================================
// 3. STATISTIQUES & DASHBOARD
// ============================================================================

// ── Statistiques globales (admin) ──
async function getStatistiques() {
  const [total, parStatut, parProduit, recentes] = await prisma.$transaction([
    // Nombre total de fiches
    prisma.qualityControl.count(),

    // Comptage par statut
    prisma.qualityControl.groupBy({
      by: ['statut'],
      _count: { id: true },
    }),

    // Comptage par produit
    prisma.qualityControl.groupBy({
      by: ['produit'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    }),

    // 5 dernières fiches
    prisma.qualityControl.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: { select: { nom: true, prenom: true } },
      },
    }),
  ]);

  return { total, parStatut, parProduit, recentes };
}

// ── Statistiques d'un contrôleur ──
async function getStatistiquesControleur(userId: string) {
  const [total, parStatut] = await prisma.$transaction([
    prisma.qualityControl.count({
      where: { createdById: userId },
    }),
    prisma.qualityControl.groupBy({
      by: ['statut'],
      where: { createdById: userId },
      _count: { id: true },
    }),
  ]);

  return { total, parStatut };
}

// ── Historique d'une fiche (audit trail) ──
async function getHistoriqueFiche(ficheId: string) {
  return await prisma.validationLog.findMany({
    where: { qualityControlId: ficheId },
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: { id: true, nom: true, prenom: true, role: true },
      },
    },
  });
}

// ============================================================================
// 4. REQUÊTES AVANCÉES
// ============================================================================

// ── Fiches en attente depuis plus de 48h (admin) ──
async function fichesEnRetard() {
  const limite = new Date(Date.now() - 48 * 60 * 60 * 1000);

  return await prisma.qualityControl.findMany({
    where: {
      statut: StatutControle.EN_ATTENTE,
      dateSoumission: { lt: limite },
    },
    include: {
      createdBy: { select: { nom: true, prenom: true, email: true } },
    },
    orderBy: { dateSoumission: 'asc' },
  });
}

// ── Recherche full-text dans les sections JSON ──
async function rechercherDansSections(terme: string) {
  // MySQL supporte la recherche dans les colonnes JSON avec JSON_SEARCH
  return await prisma.$queryRaw`
    SELECT qc.id, qc.numero, qc.titre, sd.titre as section_titre
    FROM quality_controls qc
    JOIN section_data sd ON sd.qualityControlId = qc.id
    WHERE JSON_SEARCH(sd.donnees, 'all', ${`%${terme}%`}) IS NOT NULL
    ORDER BY qc.createdAt DESC
    LIMIT 50
  `;
}

// ── Supprimer une fiche et toutes ses données (cascade) ──
async function supprimerFiche(ficheId: string) {
  // Les sections et logs sont supprimés automatiquement (onDelete: Cascade)
  return await prisma.qualityControl.delete({
    where: { id: ficheId },
  });
}
