// ============================================================================
// HOOK — useNewFicheForm
// Gestion de l'état du formulaire multi-step de création de fiche
// ============================================================================

'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import type {
  SectionId,
  SectionFormData,
  FicheFormState,
  FieldErrors,
  FormErrors,
  CreateFichePayload,
  CreateFicheResponse,
} from '@/types/fiche.types';
import { SECTIONS_META } from '@/types/fiche.types';
import { SECTIONS_FIELDS, buildStructuredEntries } from '@/config/sections-fields';
import { validateField, validateSection } from '@/validations/fiche.schema';
import { getSecureHeaders } from '@/lib/csrf-client';

const LOCAL_STORAGE_KEY = 'qc:new-fiche:draft:v1';

// ── État initial ──

function createInitialState(): FicheFormState {
  const sections: Record<string, SectionFormData> = {};
  for (const meta of SECTIONS_META) {
    const fieldsDef = SECTIONS_FIELDS[meta.id];
    const sectionData: SectionFormData = {};
    if (fieldsDef) {
      for (const field of fieldsDef.fields) {
        sectionData[field.name] = field.defaultValue ?? null;
      }
    }
    sections[meta.id] = sectionData;
  }
  return {
    titre: 'FICHE DE CONTROLE QUALITE',
    produit: 'Fiche multi-produits ISO 9001',
    referenceDocument: 'PS-CQ-FR-03',
    versionDocument: '07',
    dateApplication: '',
    dateFiche: new Date().toISOString().slice(0, 10),
    sections: sections as Record<SectionId, SectionFormData>,
  };
}

function sanitizeTextValue(fieldName: string, raw: string): string {
  const trimmed = raw.trimStart();
  if (['numero_lot', 'melange_numero', 'identification_produit'].includes(fieldName)) {
    return trimmed.toUpperCase().replace(/\s+/g, ' ').slice(0, 30);
  }
  if (fieldName === 'observations') {
    return trimmed.slice(0, 500);
  }
  return trimmed;
}

// ── Hook principal ──

export function useNewFicheForm() {
  // État du formulaire
  const [formState, setFormState] = useState<FicheFormState>(createInitialState);

  // Étape courante (0 = infos générales, 1-6 = sections, 7 = confirmation)
  const [currentStep, setCurrentStep] = useState(0);

  // Erreurs par section
  const [errors, setErrors] = useState<FormErrors>({} as FormErrors);

  // État de soumission
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitResult, setSubmitResult] = useState<CreateFicheResponse | null>(null);

  // Hydratation brouillon local
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (!saved) return;
      const parsed = JSON.parse(saved) as { formState?: FicheFormState; currentStep?: number };
      if (parsed.formState) {
        setFormState(parsed.formState);
      }
      if (typeof parsed.currentStep === 'number') {
        setCurrentStep(Math.max(0, Math.min(parsed.currentStep, SECTIONS_META.length + 1)));
      }
    } catch {
      // Ignorer le brouillon invalide
    }
  }, []);

  // Auto-save brouillon (optionnel activé par défaut)
  useEffect(() => {
    const payload = JSON.stringify({ formState, currentStep });
    const timeout = window.setTimeout(() => {
      localStorage.setItem(LOCAL_STORAGE_KEY, payload);
    }, 250);
    return () => window.clearTimeout(timeout);
  }, [formState, currentStep]);

  // Nombre total d'étapes (infos + 6 sections + confirmation)
  const totalSteps = SECTIONS_META.length + 2; // 8 étapes

  // ── Modifier les infos générales ──

  const updateGeneralInfo = useCallback(
    (field: 'titre' | 'produit' | 'dateApplication' | 'dateFiche', value: string) => {
      setFormState((prev) => ({ ...prev, [field]: value }));
      // Nettoyer l'erreur
      setErrors((prev) => {
        const general = { ...prev.general };
        delete general[field];
        return { ...prev, general };
      });
    },
    []
  );

  // ── Modifier un champ d'une section ──

  const updateSectionField = useCallback(
    (sectionId: SectionId, fieldName: string, value: string | number | boolean | null) => {
      const sectionDef = SECTIONS_FIELDS[sectionId];
      const fieldDef = sectionDef?.fields.find((f) => f.name === fieldName);

      let normalizedValue = value;
      if (typeof normalizedValue === 'string') {
        normalizedValue = sanitizeTextValue(fieldName, normalizedValue);
      }

      setFormState((prev) => ({
        ...(function () {
          const currentSection = prev.sections[sectionId] ?? {};
          const nextSection = {
            ...currentSection,
            [fieldName]: normalizedValue,
          } as SectionFormData;

          return {
            ...prev,
            sections: {
              ...prev.sections,
              [sectionId]: nextSection,
            },
          };
        })(),
      }));

      // Validation en temps réel du champ modifié
      const error = validateField(fieldName, normalizedValue, sectionId);
      setErrors((prev) => {
        const sectionErrors = { ...(prev[sectionId] ?? {}) };
        if (error) {
          sectionErrors[fieldName] = error;
        } else {
          delete sectionErrors[fieldName];
        }
        return { ...prev, [sectionId]: sectionErrors };
      });
    },
    []
  );

  // ── Valider les infos générales (étape 0) ──

  const validateGeneralInfo = useCallback((): boolean => {
    setErrors((prev) => ({ ...prev, general: {} }));
    return true;
  }, []);

  // ── Valider une section spécifique ──

  const validateSectionStep = useCallback(
    (sectionId: SectionId): boolean => {
      const data = formState.sections[sectionId] ?? {};
      const sectionErrors = validateSection(sectionId, data);
      setErrors((prev) => ({ ...prev, [sectionId]: sectionErrors }));
      return Object.keys(sectionErrors).length === 0;
    },
    [formState.sections]
  );

  // ── Valider l'étape courante ──

  const validateCurrentStep = useCallback((): boolean => {
    if (currentStep === 0) {
      return validateGeneralInfo();
    }
    if (currentStep >= 1 && currentStep <= 6) {
      const sectionId = SECTIONS_META[currentStep - 1].id;
      return validateSectionStep(sectionId);
    }
    return true; // Étape de confirmation
  }, [currentStep, validateGeneralInfo, validateSectionStep]);

  // ── Navigation ──

  const goToStep = useCallback(
    (step: number) => {
      if (step >= 0 && step < totalSteps) {
        setCurrentStep(step);
        setSubmitError(null);
      }
    },
    [totalSteps]
  );

  const nextStep = useCallback(() => {
    // Valider avant de passer à l'étape suivante
    const isValid = validateCurrentStep();
    if (isValid && currentStep < totalSteps - 1) {
      setCurrentStep((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentStep, totalSteps, validateCurrentStep]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentStep]);

  // ── Statut de chaque section (pour le stepper) ──

  const stepsStatus = useMemo(() => {
    return SECTIONS_META.map((meta) => {
      const data = formState.sections[meta.id] ?? {};
      const fieldsDef = SECTIONS_FIELDS[meta.id];
      if (!fieldsDef) {
        return { completed: false, hasErrors: false, filledRequired: 0, totalRequired: 0 };
      }

      const filledCount = fieldsDef.fields.filter((f) => {
        const val = data[f.name];
        return val !== null && val !== undefined && val !== '';
      }).length;

      const sectionErrors = errors[meta.id] ?? {};
      const hasErrors = Object.keys(sectionErrors).length > 0;

      return {
        completed: filledCount > 0 && !hasErrors,
        hasErrors,
        filledRequired: filledCount,
        totalRequired: fieldsDef.fields.length,
      };
    });
  }, [formState.sections, errors]);

  // ── Construire le payload pour l'API ──

  const buildPayload = useCallback((): CreateFichePayload => {
    return {
      titre: formState.titre,
      produit: formState.produit,
      referenceDocument: formState.referenceDocument,
      versionDocument: formState.versionDocument,
      dateApplication: formState.dateApplication,
      dateFiche: formState.dateFiche,
      sections: SECTIONS_META.map((meta) => ({
        sectionId: meta.id,
        titre: meta.titre,
        ordre: meta.ordre,
        donnees: {
          sectionType: meta.id,
          raw: formState.sections[meta.id] ?? {},
          entries: buildStructuredEntries(meta.id, formState.sections[meta.id] ?? {}),
        },
      })),
    };
  }, [formState]);

  // ── Soumettre la fiche ──

  const submitFiche = useCallback(async () => {
    if (isSubmitting) return;

    // Soumission
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const payload = buildPayload();

      const response = await fetch('/api/fiches', {
        method: 'POST',
        headers: getSecureHeaders(),
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        // Essayer de parser les erreurs structurées
        let errorMessage = 'Erreur lors de la création de la fiche';
        if (result.error) {
          try {
            const parsed = JSON.parse(result.error);
            errorMessage = parsed.message || result.error;

            // Injecter les erreurs par section si présentes
            if (parsed.details?.sections) {
              setErrors((prev) => ({
                ...prev,
                ...parsed.details.sections,
              }));
            }
          } catch {
            errorMessage = result.error;
          }
        }
        setSubmitError(errorMessage);
        return;
      }

      // Succès
      setSubmitResult(result.data);
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    } catch (error) {
      console.error('[SUBMIT ERROR]', error);
      setSubmitError('Erreur réseau : enregistrement non effectué. Vérifiez la connexion puis réessayez.');
    } finally {
      setIsSubmitting(false);
    }
  }, [buildPayload, isSubmitting]);

  // ── Reset complet ──

  const resetForm = useCallback(() => {
    setFormState(createInitialState());
    setCurrentStep(0);
    setErrors({} as FormErrors);
    setIsSubmitting(false);
    setSubmitError(null);
    setSubmitResult(null);
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  }, []);

  return {
    // État
    formState,
    currentStep,
    totalSteps,
    errors,
    isSubmitting,
    submitError,
    submitResult,
    stepsStatus,

    // Actions
    updateGeneralInfo,
    updateSectionField,
    validateCurrentStep,
    goToStep,
    nextStep,
    prevStep,
    submitFiche,
    resetForm,
  };
}
