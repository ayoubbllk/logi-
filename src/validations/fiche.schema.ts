// ============================================================================
// VALIDATION ZOD — Fiches de contrôle qualité
// Validation côté serveur (API) et côté client (formulaire)
// ============================================================================

import { z } from 'zod';
import { SECTIONS_META, PRODUITS } from '@/types/fiche.types';
import { SECTIONS_FIELDS } from '@/config/sections-fields';

function extractRawSectionData(donnees: Record<string, unknown>): Record<string, unknown> {
  const raw = donnees.raw;
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    return raw as Record<string, unknown>;
  }
  return donnees;
}

// ============================================================================
// Validation d'un champ individuel (dynamique selon la définition)
// ============================================================================

/**
 * Valide une valeur saisie par rapport à la définition du champ.
 * Retourne un message d'erreur ou null si valide.
 */
export function validateField(
  fieldName: string,
  value: unknown,
  sectionId: string
): string | null {
  const section = SECTIONS_FIELDS[sectionId];
  if (!section) return null;

  const fieldDef = section.fields.find((f) => f.name === fieldName);
  if (!fieldDef) return null;

  // Champ vide
  const isEmpty =
    value === null ||
    value === undefined ||
    value === '' ||
    (typeof value === 'string' && value.trim() === '');

  // Si vide et non requis, c'est OK
  if (isEmpty) return null;

  // Validation par type
  switch (fieldDef.type) {
    case 'number': {
      const num = Number(value);
      if (isNaN(num)) return `${fieldDef.label} doit être un nombre valide`;
      if (!Number.isFinite(num)) return `${fieldDef.label} doit être une valeur finie`;

      // Contrôle décimales basé sur step (ex: 0.01 => max 2 décimales)
      if (typeof fieldDef.step === 'number' && String(fieldDef.step).includes('.')) {
        const maxDecimals = String(fieldDef.step).split('.')[1].length;
        const str = String(value);
        const currentDecimals = str.includes('.') ? str.split('.')[1].length : 0;
        if (currentDecimals > maxDecimals) {
          return `${fieldDef.label} doit avoir au maximum ${maxDecimals} décimale(s)`;
        }
      }
      break;
    }

    case 'select': {
      if (fieldDef.options && !fieldDef.options.includes(value as string)) {
        return `${fieldDef.label} : valeur non autorisée`;
      }
      break;
    }

    case 'date': {
      const d = new Date(value as string);
      if (isNaN(d.getTime())) return `${fieldDef.label} : date invalide`;
      break;
    }

    case 'text':
    case 'textarea': {
      if (typeof value !== 'string') return `${fieldDef.label} doit être du texte`;
      const text = value.trim();
      const maxLength = fieldDef.maxLength ?? (fieldDef.type === 'textarea' ? 500 : 500);
      if (text.length > maxLength) {
        return `${fieldDef.label} ne doit pas dépasser ${maxLength} caractères`;
      }

      // Normalisation industrielle: numéro de lot/mélange/identification
      if (['numero_lot', 'melange_numero', 'identification_produit'].includes(fieldName)) {
        const normalized = text.toUpperCase();
        if (!/^[A-Z0-9\-\/ ]{3,30}$/.test(normalized)) {
          return `${fieldDef.label} doit contenir 3 à 30 caractères alphanumériques (A-Z, 0-9, - / espace)`;
        }
      }
      break;
    }

    case 'boolean': {
      if (typeof value !== 'boolean') {
        return `${fieldDef.label} doit être Oui ou Non`;
      }
      break;
    }
  }

  return null;
}

// ============================================================================
// Validation d'une section complète
// ============================================================================

/**
 * Valide toutes les données d'une section.
 * Retourne un objet { champ: message } des erreurs trouvées.
 */
export function validateSection(
  sectionId: string,
  donnees: Record<string, unknown>
): Record<string, string> {
  const errors: Record<string, string> = {};
  const section = SECTIONS_FIELDS[sectionId];
  if (!section) return errors;
  const raw = extractRawSectionData(donnees);

  const isValueFilled = (value: unknown): boolean => {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string') return value.trim() !== '';
    return true;
  };

  // Détecter une section partiellement remplie
  const hasAnyValue = section.fields.some((field) => isValueFilled(raw[field.name]));

  for (const field of section.fields) {
    const error = validateField(field.name, raw[field.name], sectionId);
    if (error) {
      errors[field.name] = error;
    }
  }

  // Aucune obligation de complétude : validation uniquement sur les valeurs renseignées

  return errors;
}

// ============================================================================
// Schéma Zod — Payload de création d'une fiche
// ============================================================================

/** Schéma d'une section dans le payload */
const sectionPayloadSchema = z.object({
  sectionId: z.string().min(1, 'ID de section requis'),
  titre: z.string().min(1, 'Titre de section requis'),
  ordre: z.number().int().min(0),
  donnees: z.record(z.unknown()),
});

/** Schéma complet de création de fiche */
export const createFicheSchema = z.object({
  titre: z
    .string()
    .min(0)
    .max(200, 'Le titre ne doit pas dépasser 200 caractères'),
  produit: z.string().min(0),
  referenceDocument: z.string().min(0).max(30),
  versionDocument: z.string().min(0).max(10),
  dateApplication: z.string().optional().default(''),
  dateFiche: z.string().optional().default(''),
  sections: z
    .array(sectionPayloadSchema)
    .min(1, 'Au moins une section doit être remplie')
    .max(6, 'Maximum 6 sections'),
});

export type CreateFicheInput = z.infer<typeof createFicheSchema>;

// ============================================================================
// Validation complète du payload (Zod + métier)
// ============================================================================

export interface ValidationResult {
  success: boolean;
  errors: {
    general?: Record<string, string>;
    sections?: Record<string, Record<string, string>>;
  };
}

/**
 * Validation complète en 2 étapes :
 * 1. Validation structurelle via Zod (types, formats)
 * 2. Validation métier champ par champ (min/max, options, required)
 */
export function validateCreateFiche(payload: unknown): ValidationResult {
  // Étape 1 : validation structurelle Zod
  const zodResult = createFicheSchema.safeParse(payload);
  if (!zodResult.success) {
    const generalErrors: Record<string, string> = {};
    zodResult.error.errors.forEach((err) => {
      const path = err.path.join('.');
      generalErrors[path] = err.message;
    });
    return { success: false, errors: { general: generalErrors } };
  }

  // Étape 2 : validation métier des données de chaque section
  const sectionErrors: Record<string, Record<string, string>> = {};
  let hasErrors = false;

  for (const section of zodResult.data.sections) {
    const errors = validateSection(section.sectionId, section.donnees as Record<string, unknown>);
    if (Object.keys(errors).length > 0) {
      sectionErrors[section.sectionId] = errors;
      hasErrors = true;
    }
  }

  if (hasErrors) {
    return { success: false, errors: { sections: sectionErrors } };
  }

  return { success: true, errors: {} };
}

// ============================================================================
// Formater les erreurs Zod pour affichage
// ============================================================================

export function formatZodFicheErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  error.errors.forEach((err) => {
    const path = err.path.join('.');
    errors[path] = err.message;
  });
  return errors;
}
