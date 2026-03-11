// ============================================================================
// COMPOSANT — SuccessModal (modale de succès après création de fiche)
// ============================================================================

'use client';

import React from 'react';

interface SuccessModalProps {
  numero: string;
  titre: string;
  onClose: () => void;
  onNewFiche: () => void;
  onViewList: () => void;
}

export default function SuccessModal({
  numero,
  titre,
  onClose,
  onNewFiche,
  onViewList,
}: SuccessModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modale */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 transform animate-in fade-in zoom-in-95 duration-300">
        {/* Icône succès */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>

        {/* Contenu */}
        <div className="text-center space-y-3">
          <h2 className="text-xl font-bold text-gray-900">Fiche créée avec succès !</h2>
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Numéro</span>
              <span className="font-mono font-semibold text-blue-600">{numero}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Titre</span>
              <span className="font-medium text-gray-900 truncate ml-2">{titre}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Statut</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                En attente
              </span>
            </div>
          </div>
          <p className="text-sm text-gray-500">
            La fiche a été soumise et est en attente de validation par un administrateur.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 mt-6">
          <button
            onClick={onViewList}
            className="w-full px-4 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors"
          >
            Voir la liste des fiches
          </button>
          <button
            onClick={onNewFiche}
            className="w-full px-4 py-2.5 bg-white border border-gray-300 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-colors"
          >
            Créer une nouvelle fiche
          </button>
        </div>
      </div>
    </div>
  );
}
