'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import ExportPDFButton from '@/components/export/ExportPDFButton';

type FicheItem = {
  id: string;
  numero: string;
  titre: string;
  produit: string;
  statut: 'BROUILLON' | 'EN_ATTENTE' | 'VALIDE' | 'REFUSE';
  createdAt: string;
  createdBy?: { nom: string; prenom: string };
  _count?: { sections: number };
};

type ApiResponse = {
  success: boolean;
  data?: {
    fiches: FicheItem[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
  error?: string;
};

function statutClass(statut: FicheItem['statut']) {
  switch (statut) {
    case 'VALIDE':
      return 'bg-emerald-100 text-emerald-700 border border-emerald-200';
    case 'REFUSE':
      return 'bg-rose-100 text-rose-700 border border-rose-200';
    case 'EN_ATTENTE':
      return 'bg-amber-100 text-amber-700 border border-amber-200';
    default:
      return 'bg-slate-100 text-slate-700 border border-slate-200';
  }
}

function statutLabel(statut: FicheItem['statut']) {
  if (statut === 'EN_ATTENTE') return 'En attente';
  if (statut === 'VALIDE') return 'Validée';
  if (statut === 'REFUSE') return 'Refusée';
  return 'Brouillon';
}

export default function FichesPage() {
  const [fiches, setFiches] = useState<FicheItem[]>([]);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setIsLoading(true);
        setError(null);

        const params = new URLSearchParams({ page: String(page), limit: '10' });
        const res = await fetch(`/api/fiches?${params.toString()}`, { credentials: 'include' });
        const body = (await res.json()) as ApiResponse;

        if (!res.ok || !body.success || !body.data) {
          throw new Error(body.error ?? 'Impossible de charger les fiches');
        }

        if (!mounted) return;
        setFiches(body.data.fiches);
        setPagination(body.data.pagination);
      } catch (e) {
        if (!mounted) return;
        setError(e instanceof Error ? e.message : 'Erreur inconnue');
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [page]);

  const canPrev = useMemo(() => page > 1, [page]);
  const canNext = useMemo(() => page < pagination.totalPages, [page, pagination.totalPages]);

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Fiches de contrôle</h1>
          <p className="text-sm text-slate-500 mt-1">Liste des fiches créées et leur statut de validation.</p>
        </div>
        <Link
          href="/fiches/new"
          className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Nouvelle fiche
        </Link>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-slate-500">Chargement des fiches...</div>
        ) : error ? (
          <div className="p-8 text-center text-rose-600">{error}</div>
        ) : fiches.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-slate-700 font-medium">Aucune fiche trouvée</p>
            <p className="text-sm text-slate-500 mt-1">Créez votre première fiche pour commencer.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Numéro</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Titre</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Produit</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Statut</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Sections</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {fiches.map((fiche) => (
                    <tr key={fiche.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-sm font-medium text-slate-800">{fiche.numero}</td>
                      <td className="px-4 py-3 text-sm text-slate-700">{fiche.titre}</td>
                      <td className="px-4 py-3 text-sm text-slate-700">{fiche.produit}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statutClass(fiche.statut)}`}>
                          {statutLabel(fiche.statut)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-700">{fiche._count?.sections ?? 0}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-2">
                          <ExportPDFButton ficheId={fiche.id} variant="ghost" size="sm" label="PDF" />
                          <Link
                            href={`/fiches/${fiche.id}`}
                            className="text-sm font-medium text-blue-600 hover:text-blue-800"
                          >
                            Voir
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3">
              <p className="text-xs text-slate-500">
                {pagination.total} fiche(s) au total • page {pagination.page} / {Math.max(1, pagination.totalPages)}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => canPrev && setPage((p) => p - 1)}
                  disabled={!canPrev}
                  className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 disabled:opacity-50"
                >
                  Précédent
                </button>
                <button
                  type="button"
                  onClick={() => canNext && setPage((p) => p + 1)}
                  disabled={!canNext}
                  className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 disabled:opacity-50"
                >
                  Suivant
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
