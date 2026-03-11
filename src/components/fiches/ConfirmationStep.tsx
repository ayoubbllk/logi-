// ============================================================================
// COMPOSANT — ConfirmationStep (dernière étape : récapitulatif avant envoi)
// Résume toutes les sections remplies et permet la soumission
// ============================================================================

'use client';

import React from 'react';
import type { SectionMeta, SectionFormData, FicheFormState } from '@/types/fiche.types';
import { SECTIONS_FIELDS } from '@/config/sections-fields';

interface ConfirmationStepProps {
  formState: FicheFormState;
  sectionsMeta: SectionMeta[];
  isSubmitting: boolean;
  onSubmit: () => void;
  onGoToStep: (step: number) => void;
}

function formatPreviewValue(value: unknown): string {
  if (typeof value === 'boolean') {
    return value ? 'Oui' : 'Non';
  }
  if (value === null || value === undefined || value === '') {
    return '—';
  }
  return String(value);
}

export default function ConfirmationStep({
  formState,
  sectionsMeta,
  isSubmitting,
  onSubmit,
  onGoToStep,
}: ConfirmationStepProps) {
  // Calculer les stats de remplissage
  const sectionStats = sectionsMeta.map((meta, index) => {
    const sectionData = formState.sections[meta.id] ?? {};
    const fieldsDef = SECTIONS_FIELDS[meta.id];
    if (!fieldsDef) {
      return { meta, filled: 0, total: 0, requiredFilled: 0, requiredTotal: 0 };
    }

    const total = fieldsDef.fields.length;
    const filled = fieldsDef.fields.filter((f) => {
      const val = sectionData[f.name];
      return val !== null && val !== undefined && val !== '';
    }).length;

    const requiredFields = fieldsDef.fields.filter((f) => f.required);
    const requiredFilled = requiredFields.filter((f) => {
      const val = sectionData[f.name];
      return val !== null && val !== undefined && val !== '';
    }).length;

    return { meta, filled, total, requiredFilled, requiredTotal: requiredFields.length, index };
  });

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="border-b border-gray-200 pb-4">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-2xl">✅</span>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Récapitulatif et soumission</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Vérifiez les informations avant de soumettre la fiche de contrôle qualité.
            </p>
          </div>
        </div>
      </div>

      {/* Infos générales */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            Informations générales
          </h3>
          <button
            onClick={() => onGoToStep(0)}
            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
          >
            Modifier
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-400 uppercase">Titre</p>
            <p className="text-sm font-medium text-gray-900 mt-0.5">
              {formState.titre || <span className="text-red-500 italic">Non renseigné</span>}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase">Référence / Version</p>
            <p className="text-sm font-medium text-gray-900 mt-0.5">
              {formState.referenceDocument} - v{formState.versionDocument}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase">Date d'application</p>
            <p className="text-sm font-medium text-gray-900 mt-0.5">
              {formState.dateApplication || <span className="text-red-500 italic">Non renseignée</span>}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase">Date fiche</p>
            <p className="text-sm font-medium text-gray-900 mt-0.5">
              {formState.dateFiche || <span className="text-red-500 italic">Non renseignée</span>}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase">Numéro de fiche</p>
            <p className="text-sm font-medium text-blue-600 mt-0.5">
              Généré automatiquement
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase">Statut initial</p>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 mt-0.5">
              En attente de validation
            </span>
          </div>
        </div>
      </div>

      {/* Récapitulatif des sections */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
          Sections de contrôle
        </h3>

        {sectionStats.map((stat) => {
          const pct = stat.requiredTotal > 0
            ? Math.round((stat.requiredFilled / stat.requiredTotal) * 100)
            : 100;
          const isComplete = pct === 100;

          return (
            <div
              key={stat.meta.id}
              className={`
                border rounded-xl p-4 transition-all
                ${isComplete
                  ? 'border-green-200 bg-green-50/50'
                  : 'border-amber-200 bg-amber-50/50'
                }
              `}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-lg">{stat.meta.icon}</span>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{stat.meta.titre}</p>
                    <p className="text-xs text-gray-500">
                      {stat.filled}/{stat.total} champs · {stat.requiredFilled}/{stat.requiredTotal} obligatoires
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`
                      text-xs font-bold px-2 py-0.5 rounded-full
                      ${isComplete ? 'bg-green-200 text-green-700' : 'bg-amber-200 text-amber-700'}
                    `}
                  >
                    {pct}%
                  </span>
                  <button
                    onClick={() => onGoToStep((stat.index ?? 0) + 1)}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Modifier
                  </button>
                </div>
              </div>

              {/* Aperçu des données remplies */}
              <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
                {SECTIONS_FIELDS[stat.meta.id]?.fields
                  .filter((f) => {
                    const val = formState.sections[stat.meta.id]?.[f.name];
                    return val !== null && val !== undefined && val !== '';
                  })
                  .slice(0, 6)
                  .map((f) => (
                    <div key={f.name} className="text-xs">
                      <span className="text-gray-400">{f.label}:</span>{' '}
                      <span className="font-medium text-gray-700">
                        {formatPreviewValue(formState.sections[stat.meta.id]?.[f.name])}
                        {f.unite ? ` ${f.unite}` : ''}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bouton soumission */}
      <div className="flex justify-end pt-4 border-t border-gray-200">
        <button
          onClick={onSubmit}
          disabled={isSubmitting}
          className={`
            inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold
            transition-all duration-200 shadow-lg shadow-blue-500/20
            ${isSubmitting
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none'
              : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98]'
            }
          `}
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Soumission en cours...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              Soumettre la fiche
            </>
          )}
        </button>
      </div>
    </div>
  );
}
