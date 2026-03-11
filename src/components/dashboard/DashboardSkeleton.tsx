// ============================================================================
// COMPOSANT — Skeleton de chargement pour le dashboard
// ============================================================================

import React from 'react';

function Pulse({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-gray-200 rounded ${className ?? ''}`} />
  );
}

export function StatCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <Pulse className="h-4 w-24 mb-3" />
          <Pulse className="h-8 w-16 mb-2" />
          <Pulse className="h-3 w-20" />
        </div>
        <Pulse className="w-12 h-12 rounded-lg" />
      </div>
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <Pulse className="h-5 w-48 mb-1" />
      <Pulse className="h-3 w-36 mb-6" />
      <div className="h-[320px] flex items-end gap-2 px-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <Pulse
            key={i}
            className="flex-1 rounded-t"
            style={{ height: `${Math.random() * 60 + 20}%` } as React.CSSProperties}
          />
        ))}
      </div>
    </div>
  );
}

export function TableSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      <div className="p-6 border-b border-gray-100">
        <Pulse className="h-5 w-40 mb-1" />
        <Pulse className="h-3 w-56 mt-2" />
      </div>
      <div className="divide-y divide-gray-50">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-6 py-4">
            <Pulse className="w-2.5 h-2.5 rounded-full" />
            <div className="flex-1">
              <Pulse className="h-4 w-28 mb-2" />
              <Pulse className="h-3 w-48" />
            </div>
            <Pulse className="h-3 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartSkeleton />
        <ChartSkeleton />
      </div>

      {/* Tableau + activité */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TableSkeleton />
        <TableSkeleton />
      </div>
    </div>
  );
}
