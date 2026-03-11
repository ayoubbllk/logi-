// ============================================================================
// COMPOSANT — HistoriqueTable (tableau historique global des validations)
// ============================================================================

'use client';

import React from 'react';

interface HistoriqueLog {
  id: string;
  action: string;
  details: Record<string, unknown> | null;
  createdAt: string;
  user: { nom: string; prenom: string };
  qualityControl: {
    id: string;
    numero: string;
    titre: string;
    produit: string;
    statut: string;
    createdBy: { nom: string; prenom: string };
  };
}

interface HistoriqueTableProps {
  logs: HistoriqueLog[];
  isLoading: boolean;
  filterAction: 'TOUS' | 'VALIDATION' | 'REJET';
  onFilterChange: (filter: 'TOUS' | 'VALIDATION' | 'REJET') => void;
  pagination: {
    page: number;
    totalPages: number;
    total: number;
  };
  onPageChange: (page: number) => void;
}

export default function HistoriqueTable({
  logs,
  isLoading,
  filterAction,
  onFilterChange,
  pagination,
  onPageChange,
}: HistoriqueTableProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Filtres */}
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">Historique des décisions</h3>
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
          {(['TOUS', 'VALIDATION', 'REJET'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => onFilterChange(filter)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                filterAction === filter
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {filter === 'TOUS' ? 'Tous' : filter === 'VALIDATION' ? '✓ Validés' : '✗ Refusés'}
            </button>
          ))}
        </div>
      </div>

      {/* Tableau */}
      {isLoading ? (
        <div className="p-6 space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse flex items-center gap-4">
              <div className="h-4 w-20 bg-gray-200 rounded" />
              <div className="h-4 w-32 bg-gray-200 rounded" />
              <div className="h-4 w-48 bg-gray-100 rounded flex-1" />
              <div className="h-4 w-24 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
      ) : logs.length === 0 ? (
        <div className="p-12 text-center">
          <p className="text-gray-500 text-sm">Aucune décision enregistrée</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/50">
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Fiche</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Décision</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Admin</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Contrôleur</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Commentaire</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {logs.map((log) => {
                const details = log.details as Record<string, unknown> | null;
                const isValidation = log.action === 'VALIDATION';

                return (
                  <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-3.5 text-xs text-gray-500 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })}
                      <br />
                      <span className="text-gray-400">
                        {new Date(log.createdAt).toLocaleTimeString('fr-FR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </td>
                    <td className="px-6 py-3.5">
                      <div>
                        <span className="text-xs font-mono font-semibold text-blue-600">
                          {log.qualityControl.numero}
                        </span>
                        <p className="text-xs text-gray-700 mt-0.5 truncate max-w-[200px]">
                          {log.qualityControl.titre}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-3.5">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                        isValidation
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {isValidation ? (
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        )}
                        {isValidation ? 'Validée' : 'Refusée'}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-xs text-gray-700 whitespace-nowrap">
                      {log.user.prenom} {log.user.nom}
                    </td>
                    <td className="px-6 py-3.5 text-xs text-gray-700 whitespace-nowrap">
                      {log.qualityControl.createdBy.prenom} {log.qualityControl.createdBy.nom}
                    </td>
                    <td className="px-6 py-3.5 text-xs text-gray-500 max-w-[200px] truncate">
                      {details?.commentaire ? String(details.commentaire) : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="px-6 py-3 border-t border-gray-200 flex items-center justify-between">
          <span className="text-xs text-gray-500">
            {pagination.total} entrée{pagination.total > 1 ? 's' : ''}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="px-3 py-1 text-xs border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-30"
            >
              Précédent
            </button>
            <span className="text-xs text-gray-600">{pagination.page}/{pagination.totalPages}</span>
            <button
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="px-3 py-1 text-xs border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-30"
            >
              Suivant
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
