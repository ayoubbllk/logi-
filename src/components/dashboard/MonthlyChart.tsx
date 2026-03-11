// ============================================================================
// COMPOSANT — Graphique barres : Statistiques mensuelles
// Utilise Chart.js / react-chartjs-2
// ============================================================================

'use client';

import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  type ChartOptions,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import type { StatsMensuelles } from '@/types/stats.types';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface MonthlyChartProps {
  data: StatsMensuelles[];
}

export default function MonthlyChart({ data }: MonthlyChartProps) {
  const chartData = {
    labels: data.map((d) => d.label),
    datasets: [
      {
        label: 'Validés',
        data: data.map((d) => d.valides),
        backgroundColor: 'rgba(16, 185, 129, 0.85)',  // emerald-500
        borderColor: 'rgb(16, 185, 129)',
        borderWidth: 1,
        borderRadius: 4,
        barPercentage: 0.7,
      },
      {
        label: 'Refusés',
        data: data.map((d) => d.refuses),
        backgroundColor: 'rgba(239, 68, 68, 0.85)',   // red-500
        borderColor: 'rgb(239, 68, 68)',
        borderWidth: 1,
        borderRadius: 4,
        barPercentage: 0.7,
      },
      {
        label: 'En attente',
        data: data.map((d) => d.enAttente),
        backgroundColor: 'rgba(245, 158, 11, 0.85)',   // amber-500
        borderColor: 'rgb(245, 158, 11)',
        borderWidth: 1,
        borderRadius: 4,
        barPercentage: 0.7,
      },
    ],
  };

  const options: ChartOptions<'bar'> = {
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
          footer: (items) => {
            const total = items.reduce((sum, item) => sum + (item.raw as number), 0);
            return `Total : ${total}`;
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
        beginAtZero: true,
        grid: { color: 'rgba(241, 245, 249, 1)' },
        ticks: {
          stepSize: 1,
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
            Statistiques mensuelles
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Évolution sur les 12 derniers mois
          </p>
        </div>
      </div>
      <div className="h-[320px]">
        <Bar data={chartData} options={options} />
      </div>
    </div>
  );
}
