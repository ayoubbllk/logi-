// ============================================================================
// COMPOSANT — ValidationStatsCards (cartes KPI pour la validation)
// ============================================================================

'use client';

import React from 'react';
import type { ValidationStats } from '@/types/validation.types';

interface ValidationStatsCardsProps {
  stats: ValidationStats | null;
  isLoading: boolean;
}

const STAT_CARDS = [
  {
    key: 'enAttente' as const,
    label: 'En attente',
    color: 'amber',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    key: 'validees' as const,
    label: 'Validées',
    color: 'green',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    key: 'refusees' as const,
    label: 'Refusées',
    color: 'red',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    key: 'totalAujourdhui' as const,
    label: 'Traitées aujourd\'hui',
    color: 'blue',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
  },
];

const COLOR_MAP: Record<string, { bg: string; text: string; iconBg: string }> = {
  amber: { bg: 'bg-amber-50', text: 'text-amber-700', iconBg: 'bg-amber-100' },
  green: { bg: 'bg-green-50', text: 'text-green-700', iconBg: 'bg-green-100' },
  red: { bg: 'bg-red-50', text: 'text-red-700', iconBg: 'bg-red-100' },
  blue: { bg: 'bg-blue-50', text: 'text-blue-700', iconBg: 'bg-blue-100' },
};

export default function ValidationStatsCards({ stats, isLoading }: ValidationStatsCardsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {STAT_CARDS.map((card) => {
        const colors = COLOR_MAP[card.color];
        const value = stats ? stats[card.key] : 0;

        return (
          <div
            key={card.key}
            className={`${colors.bg} rounded-xl p-4 border border-${card.color}-100`}
          >
            {isLoading ? (
              <div className="animate-pulse space-y-2">
                <div className="h-8 w-8 bg-gray-200 rounded-lg" />
                <div className="h-6 w-12 bg-gray-200 rounded" />
                <div className="h-4 w-20 bg-gray-200 rounded" />
              </div>
            ) : (
              <>
                <div className={`${colors.iconBg} ${colors.text} w-10 h-10 rounded-lg flex items-center justify-center mb-3`}>
                  {card.icon}
                </div>
                <p className={`text-2xl font-bold ${colors.text}`}>{value}</p>
                <p className="text-sm text-gray-600 mt-0.5">{card.label}</p>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
