// ============================================================================
// COMPOSANT — WizardStepper (indicateur de progression du wizard)
// Navigation entre les étapes du formulaire multi-step
// ============================================================================

'use client';

import React from 'react';
import type { SectionMeta } from '@/types/fiche.types';

interface StepStatus {
  completed: boolean;
  hasErrors: boolean;
  filledRequired: number;
  totalRequired: number;
}

interface WizardStepperProps {
  sections: SectionMeta[];
  currentStep: number;
  stepsStatus: StepStatus[];
  onStepClick: (step: number) => void;
}

export default function WizardStepper({
  sections,
  currentStep,
  stepsStatus,
  onStepClick,
}: WizardStepperProps) {
  // ── Étape 0 = infos générales (avant les sections) ──
  const allSteps = [
    {
      id: 'general' as const,
      titre: 'Informations générales',
      icon: '📋',
    },
    ...sections.map((s) => ({
      id: s.id,
      titre: s.titre,
      icon: s.icon,
    })),
  ];

  return (
    <nav className="w-full" aria-label="Progression du formulaire">
      {/* ── Version desktop (horizontal) ── */}
      <div className="hidden lg:block">
        <ol className="flex items-center w-full">
          {allSteps.map((step, index) => {
            const isActive = index === currentStep;
            const isPast = index < currentStep;
            const status = index === 0
              ? null // Pas de status pour l'étape "infos générales"
              : stepsStatus[index - 1];
            const hasErrors = status?.hasErrors ?? false;
            const isCompleted = status?.completed ?? false;

            return (
              <li
                key={step.id}
                className={`flex items-center ${index < allSteps.length - 1 ? 'flex-1' : ''}`}
              >
                <button
                  onClick={() => onStepClick(index)}
                  className={`
                    flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200
                    text-sm font-medium whitespace-nowrap
                    ${isActive
                      ? 'bg-blue-50 text-blue-700 ring-2 ring-blue-200'
                      : isPast
                        ? hasErrors
                          ? 'text-red-600 hover:bg-red-50'
                          : 'text-green-600 hover:bg-green-50'
                        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                    }
                  `}
                  title={step.titre}
                >
                  {/* Indicateur numérique / check / erreur */}
                  <span
                    className={`
                      flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold flex-shrink-0
                      ${isActive
                        ? 'bg-blue-600 text-white'
                        : isPast
                          ? hasErrors
                            ? 'bg-red-100 text-red-600'
                            : 'bg-green-100 text-green-600'
                          : 'bg-gray-200 text-gray-500'
                      }
                    `}
                  >
                    {isPast && !hasErrors ? (
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : isPast && hasErrors ? (
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      index + 1
                    )}
                  </span>

                  {/* Label (caché sur écrans moyens pour gagner de la place) */}
                  <span className="hidden xl:inline truncate max-w-[120px]">
                    {step.titre}
                  </span>
                </button>

                {/* Connecteur */}
                {index < allSteps.length - 1 && (
                  <div
                    className={`
                      flex-1 h-0.5 mx-2 transition-colors duration-300
                      ${index < currentStep ? 'bg-green-300' : 'bg-gray-200'}
                    `}
                  />
                )}
              </li>
            );
          })}
        </ol>
      </div>

      {/* ── Version mobile (compact) ── */}
      <div className="lg:hidden">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-gray-600">
            Étape {currentStep + 1} / {allSteps.length}
          </span>
          <span className="text-sm font-semibold text-gray-900">
            {allSteps[currentStep]?.icon} {allSteps[currentStep]?.titre}
          </span>
        </div>

        {/* Barre de progression globale */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-500"
            style={{ width: `${((currentStep + 1) / allSteps.length) * 100}%` }}
          />
        </div>

        {/* Mini dots */}
        <div className="flex justify-center gap-1.5 mt-3">
          {allSteps.map((step, index) => {
            const isActive = index === currentStep;
            const isPast = index < currentStep;
            const status = index === 0 ? null : stepsStatus[index - 1];
            const hasErrors = status?.hasErrors ?? false;

            return (
              <button
                key={step.id}
                onClick={() => onStepClick(index)}
                className={`
                  w-2.5 h-2.5 rounded-full transition-all duration-200
                  ${isActive
                    ? 'bg-blue-600 scale-125'
                    : isPast
                      ? hasErrors
                        ? 'bg-red-400'
                        : 'bg-green-400'
                      : 'bg-gray-300'
                  }
                `}
                title={step.titre}
              />
            );
          })}
        </div>
      </div>
    </nav>
  );
}
