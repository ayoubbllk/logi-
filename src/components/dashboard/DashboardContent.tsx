// ============================================================================
// COMPOSANT CLIENT — Contenu interactif du Dashboard
// Séparé de la page serveur pour permettre les hooks React
// ============================================================================

'use client';

import React from 'react';
import {
  StatCard,
  MonthlyChart,
  ProductChart,
  ConformityChart,
  RecentActivity,
  ProductTable,
  DashboardSkeleton,
} from '@/components/dashboard';
import { useDashboardStats } from '@/hooks/useDashboardStats';

// ── Icônes SVG inline (évite une dépendance externe) ──

const Icons = {
  clipboard: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  ),
  checkCircle: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  xCircle: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  percent: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l-8 8m0-6a2 2 0 100-4 2 2 0 000 4zm8 6a2 2 0 100-4 2 2 0 000 4z" />
    </svg>
  ),
  clock: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  edit: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  ),
  refresh: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  ),
};

export default function DashboardContent() {
  const { stats, isLoading, error, refetch } = useDashboardStats();

  // ── État de chargement ──
  if (isLoading) {
    return <DashboardSkeleton />;
  }

  // ── Erreur ──
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
        <div className="text-red-400 mb-3">
          <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <p className="text-red-800 font-medium mb-1">
          Erreur de chargement
        </p>
        <p className="text-red-600 text-sm mb-4">{error}</p>
        <button
          onClick={refetch}
          className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
        >
          {Icons.refresh}
          Réessayer
        </button>
      </div>
    );
  }

  if (!stats) return null;

  const { kpi, mensuelles, parProduit, activiteRecente } = stats;

  return (
    <div className="space-y-6">
      {/* ── Header avec bouton refresh ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
          <p className="text-sm text-gray-500 mt-1">
            Vue d&apos;ensemble du contrôle qualité
          </p>
        </div>
        <button
          onClick={refetch}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
        >
          {Icons.refresh}
          Actualiser
        </button>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          titre="Tests aujourd'hui"
          valeur={kpi.testsAujourdhui}
          sousTitre="Fiches créées"
          icone={Icons.clipboard}
          couleur="blue"
        />
        <StatCard
          titre="Validés"
          valeur={kpi.totalValides}
          sousTitre="Fiches conformes"
          icone={Icons.checkCircle}
          couleur="green"
        />
        <StatCard
          titre="Non conformes"
          valeur={kpi.totalNonConformes}
          sousTitre="Fiches refusées"
          icone={Icons.xCircle}
          couleur="red"
        />
        <StatCard
          titre="Taux conformité"
          valeur={`${kpi.tauxConformite}%`}
          sousTitre="Global"
          icone={Icons.percent}
          couleur={kpi.tauxConformite >= 95 ? 'green' : kpi.tauxConformite >= 80 ? 'amber' : 'red'}
        />
        <StatCard
          titre="En attente"
          valeur={kpi.enAttente}
          sousTitre="À valider"
          icone={Icons.clock}
          couleur="amber"
        />
        <StatCard
          titre="Brouillons"
          valeur={kpi.brouillons}
          sousTitre="En cours"
          icone={Icons.edit}
          couleur="slate"
        />
      </div>

      {/* ── Graphiques principaux ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MonthlyChart data={mensuelles} />
        <ConformityChart data={mensuelles} />
      </div>

      {/* ── Détails par produit + Activité récente ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <ProductTable data={parProduit} />
        </div>
        <div className="lg:col-span-2">
          <ProductChart data={parProduit} />
        </div>
      </div>

      {/* ── Activité récente ── */}
      <RecentActivity data={activiteRecente} />
    </div>
  );
}
