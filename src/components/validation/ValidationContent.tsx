// ============================================================================
// COMPOSANT — ValidationContent (orchestrateur principal interface validation)
// Layout : Stats + Liste (gauche) | Détail (droite) + Historique (bas)
// ============================================================================

'use client';

import React, { useState, useCallback } from 'react';
import {
  useValidationStats,
  useFichesEnAttente,
  useFicheDetail,
  useHistoriqueValidations,
  useDecision,
} from '@/hooks/useValidation';
import ValidationStatsCards from './ValidationStatsCards';
import FichesEnAttenteList from './FichesEnAttenteList';
import FicheDetailPanel from './FicheDetailPanel';
import HistoriqueTable from './HistoriqueTable';

export default function ValidationContent() {
  // ── État local ──
  const [selectedFicheId, setSelectedFicheId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [histPage, setHistPage] = useState(1);
  const [histFilter, setHistFilter] = useState<'TOUS' | 'VALIDATION' | 'REJET'>('TOUS');
  const [activeView, setActiveView] = useState<'validation' | 'historique'>('validation');

  // ── Hooks ──
  const { stats, isLoading: statsLoading, refetch: refetchStats } = useValidationStats();
  const { fiches, pagination, isLoading: fichesLoading, refetch: refetchFiches } = useFichesEnAttente(page);
  const { fiche, isLoading: ficheLoading, error: ficheError, refetch: refetchFiche } = useFicheDetail(selectedFicheId);
  const { logs, pagination: histPagination, isLoading: histLoading, refetch: refetchHist } = useHistoriqueValidations(
    histPage,
    histFilter === 'TOUS' ? undefined : histFilter
  );
  const { submitDecision, isSubmitting, error: submitError } = useDecision();

  // ── Handlers ──
  const handleSelectFiche = useCallback((id: string) => {
    setSelectedFicheId(id);
  }, []);

  const handleValidate = useCallback(async (commentaire?: string) => {
    if (!selectedFicheId) return;
    const result = await submitDecision(selectedFicheId, 'VALIDATION', commentaire);
    if (result) {
      setSelectedFicheId(null);
      refetchFiches();
      refetchStats();
      refetchHist();
    }
  }, [selectedFicheId, submitDecision, refetchFiches, refetchStats, refetchHist]);

  const handleReject = useCallback(async (commentaire: string) => {
    if (!selectedFicheId) return;
    const result = await submitDecision(selectedFicheId, 'REJET', commentaire);
    if (result) {
      setSelectedFicheId(null);
      refetchFiches();
      refetchStats();
      refetchHist();
    }
  }, [selectedFicheId, submitDecision, refetchFiches, refetchStats, refetchHist]);

  const handleHistFilterChange = useCallback((filter: 'TOUS' | 'VALIDATION' | 'REJET') => {
    setHistFilter(filter);
    setHistPage(1);
  }, []);

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Validation des contrôles</h1>
          <p className="text-sm text-gray-500 mt-1">
            Examinez et prenez des décisions sur les fiches soumises
          </p>
        </div>

        {/* Onglet Validation / Historique */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
          <button
            onClick={() => setActiveView('validation')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeView === 'validation'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            En attente
          </button>
          <button
            onClick={() => setActiveView('historique')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeView === 'historique'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Historique
          </button>
        </div>
      </div>

      {/* ── Stats ── */}
      <ValidationStatsCards stats={stats} isLoading={statsLoading} />

      {activeView === 'validation' ? (
        /* ── Vue Validation : Liste + Détail ── */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Colonne gauche : liste fiches */}
          <div className="lg:col-span-4">
            <div className="sticky top-6">
              <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                Fiches à traiter
                {stats && stats.enAttente > 0 && (
                  <span className="inline-flex items-center justify-center w-5 h-5 bg-amber-500 text-white text-[10px] font-bold rounded-full">
                    {stats.enAttente}
                  </span>
                )}
              </h2>
              <FichesEnAttenteList
                fiches={fiches}
                isLoading={fichesLoading}
                selectedId={selectedFicheId}
                onSelect={handleSelectFiche}
                pagination={{ page: pagination.page, totalPages: pagination.totalPages, total: pagination.total }}
                onPageChange={setPage}
              />
            </div>
          </div>

          {/* Colonne droite : détail fiche */}
          <div className="lg:col-span-8">
            <FicheDetailPanel
              fiche={fiche}
              isLoading={ficheLoading}
              error={ficheError}
              isSubmitting={isSubmitting}
              submitError={submitError}
              onValidate={handleValidate}
              onReject={handleReject}
            />
          </div>
        </div>
      ) : (
        /* ── Vue Historique ── */
        <HistoriqueTable
          logs={logs as never[]}
          isLoading={histLoading}
          filterAction={histFilter}
          onFilterChange={handleHistFilterChange}
          pagination={{ page: histPagination.page, totalPages: histPagination.totalPages, total: histPagination.total }}
          onPageChange={setHistPage}
        />
      )}
    </div>
  );
}
