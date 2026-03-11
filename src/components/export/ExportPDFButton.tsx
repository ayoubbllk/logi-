// ============================================================================
// COMPOSANT — ExportPDFButton
// Bouton d'export PDF réutilisable avec état loading
// ============================================================================

'use client';

import React from 'react';
import { useExportPDF } from '@/hooks/useExportPDF';
import type { FicheValidationDetail } from '@/types/validation.types';
import type { FicheComplete } from '@/types/fiche.types';

type FicheForPDF = FicheValidationDetail | FicheComplete;

interface ExportPDFButtonProps {
  /** Données de la fiche (prioritaire si fourni) */
  fiche?: FicheForPDF | null;
  /** ID de la fiche (utilisé si fiche non fourni — fetch depuis API) */
  ficheId?: string;
  /** Variante visuelle */
  variant?: 'primary' | 'outline' | 'ghost';
  /** Taille */
  size?: 'sm' | 'md';
  /** Texte personnalisé */
  label?: string;
  /** Classe CSS supplémentaire */
  className?: string;
}

const VARIANTS = {
  primary:
    'bg-blue-600 text-white hover:bg-blue-700 shadow-sm shadow-blue-600/20',
  outline:
    'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-gray-400',
  ghost:
    'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
};

const SIZES = {
  sm: 'px-3 py-1.5 text-xs gap-1.5',
  md: 'px-4 py-2 text-sm gap-2',
};

export default function ExportPDFButton({
  fiche,
  ficheId,
  variant = 'outline',
  size = 'sm',
  label = 'Exporter PDF',
  className = '',
}: ExportPDFButtonProps) {
  const { exportPDF, exportPDFById, isExporting, error, clearError } =
    useExportPDF();

  const isDisabled = isExporting || (!fiche && !ficheId);

  const handleClick = async () => {
    clearError();
    if (fiche) {
      await exportPDF(fiche);
    } else if (ficheId) {
      await exportPDFById(ficheId);
    }
  };

  return (
    <div className="relative inline-flex flex-col items-start">
      <button
        onClick={handleClick}
        disabled={isDisabled}
        title={error ?? label}
        className={`
          inline-flex items-center font-medium rounded-lg transition-all duration-150
          disabled:opacity-50 disabled:cursor-not-allowed
          ${VARIANTS[variant]}
          ${SIZES[size]}
          ${className}
        `}
      >
        {isExporting ? (
          <svg
            className="animate-spin w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        ) : (
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        )}
        {isExporting ? 'Generation...' : label}
      </button>

      {/* Tooltip d'erreur */}
      {error && (
        <div className="absolute top-full left-0 mt-1 z-50 max-w-xs">
          <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-700 shadow-lg">
            <div className="flex items-start gap-2">
              <svg
                className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-red-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <span>{error}</span>
              <button
                onClick={clearError}
                className="ml-auto text-red-400 hover:text-red-600"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
