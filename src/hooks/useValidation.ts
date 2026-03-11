// ============================================================================
// HOOK — useValidation
// Gestion de l'état pour l'interface de validation admin
// ============================================================================

'use client';

import { useState, useEffect, useCallback } from 'react';
import type { ValidationStats, FicheEnAttente, FicheValidationDetail } from '@/types/validation.types';
import { getSecureHeaders } from '@/lib/csrf-client';

// ── Stats de validation ──

export function useValidationStats() {
  const [stats, setStats] = useState<ValidationStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/validation/stats?t=${Date.now()}`, {
        credentials: 'include',
        cache: 'no-store',
      });
      const body = await res.json();
      if (body.success) setStats(body.data);
    } catch (err) {
      console.error('[VALIDATION STATS]', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  return { stats, isLoading, refetch: fetchStats };
}

// ── Liste des fiches en attente ──

export function useFichesEnAttente(page = 1, search = '') {
  const [fiches, setFiches] = useState<FicheEnAttente[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [isLoading, setIsLoading] = useState(true);

  const fetchFiches = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({ page: String(page), limit: '10' });
      if (search) params.set('search', search);

      params.set('t', String(Date.now()));
      const res = await fetch(`/api/validation/en-attente?${params}`, {
        credentials: 'include',
        cache: 'no-store',
      });
      const body = await res.json();
      if (body.success) {
        setFiches(body.data.fiches);
        setPagination(body.data.pagination);
      }
    } catch (err) {
      console.error('[FICHES EN ATTENTE]', err);
    } finally {
      setIsLoading(false);
    }
  }, [page, search]);

  useEffect(() => { fetchFiches(); }, [fetchFiches]);

  return { fiches, pagination, isLoading, refetch: fetchFiches };
}

// ── Détail d'une fiche ──

export function useFicheDetail(ficheId: string | null) {
  const [fiche, setFiche] = useState<FicheValidationDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFiche = useCallback(async () => {
    if (!ficheId) { setFiche(null); return; }
    try {
      setIsLoading(true);
      setError(null);
      const res = await fetch(`/api/fiches/${ficheId}?t=${Date.now()}`, {
        credentials: 'include',
        cache: 'no-store',
      });
      const body = await res.json();
      if (body.success) {
        setFiche(body.data);
      } else {
        setError(body.error ?? 'Erreur lors du chargement');
      }
    } catch {
      setError('Erreur réseau');
    } finally {
      setIsLoading(false);
    }
  }, [ficheId]);

  useEffect(() => { fetchFiche(); }, [fetchFiche]);

  return { fiche, isLoading, error, refetch: fetchFiche };
}

// ── Historique des validations ──

export function useHistoriqueValidations(page = 1, action?: 'VALIDATION' | 'REJET') {
  const [logs, setLogs] = useState<unknown[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [isLoading, setIsLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (action) params.set('action', action);

      params.set('t', String(Date.now()));
      const res = await fetch(`/api/validation/historique?${params}`, {
        credentials: 'include',
        cache: 'no-store',
      });
      const body = await res.json();
      if (body.success) {
        setLogs(body.data.logs);
        setPagination(body.data.pagination);
      }
    } catch (err) {
      console.error('[HISTORIQUE]', err);
    } finally {
      setIsLoading(false);
    }
  }, [page, action]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  return { logs, pagination, isLoading, refetch: fetchLogs };
}

// ── Soumettre une décision ──

export function useDecision() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitDecision = useCallback(async (
    ficheId: string,
    action: 'VALIDATION' | 'REJET',
    commentaire?: string
  ) => {
    try {
      setIsSubmitting(true);
      setError(null);

      const res = await fetch(`/api/fiches/${ficheId}/validate`, {
        method: 'POST',
        headers: getSecureHeaders(),
        credentials: 'include',
        body: JSON.stringify({ action, commentaire }),
      });

      const body = await res.json();

      if (!res.ok || !body.success) {
        if (res.status === 409) {
          return { alreadyProcessed: true };
        }
        setError(body.error ?? 'Erreur lors de la décision');
        return null;
      }

      return body.data;
    } catch {
      setError('Erreur réseau');
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  return { submitDecision, isSubmitting, error, setError };
}
