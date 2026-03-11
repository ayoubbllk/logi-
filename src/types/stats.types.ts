// ============================================================================
// TYPES — Statistiques du Dashboard
// ============================================================================

// ── Cartes KPI principales ──

export interface StatsKPI {
  /** Tests réalisés aujourd'hui */
  testsAujourdhui: number;
  /** Fiches validées (tous temps) */
  totalValides: number;
  /** Fiches non conformes (refusées) */
  totalNonConformes: number;
  /** Taux de conformité en % */
  tauxConformite: number;
  /** Fiches en attente de validation */
  enAttente: number;
  /** Brouillons en cours */
  brouillons: number;
}

// ── Statistiques mensuelles (12 derniers mois) ──

export interface StatsMensuelles {
  mois: string;        // "2026-01", "2026-02", etc.
  label: string;       // "Jan", "Fév", etc.
  total: number;
  valides: number;
  refuses: number;
  enAttente: number;
}

// ── Répartition par produit ──

export interface StatsParProduit {
  produit: string;
  total: number;
  valides: number;
  refuses: number;
  tauxConformite: number;
}

// ── Activité récente ──

export interface ActiviteRecente {
  id: string;
  numero: string;
  titre: string;
  statut: string;
  produit: string;
  createdAt: string;
  createur: string;
}

// ── Réponse complète de l'API stats ──

export interface DashboardStats {
  kpi: StatsKPI;
  mensuelles: StatsMensuelles[];
  parProduit: StatsParProduit[];
  activiteRecente: ActiviteRecente[];
}
