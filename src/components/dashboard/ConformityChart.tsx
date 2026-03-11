// ============================================================================
// COMPOSANT — Graphique ligne : Taux de conformité mensuel
// ============================================================================

'use client';

import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  type ChartOptions,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import type { StatsMensuelles } from '@/types/stats.types';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface ConformityChartProps {
  data: StatsMensuelles[];
}

export default function ConformityChart({ data }: ConformityChartProps) {
  // Calculer le taux de conformité par mois
  const tauxParMois = data.map((m) => {
    const traites = m.valides + m.refuses;
    return traites > 0 ? Math.round((m.valides / traites) * 100 * 10) / 10 : null;
  });

  const chartData = {
    labels: data.map((d) => d.label),
    datasets: [
      {
        label: 'Taux de conformité (%)',
        data: tauxParMois,
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderWidth: 2.5,
        pointBackgroundColor: 'rgb(16, 185, 129)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7,
        tension: 0.35,
        fill: true,
        spanGaps: true,
      },
      {
        label: 'Objectif (95%)',
        data: data.map(() => 95),
        borderColor: 'rgba(239, 68, 68, 0.5)',
        borderWidth: 2,
        borderDash: [8, 4],
        pointRadius: 0,
        fill: false,
      },
    ],
  };

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 20,
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
          label: (context) => {
            const value = context.raw as number | null;
            if (value === null) return 'Pas de données';
            return `${context.dataset.label} : ${value}%`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          font: { size: 11, family: 'Inter, sans-serif' },
          color: '#94a3b8',
        },
      },
      y: {
        min: 0,
        max: 100,
        grid: { color: 'rgba(241, 245, 249, 1)' },
        ticks: {
          stepSize: 20,
          callback: (value) => `${value}%`,
          font: { size: 11, family: 'Inter, sans-serif' },
          color: '#94a3b8',
        },
      },
    },
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Taux de conformité
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Évolution mensuelle vs objectif 95%
          </p>
        </div>
      </div>
      <div className="h-[320px]">
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
}
