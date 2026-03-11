// ============================================================================
// COMPOSANT — Tableau d'activité récente
// ============================================================================

'use client';

import React from 'react';
import type { ActiviteRecente } from '@/types/stats.types';

interface RecentActivityProps {
  data: ActiviteRecente[];
}

// Noms lisibles des produits
const PRODUCT_LABELS: Record<string, string> = {
  BITUME_ROUTIER: 'Bitume routier',
  BITUME_MODIFIE: 'Bitume modifié',
  EMULSION: 'Émulsion',
  MEMBRANE: 'Membrane',
};

// Badge de statut avec couleur
function StatutBadge({ statut }: { statut: string }) {
  const config: Record<string, { bg: string; text: string; label: string }> = {
    BROUILLON: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Brouillon' },
    EN_ATTENTE: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'En attente' },
    VALIDE: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Validé' },
    REFUSE: { bg: 'bg-red-100', text: 'text-red-700', label: 'Refusé' },
  };

  const c = config[statut] ?? config.BROUILLON;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${c.bg} ${c.text}`}
    >
      {c.label}
    </span>
  );
}

// Formater la date relative
function formatDateRelative(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const heures = Math.floor(diff / 3600000);
  const jours = Math.floor(diff / 86400000);

  if (minutes < 1) return "À l'instant";
  if (minutes < 60) return `Il y a ${minutes} min`;
  if (heures < 24) return `Il y a ${heures}h`;
  if (jours < 7) return `Il y a ${jours}j`;

  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
  }).format(date);
}

export default function RecentActivity({ data }: RecentActivityProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Activité récente
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Dernières fiches de contrôle
            </p>
          </div>
          <a
            href="/fiches"
            className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
          >
            Voir tout →
          </a>
        </div>
      </div>

      {data.length === 0 ? (
        <div className="p-12 text-center">
          <div className="text-gray-300 mb-3">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-sm text-gray-400">Aucune fiche pour le moment</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-50">
          {data.map((fiche) => (
            <a
              key={fiche.id}
              href={`/fiches/${fiche.id}`}
              className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors group"
            >
              {/* Indicateur de statut */}
              <div className="flex-shrink-0">
                <div
                  className={`w-2.5 h-2.5 rounded-full ${
                    fiche.statut === 'VALIDE'
                      ? 'bg-emerald-500'
                      : fiche.statut === 'REFUSE'
                        ? 'bg-red-500'
                        : fiche.statut === 'EN_ATTENTE'
                          ? 'bg-amber-500'
                          : 'bg-gray-300'
                  }`}
                />
              </div>

              {/* Infos */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {fiche.numero}
                  </span>
                  <StatutBadge statut={fiche.statut} />
                </div>
                <p className="text-sm text-gray-500 truncate mt-0.5">
                  {fiche.titre}
                </p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-gray-400">
                    {PRODUCT_LABELS[fiche.produit] ?? fiche.produit}
                  </span>
                  <span className="text-xs text-gray-300">•</span>
                  <span className="text-xs text-gray-400">
                    {fiche.createur}
                  </span>
                </div>
              </div>

              {/* Date */}
              <div className="flex-shrink-0 text-right">
                <span className="text-xs text-gray-400">
                  {formatDateRelative(fiche.createdAt)}
                </span>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
