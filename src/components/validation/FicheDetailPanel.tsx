// ============================================================================
// COMPOSANT — FicheDetailPanel (panneau de détail d'une fiche pour validation)
// Affiche les sections, données, historique + boutons valider/refuser
// ============================================================================

'use client';

import React, { useState } from 'react';
import type { FicheValidationDetail } from '@/types/validation.types';
import { SECTIONS_FIELDS } from '@/config/sections-fields';
import ValidationHistoryTimeline from './ValidationHistoryTimeline';
import ExportPDFButton from '@/components/export/ExportPDFButton';

interface FicheDetailPanelProps {
  fiche: FicheValidationDetail | null;
  isLoading: boolean;
  error: string | null;
  isSubmitting: boolean;
  submitError: string | null;
  onValidate: (commentaire?: string) => void;
  onReject: (commentaire: string) => void;
}

export default function FicheDetailPanel({
  fiche,
  isLoading,
  error,
  isSubmitting,
  submitError,
  onValidate,
  onReject,
}: FicheDetailPanelProps) {
  const [commentaire, setCommentaire] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'donnees' | 'historique'>('donnees');

  // ── Loading ──
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-48 bg-gray-200 rounded" />
          <div className="h-4 w-full bg-gray-100 rounded" />
          <div className="h-4 w-3/4 bg-gray-100 rounded" />
          <div className="h-32 w-full bg-gray-100 rounded" />
        </div>
      </div>
    );
  }

  // ── Placeholder ──
  if (!fiche && !error) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        </div>
        <p className="text-gray-500 font-medium">Sélectionnez une fiche</p>
        <p className="text-sm text-gray-400 mt-1">Cliquez sur une fiche à gauche pour voir son contenu</p>
      </div>
    );
  }

  // ── Error ──
  if (error) {
    return (
      <div className="bg-red-50 rounded-xl border border-red-200 p-6 text-center">
        <p className="text-red-600 font-medium">{error}</p>
      </div>
    );
  }

  if (!fiche) return null;

  const isEnAttente = fiche.statut === 'EN_ATTENTE';

  const handleValidate = () => {
    onValidate(commentaire || undefined);
    setCommentaire('');
  };

  const handleReject = () => {
    if (!commentaire.trim()) return;
    onReject(commentaire.trim());
    setCommentaire('');
    setShowRejectForm(false);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* ── En-tête ── */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50/50">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-mono font-bold text-blue-600">{fiche.numero}</span>
              <StatusBadge statut={fiche.statut} />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mt-1">{fiche.titre}</h2>
          </div>
          <ExportPDFButton fiche={fiche} variant="outline" size="sm" />
        </div>
        <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
          <span>
            <strong>Produit :</strong> {fiche.produit}
          </span>
          <span>
            <strong>Créé par :</strong> {fiche.createdBy.prenom} {fiche.createdBy.nom}
          </span>
          <span>
            <strong>Soumis le :</strong>{' '}
            {fiche.dateSoumission
              ? new Date(fiche.dateSoumission).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
              : '—'}
          </span>
        </div>
        {fiche.validatedBy && (
          <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
            <span>
              <strong>Décision par :</strong> {fiche.validatedBy.prenom} {fiche.validatedBy.nom}
            </span>
            <span>
              <strong>Date décision :</strong>{' '}
              {fiche.dateDecision
                ? new Date(fiche.dateDecision).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                : '—'}
            </span>
          </div>
        )}
        {fiche.commentaire && (
          <div className={`mt-3 px-3 py-2 rounded-lg text-sm ${fiche.statut === 'REFUSE' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
            <strong>Commentaire :</strong> {fiche.commentaire}
          </div>
        )}
      </div>

      {/* ── Onglets ── */}
      <div className="border-b border-gray-200">
        <div className="flex">
          <button
            onClick={() => setActiveTab('donnees')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'donnees'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Données ({fiche.sections.length} sections)
          </button>
          <button
            onClick={() => setActiveTab('historique')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'historique'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Historique ({fiche.validationLogs.length})
          </button>
        </div>
      </div>

      {/* ── Contenu ── */}
      <div className="p-6 max-h-[500px] overflow-y-auto">
        {activeTab === 'donnees' ? (
          <div className="space-y-6">
            {fiche.sections.map((section) => (
              <SectionDataView
                key={section.id}
                titre={section.titre}
                donnees={section.donnees}
                sectionId={findSectionId(section.titre)}
              />
            ))}
          </div>
        ) : (
          <ValidationHistoryTimeline logs={fiche.validationLogs} />
        )}
      </div>

      {/* ── Barre d'action (admin, fiche en attente) ── */}
      {isEnAttente && (
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50/50">
          {submitError && (
            <div className="mb-3 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {submitError}
            </div>
          )}

          {showRejectForm ? (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Motif du rejet <span className="text-red-500">*</span>
              </label>
              <textarea
                value={commentaire}
                onChange={(e) => setCommentaire(e.target.value)}
                placeholder="Indiquez le motif du rejet (obligatoire)..."
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500/30 focus:border-red-500 resize-none"
                rows={3}
                maxLength={2000}
              />
              <div className="flex items-center gap-2 justify-end">
                <button
                  onClick={() => { setShowRejectForm(false); setCommentaire(''); }}
                  className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  onClick={handleReject}
                  disabled={isSubmitting || !commentaire.trim()}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSubmitting && <Spinner />}
                  Confirmer le rejet
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <textarea
                value={commentaire}
                onChange={(e) => setCommentaire(e.target.value)}
                placeholder="Commentaire de validation (optionnel)..."
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 resize-none"
                rows={2}
                maxLength={2000}
              />
              <div className="flex items-center gap-3 justify-end">
                <button
                  onClick={() => setShowRejectForm(true)}
                  disabled={isSubmitting}
                  className="px-5 py-2.5 text-sm font-semibold text-red-700 bg-red-50 border border-red-200 rounded-xl hover:bg-red-100 transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Refuser
                </button>
                <button
                  onClick={handleValidate}
                  disabled={isSubmitting}
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-green-600 rounded-xl hover:bg-green-700 transition-colors shadow-lg shadow-green-600/20 flex items-center gap-2"
                >
                  {isSubmitting ? <Spinner /> : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  Valider
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Sous-composants ──

function StatusBadge({ statut }: { statut: string }) {
  const styles: Record<string, string> = {
    EN_ATTENTE: 'bg-amber-100 text-amber-700',
    VALIDE: 'bg-green-100 text-green-700',
    REFUSE: 'bg-red-100 text-red-700',
    BROUILLON: 'bg-gray-100 text-gray-600',
  };
  const labels: Record<string, string> = {
    EN_ATTENTE: 'En attente',
    VALIDE: 'Validée',
    REFUSE: 'Refusée',
    BROUILLON: 'Brouillon',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${styles[statut] ?? styles.BROUILLON}`}>
      {labels[statut] ?? statut}
    </span>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

function SectionDataView({ titre, donnees, sectionId }: { titre: string; donnees: Record<string, unknown>; sectionId: string | null }) {
  const fieldsDef = sectionId ? SECTIONS_FIELDS[sectionId] : null;

  const entries = Object.entries(donnees).filter(([, v]) => v !== null && v !== undefined && v !== '');

  if (entries.length === 0) {
    return (
      <div className="border border-gray-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">{titre}</h3>
        <p className="text-xs text-gray-400 italic">Aucune donnée saisie</p>
      </div>
    );
  }

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">{titre}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
        {entries.map(([key, value]) => {
          const field = fieldsDef?.fields.find((f) => f.name === key);
          const label = field?.label ?? key;
          const unite = field?.unite;

          return (
            <div key={key} className="flex justify-between py-1.5 border-b border-gray-100 last:border-0">
              <span className="text-xs text-gray-500">{label}</span>
              <span className="text-xs font-medium text-gray-900">
                {String(value)}{unite ? ` ${unite}` : ''}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Helpers ──

const SECTION_TITLES: Record<string, string> = {
  'Bitumes oxydés': 'bitumes_oxydes',
  'Bitumes fluidifiés': 'bitumes_fluidifies',
  'Bitumes modifiés': 'bitumes_modifies',
  'Produits finis traditionnels': 'produits_finis_traditionnels',
  'Produits finis membranes': 'produits_finis_membranes',
  'Émulsions stabilisées': 'emulsions_stabilisees',
};

function findSectionId(titre: string): string | null {
  return SECTION_TITLES[titre] ?? null;
}
