// ============================================================================
// COMPOSANT — FichesEnAttenteList (liste des fiches à valider)
// ============================================================================

'use client';

import React from 'react';
import type { FicheEnAttente } from '@/types/validation.types';

interface FichesEnAttenteListProps {
  fiches: FicheEnAttente[];
  isLoading: boolean;
  selectedId: string | null;
  onSelect: (id: string) => void;
  pagination: {
    page: number;
    totalPages: number;
    total: number;
  };
  onPageChange: (page: number) => void;
}

export default function FichesEnAttenteList({
  fiches,
  isLoading,
  selectedId,
  onSelect,
  pagination,
  onPageChange,
}: FichesEnAttenteListProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="animate-pulse bg-white rounded-lg border border-gray-200 p-4">
            <div className="h-4 w-32 bg-gray-200 rounded mb-2" />
            <div className="h-3 w-full bg-gray-100 rounded mb-1" />
            <div className="h-3 w-24 bg-gray-100 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (fiches.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
        <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-gray-600 font-medium">Aucune fiche en attente</p>
        <p className="text-sm text-gray-400 mt-1">Toutes les fiches ont été traitées</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {fiches.map((fiche) => {
        const isSelected = selectedId === fiche.id;
        const soumisDepuis = fiche.dateSoumission
          ? formatRelativeTime(new Date(fiche.dateSoumission))
          : 'Date inconnue';

        return (
          <button
            key={fiche.id}
            onClick={() => onSelect(fiche.id)}
            className={`
              w-full text-left p-4 rounded-xl border transition-all duration-200
              ${isSelected
                ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-200'
                : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm'
              }
            `}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-semibold text-blue-600">
                    {fiche.numero}
                  </span>
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-700">
                    En attente
                  </span>
                </div>
                <p className="text-sm font-medium text-gray-900 mt-1 truncate">
                  {fiche.titre}
                </p>
                <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    {fiche.createdBy.prenom} {fiche.createdBy.nom}
                  </span>
                  <span className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {soumisDepuis}
                  </span>
                </div>
              </div>
              <svg className={`w-5 h-5 flex-shrink-0 mt-1 transition-transform ${isSelected ? 'text-blue-600 rotate-90' : 'text-gray-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
            <div className="mt-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-600">
                {fiche.produit}
              </span>
            </div>
          </button>
        );
      })}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between pt-3">
          <span className="text-xs text-gray-500">
            {pagination.total} fiche{pagination.total > 1 ? 's' : ''} en attente
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="p-1 rounded text-gray-400 hover:text-gray-600 disabled:opacity-30"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-xs text-gray-600 px-2">
              {pagination.page}/{pagination.totalPages}
            </span>
            <button
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="p-1 rounded text-gray-400 hover:text-gray-600 disabled:opacity-30"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Helper : temps relatif ──
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMin / 60);
  const diffJ = Math.floor(diffH / 24);

  if (diffMin < 1) return 'À l\'instant';
  if (diffMin < 60) return `il y a ${diffMin} min`;
  if (diffH < 24) return `il y a ${diffH}h`;
  if (diffJ === 1) return 'Hier';
  if (diffJ < 7) return `il y a ${diffJ} jours`;
  return date.toLocaleDateString('fr-FR');
}
