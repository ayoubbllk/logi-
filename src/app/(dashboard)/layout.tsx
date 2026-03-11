// ============================================================================
// LAYOUT — Zone Dashboard (avec sidebar + header)
// Server Component qui lit les infos utilisateur depuis le middleware
// ============================================================================

import React from 'react';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Lire les infos injectées par le middleware
  const headersList = await headers();
  const userId = headersList.get('x-user-id');
  const userRole = headersList.get('x-user-role') ?? 'CONTROLEUR';
  const userNom = headersList.get('x-user-nom') ?? '';
  const userPrenom = headersList.get('x-user-prenom') ?? '';

  // Si pas d'utilisateur (middleware n'a pas injecté), rediriger
  if (!userId) {
    redirect('/login');
  }

  const userName = `${userPrenom} ${userNom}`.trim() || 'Utilisateur';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar fixe */}
      <Sidebar userRole={userRole} userName={userName} />

      {/* Contenu principal */}
      <div className="ml-64 min-h-screen flex flex-col">
        <Header userName={userName} userRole={userRole} />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
