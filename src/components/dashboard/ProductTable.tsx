// ============================================================================
// COMPOSANT — Tableau de conformité par produit
// ============================================================================

'use client';

import React from 'react';
import type { StatsParProduit } from '@/types/stats.types';

interface ProductTableProps {
  data: StatsParProduit[];
}

const PRODUCT_LABELS: Record<string, string> = {
  BITUME_ROUTIER: 'Bitume routier',
  BITUME_MODIFIE: 'Bitume modifié',
  EMULSION: 'Émulsion',
  MEMBRANE: 'Membrane',
};

function ConformityBar({ taux }: { taux: number }) {
  const couleur =
    taux >= 95
      ? 'bg-emerald-500'
      : taux >= 80
        ? 'bg-amber-500'
        : 'bg-red-500';

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full rounded-full ${couleur} transition-all duration-500`}
          style={{ width: `${Math.min(taux, 100)}%` }}
        />
      </div>
      <span
        className={`text-sm font-semibold tabular-nums w-14 text-right ${
          taux >= 95
            ? 'text-emerald-600'
            : taux >= 80
              ? 'text-amber-600'
              : 'text-red-600'
        }`}
      >
        {taux}%
      </span>
    </div>
  );
}

export default function ProductTable({ data }: ProductTableProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      <div className="p-6 border-b border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900">
          Conformité par produit
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          Taux de conformité par type de produit
        </p>
      </div>

      {data.length === 0 ? (
        <div className="p-12 text-center">
          <p className="text-sm text-gray-400">Aucune donnée disponible</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                  Produit
                </th>
                <th className="text-center text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">
                  Total
                </th>
                <th className="text-center text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">
                  Validés
                </th>
                <th className="text-center text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">
                  Refusés
                </th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3 w-48">
                  Conformité
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data.map((row) => (
                <tr key={row.produit} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-gray-900">
                      {PRODUCT_LABELS[row.produit] ?? row.produit}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className="text-sm tabular-nums text-gray-700 font-medium">
                      {row.total}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className="text-sm tabular-nums text-emerald-600 font-medium">
                      {row.valides}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className="text-sm tabular-nums text-red-600 font-medium">
                      {row.refuses}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <ConformityBar taux={row.tauxConformite} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
