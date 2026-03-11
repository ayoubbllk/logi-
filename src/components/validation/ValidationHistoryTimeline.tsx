// ============================================================================
// COMPOSANT — ValidationHistoryTimeline (chronologie des actions sur une fiche)
// ============================================================================

'use client';

import React from 'react';
import type { ValidationLogEntry } from '@/types/validation.types';

interface ValidationHistoryTimelineProps {
  logs: ValidationLogEntry[];
}

const ACTION_CONFIG: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  CREATION: {
    label: 'Création',
    color: 'blue',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
      </svg>
    ),
  },
  MODIFICATION: {
    label: 'Modification',
    color: 'yellow',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
  },
  SOUMISSION: {
    label: 'Soumission',
    color: 'indigo',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
      </svg>
    ),
  },
  VALIDATION: {
    label: 'Validation',
    color: 'green',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  REJET: {
    label: 'Rejet',
    color: 'red',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
};

const COLOR_CLASSES: Record<string, { dot: string; bg: string; text: string; line: string }> = {
  blue:   { dot: 'bg-blue-600',   bg: 'bg-blue-50',   text: 'text-blue-700',   line: 'border-blue-200' },
  yellow: { dot: 'bg-yellow-500', bg: 'bg-yellow-50', text: 'text-yellow-700', line: 'border-yellow-200' },
  indigo: { dot: 'bg-indigo-600', bg: 'bg-indigo-50', text: 'text-indigo-700', line: 'border-indigo-200' },
  green:  { dot: 'bg-green-600',  bg: 'bg-green-50',  text: 'text-green-700',  line: 'border-green-200' },
  red:    { dot: 'bg-red-600',    bg: 'bg-red-50',    text: 'text-red-700',    line: 'border-red-200' },
};

export default function ValidationHistoryTimeline({ logs }: ValidationHistoryTimelineProps) {
  if (logs.length === 0) {
    return (
      <p className="text-sm text-gray-400 text-center py-8">Aucune entrée dans l&apos;historique</p>
    );
  }

  return (
    <div className="flow-root">
      <ul className="-mb-8">
        {logs.map((log, index) => {
          const config = ACTION_CONFIG[log.action] ?? ACTION_CONFIG.MODIFICATION;
          const colors = COLOR_CLASSES[config.color] ?? COLOR_CLASSES.blue;
          const isLast = index === logs.length - 1;
          const details = log.details as Record<string, unknown> | null;

          return (
            <li key={log.id}>
              <div className="relative pb-8">
                {/* Ligne verticale */}
                {!isLast && (
                  <span className="absolute left-4 top-8 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                )}

                <div className="relative flex items-start space-x-3">
                  {/* Dot */}
                  <div className={`relative flex h-8 w-8 items-center justify-center rounded-full ${colors.dot} text-white ring-4 ring-white`}>
                    {config.icon}
                  </div>

                  {/* Contenu */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900">
                        {config.label}
                      </p>
                      <time className="text-xs text-gray-400">
                        {new Date(log.createdAt).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </time>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      par {log.user.prenom} {log.user.nom}
                    </p>

                    {/* Détails */}
                    {details && (
                      <div className={`mt-2 px-3 py-2 rounded-lg ${colors.bg} border ${colors.line}`}>
                        {details.commentaire && (
                          <p className={`text-xs ${colors.text}`}>
                            <strong>Commentaire :</strong> {String(details.commentaire)}
                          </p>
                        )}
                        {details.ancienStatut && (
                          <p className="text-xs text-gray-600 mt-1">
                            Statut : {String(details.ancienStatut)} → {String(details.nouveauStatut)}
                          </p>
                        )}
                        {details.nbSections && (
                          <p className="text-xs text-gray-600 mt-1">
                            {String(details.nbSections)} sections créées
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
