// ============================================================================
// COMPOSANT — Graphique doughnut : Répartition par produit
// ============================================================================

'use client';

import React from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  type ChartOptions,
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import type { StatsParProduit } from '@/types/stats.types';

ChartJS.register(ArcElement, Tooltip, Legend);

interface ProductChartProps {
  data: StatsParProduit[];
}

// Palette de couleurs pour les produits
const PRODUCT_COLORS = [
  { bg: 'rgba(59, 130, 246, 0.85)', border: 'rgb(59, 130, 246)' },    // blue
  { bg: 'rgba(16, 185, 129, 0.85)', border: 'rgb(16, 185, 129)' },    // emerald
  { bg: 'rgba(245, 158, 11, 0.85)', border: 'rgb(245, 158, 11)' },    // amber
  { bg: 'rgba(139, 92, 246, 0.85)', border: 'rgb(139, 92, 246)' },    // violet
  { bg: 'rgba(236, 72, 153, 0.85)', border: 'rgb(236, 72, 153)' },    // pink
  { bg: 'rgba(20, 184, 166, 0.85)', border: 'rgb(20, 184, 166)' },    // teal
];

// Noms lisibles des produits
const PRODUCT_LABELS: Record<string, string> = {
  BITUME_ROUTIER: 'Bitume routier',
  BITUME_MODIFIE: 'Bitume modifié',
  EMULSION: 'Émulsion',
  MEMBRANE: 'Membrane',
};

export default function ProductChart({ data }: ProductChartProps) {
  const chartData = {
    labels: data.map(
      (d) => PRODUCT_LABELS[d.produit] ?? d.produit
    ),
    datasets: [
      {
        data: data.map((d) => d.total),
        backgroundColor: data.map((_, i) => PRODUCT_COLORS[i % PRODUCT_COLORS.length].bg),
        borderColor: data.map((_, i) => PRODUCT_COLORS[i % PRODUCT_COLORS.length].border),
        borderWidth: 2,
        hoverOffset: 6,
      },
    ],
  };

  const options: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '65%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 16,
          font: { size: 12, family: 'Inter, sans-serif' },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        titleFont: { size: 13, family: 'Inter, sans-serif' },
        bodyFont: { size: 12, family: 'Inter, sans-serif' },
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          afterLabel: (context) => {
            const item = data[context.dataIndex];
            return `Conformité : ${item.tauxConformite}%`;
          },
        },
      },
    },
  };

  const total = data.reduce((sum, d) => sum + d.total, 0);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Répartition par produit
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            {total} fiches au total
          </p>
        </div>
      </div>
      <div className="h-[320px] flex items-center justify-center">
        {data.length > 0 ? (
          <Doughnut data={chartData} options={options} />
        ) : (
          <p className="text-gray-400 text-sm">Aucune donnée disponible</p>
        )}
      </div>
    </div>
  );
}
