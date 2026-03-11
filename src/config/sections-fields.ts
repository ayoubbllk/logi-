// ============================================================================
// DÉFINITION DES CHAMPS — Alignée sur la fiche papier ISO (PS-CQ-FR-03)
// ============================================================================

import type { SectionFieldsDef, SectionFormData, SectionId } from '@/types/fiche.types';

const bitumesOxydes: SectionFieldsDef = {
  sectionId: 'bitumes_oxydes',
  fields: [
    { name: 'ox_01_tba', label: '01 - TBA', type: 'number', required: true, unite: '°C', min: 0.01, max: 300, step: 0.1 },
    { name: 'ox_01_ip', label: '01 - IP', type: 'number', required: true, unite: 'dmm', min: 0.01, max: 500, step: 0.1 },
    { name: 'ox_01_conforme', label: '01 - Conforme', type: 'boolean', required: true },
    { name: 'ox_01_obs', label: '01 - Observations', type: 'textarea', maxLength: 500 },

    { name: 'ox_02_tba', label: '02 - TBA', type: 'number', required: true, unite: '°C', min: 0.01, max: 300, step: 0.1 },
    { name: 'ox_02_ip', label: '02 - IP', type: 'number', required: true, unite: 'dmm', min: 0.01, max: 500, step: 0.1 },
    { name: 'ox_02_conforme', label: '02 - Conforme', type: 'boolean', required: true },
    { name: 'ox_02_obs', label: '02 - Observations', type: 'textarea', maxLength: 500 },
  ],
};

const bitumesFluidifies: SectionFieldsDef = {
  sectionId: 'bitumes_fluidifies',
  fields: [
    { name: 'fl_01_tba', label: '01 - TBA', type: 'number', required: true, unite: '°C', min: 0.01, max: 300, step: 0.1 },
    { name: 'fl_01_ip', label: '01 - IP', type: 'number', required: true, unite: 'dmm', min: 0.01, max: 500, step: 0.1 },
    { name: 'fl_01_conforme', label: '01 - Conforme', type: 'boolean', required: true },
    { name: 'fl_01_obs', label: '01 - Observations', type: 'textarea', maxLength: 500 },

    { name: 'fl_02_tba', label: '02 - TBA', type: 'number', required: true, unite: '°C', min: 0.01, max: 300, step: 0.1 },
    { name: 'fl_02_ip', label: '02 - IP', type: 'number', required: true, unite: 'dmm', min: 0.01, max: 500, step: 0.1 },
    { name: 'fl_02_conforme', label: '02 - Conforme', type: 'boolean', required: true },
    { name: 'fl_02_obs', label: '02 - Observations', type: 'textarea', maxLength: 500 },
  ],
};

const bitumesModifies: SectionFieldsDef = {
  sectionId: 'bitumes_modifies',
  fields: [
    { name: 'formule_numero', label: 'N° Formule', type: 'text', required: true, maxLength: 30, placeholder: 'Ex: FM-2026-001' },

    { name: 'mod_tba_resultat', label: 'TBA (°C) - Résultat', type: 'number', required: true, unite: '°C', min: 0.01, max: 300, step: 0.1 },
    { name: 'mod_tba_conforme', label: 'TBA (°C) - Conforme', type: 'boolean', required: true },
    { name: 'mod_tba_obs', label: 'TBA (°C) - Observations', type: 'textarea', maxLength: 500 },

    { name: 'mod_ip_resultat', label: 'IP (dmm) - Résultat', type: 'number', required: true, unite: 'dmm', min: 0.01, max: 500, step: 0.1 },
    { name: 'mod_ip_conforme', label: 'IP (dmm) - Conforme', type: 'boolean', required: true },
    { name: 'mod_ip_obs', label: 'IP (dmm) - Observations', type: 'textarea', maxLength: 500 },

    { name: 'mod_souplesse_amb_resultat', label: 'Souplesse T° ambiante - Résultat', type: 'text', required: true, maxLength: 100 },
    { name: 'mod_souplesse_amb_conforme', label: 'Souplesse T° ambiante - Conforme', type: 'boolean', required: true },
    { name: 'mod_souplesse_amb_obs', label: 'Souplesse T° ambiante - Observations', type: 'textarea', maxLength: 500 },

    { name: 'mod_souplesse_basse_resultat', label: 'Souplesse basse T° - Résultat', type: 'text', required: true, maxLength: 100 },
    { name: 'mod_souplesse_basse_conforme', label: 'Souplesse basse T° - Conforme', type: 'boolean', required: true },
    { name: 'mod_souplesse_basse_obs', label: 'Souplesse basse T° - Observations', type: 'textarea', maxLength: 500 },
  ],
};

const produitsFinisTraditionnels: SectionFieldsDef = {
  sectionId: 'produits_finis_traditionnels',
  fields: [
    { name: 'trad_identification_produit', label: 'Identification produit', type: 'text', required: true, maxLength: 30, placeholder: 'Ex: PFT-2026-001' },

    { name: 'trad_poids_resultat', label: 'Poids (Kg) - Résultat', type: 'number', required: true, unite: 'kg', min: 0.01, max: 1000, step: 0.01 },
    { name: 'trad_poids_conforme', label: 'Poids (Kg) - Conforme', type: 'boolean', required: true },
    { name: 'trad_poids_obs', label: 'Poids (Kg) - Observations', type: 'textarea', maxLength: 500 },

    { name: 'trad_adherence_resultat', label: 'Adhérence Feuille Alu - Résultat', type: 'text', required: true, maxLength: 100 },
    { name: 'trad_adherence_conforme', label: 'Adhérence Feuille Alu - Conforme', type: 'boolean', required: true },
    { name: 'trad_adherence_obs', label: 'Adhérence Feuille Alu - Observations', type: 'textarea', maxLength: 500 },
  ],
};

const produitsFinisMembranes: SectionFieldsDef = {
  sectionId: 'produits_finis_membranes',
  fields: [
    { name: 'mem_identification_produit', label: 'Identification produit', type: 'text', required: true, maxLength: 30, placeholder: 'Ex: PFM-2026-001' },

    { name: 'mem_epaisseur_resultat', label: 'Épaisseur (mm) - Résultat', type: 'number', required: true, unite: 'mm', min: 0.01, max: 100, step: 0.01 },
    { name: 'mem_epaisseur_conforme', label: 'Épaisseur (mm) - Conforme', type: 'boolean', required: true },
    { name: 'mem_epaisseur_obs', label: 'Épaisseur (mm) - Observations', type: 'textarea', maxLength: 500 },

    { name: 'mem_poids_resultat', label: 'Poids (Kg) - Résultat', type: 'number', required: true, unite: 'kg', min: 0.01, max: 1000, step: 0.01 },
    { name: 'mem_poids_conforme', label: 'Poids (Kg) - Conforme', type: 'boolean', required: true },
    { name: 'mem_poids_obs', label: 'Poids (Kg) - Observations', type: 'textarea', maxLength: 500 },

    { name: 'mem_absorption_resultat', label: 'Absorption NT - Résultat', type: 'text', required: true, maxLength: 100 },
    { name: 'mem_absorption_conforme', label: 'Absorption NT - Conforme', type: 'boolean', required: true },
    { name: 'mem_absorption_obs', label: 'Absorption NT - Observations', type: 'textarea', maxLength: 500 },

    { name: 'mem_adherence_grains_resultat', label: 'Adhérence des grains - Résultat', type: 'text', required: true, maxLength: 100 },
    { name: 'mem_adherence_grains_conforme', label: 'Adhérence des grains - Conforme', type: 'boolean', required: true },
    { name: 'mem_adherence_grains_obs', label: 'Adhérence des grains - Observations', type: 'textarea', maxLength: 500 },
  ],
};

const emulsionsStabilisees: SectionFieldsDef = {
  sectionId: 'emulsions_stabilisees',
  fields: [
    { name: 'emu_01_aspect', label: '01 - Aspect / Couleur', type: 'text', required: true, maxLength: 100 },
    { name: 'emu_01_conforme', label: '01 - Conforme', type: 'boolean', required: true },
    { name: 'emu_01_obs', label: '01 - Observations', type: 'textarea', maxLength: 500 },

    { name: 'emu_02_aspect', label: '02 - Aspect / Couleur', type: 'text', required: true, maxLength: 100 },
    { name: 'emu_02_conforme', label: '02 - Conforme', type: 'boolean', required: true },
    { name: 'emu_02_obs', label: '02 - Observations', type: 'textarea', maxLength: 500 },
  ],
};

export const SECTIONS_FIELDS: Record<string, SectionFieldsDef> = {
  bitumes_oxydes: bitumesOxydes,
  bitumes_fluidifies: bitumesFluidifies,
  bitumes_modifies: bitumesModifies,
  produits_finis_traditionnels: produitsFinisTraditionnels,
  produits_finis_membranes: produitsFinisMembranes,
  emulsions_stabilisees: emulsionsStabilisees,
};

export const ALL_SECTIONS = [
  bitumesOxydes,
  bitumesFluidifies,
  bitumesModifies,
  produitsFinisTraditionnels,
  produitsFinisMembranes,
  emulsionsStabilisees,
];

export interface SectionEntry {
  fieldName: string;
  value: string | number | boolean | null;
  unit: string;
  conformite: boolean | null;
  observation: string;
}

export function buildStructuredEntries(sectionId: SectionId, data: SectionFormData): SectionEntry[] {
  const getObs = (key: string) => String(data[key] ?? '').trim();

  switch (sectionId) {
    case 'bitumes_oxydes':
      return [
        {
          fieldName: 'Échantillon 01',
          value: data.ox_01_tba ?? null,
          unit: '°C',
          conformite: typeof data.ox_01_conforme === 'boolean' ? data.ox_01_conforme : null,
          observation: getObs('ox_01_obs'),
        },
        {
          fieldName: 'Échantillon 01 - IP',
          value: data.ox_01_ip ?? null,
          unit: 'dmm',
          conformite: typeof data.ox_01_conforme === 'boolean' ? data.ox_01_conforme : null,
          observation: getObs('ox_01_obs'),
        },
        {
          fieldName: 'Échantillon 02',
          value: data.ox_02_tba ?? null,
          unit: '°C',
          conformite: typeof data.ox_02_conforme === 'boolean' ? data.ox_02_conforme : null,
          observation: getObs('ox_02_obs'),
        },
        {
          fieldName: 'Échantillon 02 - IP',
          value: data.ox_02_ip ?? null,
          unit: 'dmm',
          conformite: typeof data.ox_02_conforme === 'boolean' ? data.ox_02_conforme : null,
          observation: getObs('ox_02_obs'),
        },
      ];

    case 'bitumes_fluidifies':
      return [
        {
          fieldName: 'Mélange 01',
          value: data.fl_01_tba ?? null,
          unit: '°C',
          conformite: typeof data.fl_01_conforme === 'boolean' ? data.fl_01_conforme : null,
          observation: getObs('fl_01_obs'),
        },
        {
          fieldName: 'Mélange 01 - IP',
          value: data.fl_01_ip ?? null,
          unit: 'dmm',
          conformite: typeof data.fl_01_conforme === 'boolean' ? data.fl_01_conforme : null,
          observation: getObs('fl_01_obs'),
        },
        {
          fieldName: 'Mélange 02',
          value: data.fl_02_tba ?? null,
          unit: '°C',
          conformite: typeof data.fl_02_conforme === 'boolean' ? data.fl_02_conforme : null,
          observation: getObs('fl_02_obs'),
        },
        {
          fieldName: 'Mélange 02 - IP',
          value: data.fl_02_ip ?? null,
          unit: 'dmm',
          conformite: typeof data.fl_02_conforme === 'boolean' ? data.fl_02_conforme : null,
          observation: getObs('fl_02_obs'),
        },
      ];

    case 'bitumes_modifies':
      return [
        { fieldName: 'TBA (°C)', value: data.mod_tba_resultat ?? null, unit: '°C', conformite: typeof data.mod_tba_conforme === 'boolean' ? data.mod_tba_conforme : null, observation: getObs('mod_tba_obs') },
        { fieldName: 'IP (dmm)', value: data.mod_ip_resultat ?? null, unit: 'dmm', conformite: typeof data.mod_ip_conforme === 'boolean' ? data.mod_ip_conforme : null, observation: getObs('mod_ip_obs') },
        { fieldName: 'Souplesse T° ambiante', value: data.mod_souplesse_amb_resultat ?? null, unit: '', conformite: typeof data.mod_souplesse_amb_conforme === 'boolean' ? data.mod_souplesse_amb_conforme : null, observation: getObs('mod_souplesse_amb_obs') },
        { fieldName: 'Souplesse basse T°', value: data.mod_souplesse_basse_resultat ?? null, unit: '', conformite: typeof data.mod_souplesse_basse_conforme === 'boolean' ? data.mod_souplesse_basse_conforme : null, observation: getObs('mod_souplesse_basse_obs') },
      ];

    case 'produits_finis_traditionnels':
      return [
        { fieldName: 'Poids (Kg)', value: data.trad_poids_resultat ?? null, unit: 'kg', conformite: typeof data.trad_poids_conforme === 'boolean' ? data.trad_poids_conforme : null, observation: getObs('trad_poids_obs') },
        { fieldName: 'Adhérence Feuille Alu', value: data.trad_adherence_resultat ?? null, unit: '', conformite: typeof data.trad_adherence_conforme === 'boolean' ? data.trad_adherence_conforme : null, observation: getObs('trad_adherence_obs') },
      ];

    case 'produits_finis_membranes':
      return [
        { fieldName: 'Épaisseur (mm)', value: data.mem_epaisseur_resultat ?? null, unit: 'mm', conformite: typeof data.mem_epaisseur_conforme === 'boolean' ? data.mem_epaisseur_conforme : null, observation: getObs('mem_epaisseur_obs') },
        { fieldName: 'Poids (Kg)', value: data.mem_poids_resultat ?? null, unit: 'kg', conformite: typeof data.mem_poids_conforme === 'boolean' ? data.mem_poids_conforme : null, observation: getObs('mem_poids_obs') },
        { fieldName: 'Absorption NT', value: data.mem_absorption_resultat ?? null, unit: '', conformite: typeof data.mem_absorption_conforme === 'boolean' ? data.mem_absorption_conforme : null, observation: getObs('mem_absorption_obs') },
        { fieldName: 'Adhérence des grains', value: data.mem_adherence_grains_resultat ?? null, unit: '', conformite: typeof data.mem_adherence_grains_conforme === 'boolean' ? data.mem_adherence_grains_conforme : null, observation: getObs('mem_adherence_grains_obs') },
      ];

    case 'emulsions_stabilisees':
      return [
        { fieldName: 'Mélange 01', value: data.emu_01_aspect ?? null, unit: '', conformite: typeof data.emu_01_conforme === 'boolean' ? data.emu_01_conforme : null, observation: getObs('emu_01_obs') },
        { fieldName: 'Mélange 02', value: data.emu_02_aspect ?? null, unit: '', conformite: typeof data.emu_02_conforme === 'boolean' ? data.emu_02_conforme : null, observation: getObs('emu_02_obs') },
      ];

    default:
      return [];
  }
}
