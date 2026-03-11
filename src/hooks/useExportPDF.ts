// ============================================================================
// HOOK — useExportPDF
// Gère l'état de l'export PDF (loading, erreurs)
// ============================================================================

'use client';

import { useState, useCallback } from 'react';
import type { FicheValidationDetail } from '@/types/validation.types';
import type { FicheComplete } from '@/types/fiche.types';

type FicheForPDF = FicheValidationDetail | FicheComplete;

interface UseExportPDFReturn {
  /** Lance la génération et le téléchargement du PDF */
  exportPDF: (fiche: FicheForPDF) => Promise<void>;
  /** Lance la récupération depuis l'API puis le téléchargement */
  exportPDFById: (ficheId: string) => Promise<void>;
  /** Indique si la génération est en cours */
  isExporting: boolean;
  /** Erreur éventuelle */
  error: string | null;
  /** Reset l'erreur */
  clearError: () => void;
}

export function useExportPDF(): UseExportPDFReturn {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  // ── Export avec données déjà chargées ──
  const exportPDF = useCallback(async (fiche: FicheForPDF) => {
    try {
      setIsExporting(true);
      setError(null);

      // Import dynamique pour garder le bundle léger
      const { generateQualityControlPDF } = await import(
        '@/services/generateQualityPDF'
      );

      await generateQualityControlPDF(fiche);
    } catch (err) {
      console.error('[EXPORT PDF]', err);
      setError(
        err instanceof Error
          ? `Erreur export PDF : ${err.message}`
          : 'Erreur inconnue lors de l\'export PDF'
      );
    } finally {
      setIsExporting(false);
    }
  }, []);

  // ── Export par ID (récupère d'abord depuis l'API) ──
  const exportPDFById = useCallback(async (ficheId: string) => {
    try {
      setIsExporting(true);
      setError(null);

      // Récupérer la fiche depuis l'API
      const res = await fetch(`/api/fiches/${ficheId}`, {
        credentials: 'include',
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? `Erreur HTTP ${res.status}`);
      }

      const body = await res.json();
      if (!body.success) {
        throw new Error(body.error ?? 'Données introuvables');
      }

      const fiche = body.data as FicheForPDF;

      // Générer le PDF
      const { generateQualityControlPDF } = await import(
        '@/services/generateQualityPDF'
      );

      await generateQualityControlPDF(fiche);
    } catch (err) {
      console.error('[EXPORT PDF BY ID]', err);
      setError(
        err instanceof Error
          ? `Erreur export PDF : ${err.message}`
          : 'Erreur inconnue lors de l\'export PDF'
      );
    } finally {
      setIsExporting(false);
    }
  }, []);

  return { exportPDF, exportPDFById, isExporting, error, clearError };
}
