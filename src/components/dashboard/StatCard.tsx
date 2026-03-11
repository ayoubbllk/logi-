// ============================================================================
// COMPOSANT — Carte KPI
// Affiche un indicateur clé avec icône, valeur et variation
// ============================================================================

'use client';

import React from 'react';

interface StatCardProps {
  titre: string;
  valeur: string | number;
  sousTitre?: string;
  icone: React.ReactNode;
  couleur: 'blue' | 'green' | 'red' | 'amber' | 'purple' | 'slate';
  tendance?: {
    valeur: number;  // ex: +12 ou -5
    label: string;   // ex: "vs hier"
  };
}

const COULEURS = {
  blue: {
    bg: 'bg-blue-50',
    icon: 'bg-blue-500',
    text: 'text-blue-700',
    badge: 'text-blue-600',
  },
  green: {
    bg: 'bg-emerald-50',
    icon: 'bg-emerald-500',
    text: 'text-emerald-700',
    badge: 'text-emerald-600',
  },
  red: {
    bg: 'bg-red-50',
    icon: 'bg-red-500',
    text: 'text-red-700',
    badge: 'text-red-600',
  },
  amber: {
    bg: 'bg-amber-50',
    icon: 'bg-amber-500',
    text: 'text-amber-700',
    badge: 'text-amber-600',
  },
  purple: {
    bg: 'bg-purple-50',
    icon: 'bg-purple-500',
    text: 'text-purple-700',
    badge: 'text-purple-600',
  },
  slate: {
    bg: 'bg-slate-50',
    icon: 'bg-slate-500',
    text: 'text-slate-700',
    badge: 'text-slate-600',
  },
};

export default function StatCard({
  titre,
  valeur,
  sousTitre,
  icone,
  couleur,
  tendance,
}: StatCardProps) {
  const c = COULEURS[couleur];

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between">
        {/* Texte */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-500 truncate">{titre}</p>
          <p className={`mt-2 text-3xl font-bold ${c.text}`}>{valeur}</p>
          {sousTitre && (
            <p className="mt-1 text-sm text-gray-400">{sousTitre}</p>
          )}
          {tendance && (
            <div className="mt-2 flex items-center gap-1">
              <span
                className={`text-xs font-semibold ${
                  tendance.valeur >= 0 ? 'text-emerald-600' : 'text-red-500'
                }`}
              >
                {tendance.valeur >= 0 ? '↑' : '↓'}{' '}
                {Math.abs(tendance.valeur)}%
              </span>
              <span className="text-xs text-gray-400">{tendance.label}</span>
            </div>
          )}
        </div>

        {/* Icône */}
        <div
          className={`flex-shrink-0 w-12 h-12 ${c.icon} rounded-lg flex items-center justify-center text-white`}
        >
          {icone}
        </div>
      </div>
    </div>
  );
}
