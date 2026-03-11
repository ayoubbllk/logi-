// ============================================================================
// COMPOSANT — NewFicheContent (orchestrateur principal du wizard)
// Client component gérant le formulaire multi-step complet
// ============================================================================

'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useNewFicheForm } from '@/hooks/useNewFicheForm';
import { SECTIONS_META } from '@/types/fiche.types';
import { SECTIONS_FIELDS } from '@/config/sections-fields';
import WizardStepper from './WizardStepper';
import GeneralInfoForm from './GeneralInfoForm';
import SectionForm from './SectionForm';
import ConfirmationStep from './ConfirmationStep';
import SuccessModal from './SuccessModal';

export default function NewFicheContent() {
  const router = useRouter();

  const {
    formState,
    currentStep,
    totalSteps,
    errors,
    isSubmitting,
    submitError,
    submitResult,
    stepsStatus,
    updateGeneralInfo,
    updateSectionField,
    goToStep,
    nextStep,
    prevStep,
    submitFiche,
    resetForm,
  } = useNewFicheForm();

  // ── Déterminer le contenu à afficher selon l'étape ──

  const renderStepContent = () => {
    // Étape 0 : Informations générales
    if (currentStep === 0) {
      return (
        <GeneralInfoForm
          titre={formState.titre}
          referenceDocument={formState.referenceDocument}
          versionDocument={formState.versionDocument}
          dateApplication={formState.dateApplication}
          dateFiche={formState.dateFiche}
          errors={errors.general ?? {}}
          onChange={updateGeneralInfo}
        />
      );
    }

    // Étapes 1 à 6 : Sections de contrôle
    if (currentStep >= 1 && currentStep <= 6) {
      const sectionIndex = currentStep - 1;
      const meta = SECTIONS_META[sectionIndex];
      const fieldsDef = SECTIONS_FIELDS[meta.id];

      if (!fieldsDef) {
        return <p className="text-red-500">Section inconnue</p>;
      }

      return (
        <SectionForm
          meta={meta}
          fieldsDef={fieldsDef}
          data={formState.sections[meta.id] ?? {}}
          errors={errors[meta.id] ?? {}}
          onChange={(fieldName, value) => updateSectionField(meta.id, fieldName, value)}
        />
      );
    }

    // Étape 7 : Récapitulatif et confirmation
    if (currentStep === totalSteps - 1) {
      return (
        <ConfirmationStep
          formState={formState}
          sectionsMeta={SECTIONS_META}
          isSubmitting={isSubmitting}
          onSubmit={submitFiche}
          onGoToStep={goToStep}
        />
      );
    }

    return null;
  };

  return (
    <div className="max-w-5xl mx-auto bg-slate-200 p-4 md:p-6 rounded-md">
      {/* En-tête de la page */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-2">
          <button
            onClick={() => router.push('/fiches')}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Retour à la liste"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Fiche de contrôle qualité</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Saisie structurée conforme au document ISO 9001 (PS-CQ-FR-03)
            </p>
          </div>
        </div>
      </div>

      {/* Stepper de navigation */}
      <div className="bg-white border border-slate-300 p-4 mb-6">
        <WizardStepper
          sections={SECTIONS_META}
          currentStep={currentStep}
          stepsStatus={stepsStatus}
          onStepClick={goToStep}
        />
      </div>

      {/* Contenu de l'étape */}
      <div className="bg-white border border-slate-400 p-4 md:p-6 min-h-[400px]">
        {renderStepContent()}
      </div>

      {/* Erreur de soumission */}
      {submitError && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <div>
            <p className="text-sm font-medium text-red-800">Erreur de soumission</p>
            <p className="text-xs text-red-600 mt-1">{submitError}</p>
          </div>
        </div>
      )}

      {/* Barre de navigation bas */}
      {currentStep < totalSteps - 1 && (
        <div className="mt-6 flex items-center justify-between">
          <button
            onClick={prevStep}
            disabled={currentStep === 0}
            className={`
              inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium
              transition-all duration-200
              ${currentStep === 0
                ? 'text-gray-300 cursor-not-allowed'
                : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 active:scale-[0.98]'
              }
            `}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Précédent
          </button>

          <div className="flex items-center gap-3">
            {/* Info étape */}
            <span className="text-sm text-gray-400">
              {currentStep + 1} / {totalSteps}
            </span>

            <button
              onClick={nextStep}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-all duration-200 active:scale-[0.98] shadow-lg shadow-blue-500/20"
            >
              Suivant
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Modale de succès */}
      {submitResult && (
        <SuccessModal
          numero={submitResult.numero}
          titre={submitResult.titre}
          onClose={() => {}}
          onNewFiche={resetForm}
          onViewList={() => router.push('/fiches')}
        />
      )}
    </div>
  );
}
