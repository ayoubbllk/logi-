// ============================================================================
// HOOK — useDashboardStats
// Fetch les stats du dashboard avec gestion du loading et des erreurs
// ============================================================================

'use client';

import { useState, useEffect, useCallback } from 'react';
import type { DashboardStats } from '@/types/stats.types';

interface UseDashboardStatsReturn {
  stats: DashboardStats | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useDashboardStats(): UseDashboardStatsReturn {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/stats?t=${Date.now()}`, {
        credentials: 'include', // Envoie le cookie JWT
        cache: 'no-store',
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(
          body?.error ?? `Erreur ${response.status}`
        );
      }

      const body = await response.json();
      setStats(body.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      fetchStats();
    }, 10000);

    return () => window.clearInterval(interval);
  }, [fetchStats]);

  useEffect(() => {
    const onFocus = () => fetchStats();
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        fetchStats();
      }
    };

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [fetchStats]);

  return { stats, isLoading, error, refetch: fetchStats };
}
