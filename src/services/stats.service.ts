// ============================================================================
// STATS SERVICE — Requêtes Prisma optimisées pour le dashboard
// ─ Parallélisation via Promise.all
// ─ Utilisation de groupBy au lieu d'agrégation JS
// ─ $transaction batch pour lectures cohérentes
// ============================================================================

import prisma from '@/lib/prisma';
import { logger } from '@/lib/logger';
import type {
  DashboardStats,
  StatsKPI,
  StatsMensuelles,
  StatsParProduit,
  ActiviteRecente,
} from '@/types/stats.types';

// ── Labels des mois en français ──

const MOIS_LABELS = [
  'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin',
  'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc',
];

// ============================================================================
// STATS COMPLÈTES (admin — toutes les fiches)
// ============================================================================

export async function getDashboardStats(): Promise<DashboardStats> {
  const [kpi, mensuelles, parProduit, activiteRecente] = await Promise.all([
    getKPI(),
    getStatsMensuelles(),
    getStatsParProduit(),
    getActiviteRecente(),
  ]);

  return { kpi, mensuelles, parProduit, activiteRecente };
}

// ============================================================================
// STATS CONTRÔLEUR (fiches propres uniquement)
// ============================================================================

export async function getDashboardStatsControleur(
  userId: string
): Promise<DashboardStats> {
  const [kpi, mensuelles, parProduit, activiteRecente] = await Promise.all([
    getKPI(userId),
    getStatsMensuelles(userId),
    getStatsParProduit(userId),
    getActiviteRecente(userId),
  ]);

  return { kpi, mensuelles, parProduit, activiteRecente };
}

// ============================================================================
// 1. KPI — Indicateurs clés
// ============================================================================

async function getKPI(userId?: string): Promise<StatsKPI> {
  // Début de la journée (minuit)
  const aujourdhuiDebut = new Date();
  aujourdhuiDebut.setHours(0, 0, 0, 0);

  const whereUser = userId ? { createdById: userId } : {};

  // Requêtes parallèles via $transaction
  const [
    testsAujourdhui,
    totalValides,
    totalNonConformes,
    enAttente,
    brouillons,
    totalTraites,
  ] = await prisma.$transaction([
    // Tests créés aujourd'hui
    prisma.qualityControl.count({
      where: {
        ...whereUser,
        createdAt: { gte: aujourdhuiDebut },
      },
    }),

    // Total validés
    prisma.qualityControl.count({
      where: { ...whereUser, statut: 'VALIDE' },
    }),

    // Total refusés (non conformes)
    prisma.qualityControl.count({
      where: { ...whereUser, statut: 'REFUSE' },
    }),

    // En attente de validation
    prisma.qualityControl.count({
      where: { ...whereUser, statut: 'EN_ATTENTE' },
    }),

    // Brouillons
    prisma.qualityControl.count({
      where: { ...whereUser, statut: 'BROUILLON' },
    }),

    // Total des fiches traitées (validées + refusées) pour le taux
    prisma.qualityControl.count({
      where: {
        ...whereUser,
        statut: { in: ['VALIDE', 'REFUSE'] },
      },
    }),
  ]);

  // Calcul du taux de conformité
  const tauxConformite =
    totalTraites > 0
      ? Math.round((totalValides / totalTraites) * 100 * 10) / 10
      : 0;

  return {
    testsAujourdhui,
    totalValides,
    totalNonConformes,
    tauxConformite,
    enAttente,
    brouillons,
  };
}

// ============================================================================
// 2. STATISTIQUES MENSUELLES (12 derniers mois)
// ============================================================================

async function getStatsMensuelles(userId?: string): Promise<StatsMensuelles[]> {
  const maintenant = new Date();
  const debutPeriode = new Date(
    maintenant.getFullYear(),
    maintenant.getMonth() - 11,
    1
  );

  const whereUser = userId ? { createdById: userId } : {};

  // ── Agrégation côté DB via groupBy (évite de charger toutes les fiches en mémoire) ──
  const startMs = Date.now();
  const groupedData = await prisma.qualityControl.groupBy({
    by: ['statut', 'createdAt'],
    where: {
      ...whereUser,
      createdAt: { gte: debutPeriode },
    },
    _count: { id: true },
  });
  const queryDuration = Date.now() - startMs;
  if (queryDuration > 300) {
    logger.slowQuery('getStatsMensuelles groupBy', queryDuration);
  }

  // Construire les 12 mois avec des valeurs par défaut
  const moisMap = new Map<string, StatsMensuelles>();

  for (let i = 11; i >= 0; i--) {
    const date = new Date(maintenant.getFullYear(), maintenant.getMonth() - i, 1);
    const cle = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    moisMap.set(cle, {
      mois: cle,
      label: MOIS_LABELS[date.getMonth()],
      total: 0,
      valides: 0,
      refuses: 0,
      enAttente: 0,
    });
  }

  // Agréger les résultats groupBy par mois
  for (const row of groupedData) {
    const date = new Date(row.createdAt);
    const cle = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const mois = moisMap.get(cle);

    if (mois) {
      mois.total += row._count.id;
      if (row.statut === 'VALIDE') mois.valides += row._count.id;
      else if (row.statut === 'REFUSE') mois.refuses += row._count.id;
      else if (row.statut === 'EN_ATTENTE') mois.enAttente += row._count.id;
    }
  }

  return Array.from(moisMap.values());
}

// ============================================================================
// 3. RÉPARTITION PAR PRODUIT
// ============================================================================

async function getStatsParProduit(userId?: string): Promise<StatsParProduit[]> {
  const whereUser = userId ? { createdById: userId } : {};

  const fiches = await prisma.qualityControl.groupBy({
    by: ['produit', 'statut'],
    where: whereUser,
    _count: { id: true },
  });

  // Agréger par produit
  const produitMap = new Map<string, StatsParProduit>();

  for (const row of fiches) {
    if (!produitMap.has(row.produit)) {
      produitMap.set(row.produit, {
        produit: row.produit,
        total: 0,
        valides: 0,
        refuses: 0,
        tauxConformite: 0,
      });
    }

    const stats = produitMap.get(row.produit)!;
    stats.total += row._count.id;
    if (row.statut === 'VALIDE') stats.valides += row._count.id;
    if (row.statut === 'REFUSE') stats.refuses += row._count.id;
  }

  // Calculer les taux
  for (const stats of produitMap.values()) {
    const traites = stats.valides + stats.refuses;
    stats.tauxConformite =
      traites > 0
        ? Math.round((stats.valides / traites) * 100 * 10) / 10
        : 0;
  }

  return Array.from(produitMap.values()).sort((a, b) => b.total - a.total);
}

// ============================================================================
// 4. ACTIVITÉ RÉCENTE (10 dernières fiches)
// ============================================================================

async function getActiviteRecente(userId?: string): Promise<ActiviteRecente[]> {
  const whereUser = userId ? { createdById: userId } : {};

  const fiches = await prisma.qualityControl.findMany({
    where: whereUser,
    take: 10,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      numero: true,
      titre: true,
      statut: true,
      produit: true,
      createdAt: true,
      createdBy: {
        select: { nom: true, prenom: true },
      },
    },
  });

  return fiches.map((f) => ({
    id: f.id,
    numero: f.numero,
    titre: f.titre,
    statut: f.statut,
    produit: f.produit,
    createdAt: f.createdAt.toISOString(),
    createur: `${f.createdBy.prenom} ${f.createdBy.nom}`,
  }));
}
