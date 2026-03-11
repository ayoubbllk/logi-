'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import type { FicheComplete } from '@/types/fiche.types';
import ExportPDFButton from '@/components/export/ExportPDFButton';

type ApiResponse = { success: boolean; data?: FicheComplete; error?: string };

function formatDate(value: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleString('fr-FR');
}

function statutLabel(statut: FicheComplete['statut']) {
  if (statut === 'EN_ATTENTE') return 'En attente';
  if (statut === 'VALIDE') return 'Validée';
  if (statut === 'REFUSE') return 'Refusée';
  return 'Brouillon';
}

export default function FicheDetailPage() {
  const params = useParams<{ id: string }>();
  const ficheId = params?.id;

  const [fiche, setFiche] = useState<FicheComplete | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ficheId) return;

    let mounted = true;
    async function load() {
      try {
        setIsLoading(true);
        setError(null);

        const res = await fetch(`/api/fiches/${ficheId}`, { credentials: 'include' });
        const body = (await res.json()) as ApiResponse;

        if (!res.ok || !body.success || !body.data) {
          throw new Error(body.error ?? 'Impossible de charger la fiche');
        }

        if (mounted) setFiche(body.data);
      } catch (e) {
        if (mounted) setError(e instanceof Error ? e.message : 'Erreur inconnue');
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [ficheId]);

  const sortedSections = useMemo(() => {
    if (!fiche) return [];
    return [...fiche.sections].sort((a, b) => a.ordre - b.ordre);
  }, [fiche]);

  if (isLoading) {
    return <div className="p-8 text-slate-600">Chargement de la fiche...</div>;
  }

  if (error || !fiche) {
    return (
      <div className="p-8">
        <p className="text-rose-600">{error ?? 'Fiche introuvable'}</p>
        <Link href="/fiches" className="mt-3 inline-block text-sm text-blue-600 hover:text-blue-800">
          Retour à la liste
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{fiche.numero}</h1>
          <p className="text-slate-600 mt-1">{fiche.titre}</p>
        </div>
        <div className="flex items-center gap-2">
          <ExportPDFButton fiche={fiche} variant="outline" size="sm" />
          <Link href="/fiches" className="text-sm font-medium text-blue-600 hover:text-blue-800">
            Retour à la liste
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs uppercase text-slate-500">Produit</p>
          <p className="mt-1 text-sm font-semibold text-slate-900">{fiche.produit}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs uppercase text-slate-500">Statut</p>
          <p className="mt-1 text-sm font-semibold text-slate-900">{statutLabel(fiche.statut)}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs uppercase text-slate-500">Créée le</p>
          <p className="mt-1 text-sm font-semibold text-slate-900">{formatDate(fiche.createdAt)}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs uppercase text-slate-500">Décision le</p>
          <p className="mt-1 text-sm font-semibold text-slate-900">{formatDate(fiche.dateDecision)}</p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-slate-900">Informations</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-xs uppercase text-slate-500">Créateur</p>
            <p className="text-sm text-slate-800">{fiche.createdBy.prenom} {fiche.createdBy.nom}</p>
            <p className="text-xs text-slate-500">{fiche.createdBy.email}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-slate-500">Validé par</p>
            <p className="text-sm text-slate-800">
              {fiche.validatedBy ? `${fiche.validatedBy.prenom} ${fiche.validatedBy.nom}` : '—'}
            </p>
          </div>
        </div>
        {fiche.commentaire && (
          <div className="mt-4 rounded-md bg-slate-50 p-3">
            <p className="text-xs uppercase text-slate-500">Commentaire de validation</p>
            <p className="text-sm text-slate-700 mt-1">{fiche.commentaire}</p>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">Sections analysées</h2>
        {sortedSections.map((section) => (
          <div key={section.id} className="rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="text-sm font-semibold text-slate-800">{section.titre}</h3>
            <div className="mt-3 grid gap-2 md:grid-cols-2">
              {Object.entries(section.donnees || {}).map(([key, value]) => (
                <div key={key} className="rounded-md border border-slate-100 bg-slate-50 px-3 py-2">
                  <p className="text-xs uppercase text-slate-500">{key}</p>
                  <p className="text-sm text-slate-800 mt-1">{String(value ?? '—')}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
