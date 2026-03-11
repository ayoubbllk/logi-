// ============================================================================
// PAGE — /dashboard
// Server Component qui charge le composant client du dashboard
// ============================================================================

import React from 'react';
import DashboardContent from '@/components/dashboard/DashboardContent';

export const metadata = {
  title: 'Tableau de bord — Contrôle Qualité',
  description: 'Vue d\'ensemble des fiches de contrôle qualité',
};

export default function DashboardPage() {
  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      <DashboardContent />
    </div>
  );
}
