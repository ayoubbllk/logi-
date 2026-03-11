// ============================================================================
// HELPERS & UTILITAIRES GÉNÉRIQUES
// ============================================================================

import { NextResponse } from 'next/server';

// ── Réponse API standardisée (succès) ──

export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json(
    { success: true, data },
    { status }
  );
}

// ── Réponse API standardisée (erreur) ──

export function apiError(message: string, status = 400) {
  return NextResponse.json(
    { success: false, error: message },
    { status }
  );
}

// ── Formater une date pour l'affichage ──

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

// ── Générer un numéro de fiche ──

export function buildFicheNumero(annee: number, sequence: number): string {
  return `FC-${annee}-${sequence.toString().padStart(5, '0')}`;
}
