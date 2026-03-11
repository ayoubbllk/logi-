// ============================================================================
// TYPES — Validation des contrôles qualité
// ============================================================================

import type { StatutControle, ActionType } from '@prisma/client';

// ── Payload pour valider ou refuser ──

export interface DecisionPayload {
  action: 'VALIDATION' | 'REJET';
  commentaire?: string;
}

// ── Fiche en attente de validation (pour la liste admin) ──

export interface FicheEnAttente {
  id: string;
  numero: string;
  titre: string;
  produit: string;
  statut: StatutControle;
  createdAt: string;
  dateSoumission: string | null;
  createdBy: {
    id: string;
    nom: string;
    prenom: string;
    email: string;
  };
  _count: {
    sections: number;
  };
}

// ── Détail d'une fiche pour la page de validation ──

export interface FicheValidationDetail {
  id: string;
  numero: string;
  titre: string;
  produit: string;
  statut: StatutControle;
  commentaire: string | null;
  createdAt: string;
  updatedAt: string;
  dateSoumission: string | null;
  dateDecision: string | null;
  createdBy: {
    id: string;
    nom: string;
    prenom: string;
    email: string;
  };
  validatedBy: {
    id: string;
    nom: string;
    prenom: string;
  } | null;
  sections: {
    id: string;
    titre: string;
    ordre: number;
    donnees: Record<string, unknown>;
  }[];
  validationLogs: ValidationLogEntry[];
}

// ── Entrée du journal de validation ──

export interface ValidationLogEntry {
  id: string;
  action: ActionType;
  details: Record<string, unknown> | null;
  createdAt: string;
  user: {
    nom: string;
    prenom: string;
  };
}

// ── Réponse de la décision ──

export interface DecisionResponse {
  id: string;
  numero: string;
  statut: StatutControle;
  commentaire: string | null;
  dateDecision: string;
  validatedBy: {
    nom: string;
    prenom: string;
  };
}

// ── Stats pour l'interface admin ──

export interface ValidationStats {
  enAttente: number;
  validees: number;
  refusees: number;
  totalAujourdhui: number;
}
