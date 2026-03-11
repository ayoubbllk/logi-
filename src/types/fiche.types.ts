// ============================================================================
// TYPES — Fiches de Contrôle Qualité
// ============================================================================

export type StatutControle = 'EN_ATTENTE' | 'VALIDE' | 'REFUSE' | 'BROUILLON';

// ============================================================================
// SECTIONS — Définition des 6 sections du formulaire
// ============================================================================

/** Identifiant des sections du formulaire */
export type SectionId =
  | 'bitumes_oxydes'
  | 'bitumes_fluidifies'
  | 'bitumes_modifies'
  | 'produits_finis_traditionnels'
  | 'produits_finis_membranes'
  | 'emulsions_stabilisees';

/** Métadonnées de chaque section */
export interface SectionMeta {
  id: SectionId;
  titre: string;
  ordre: number;
  description: string;
  icon: string; // emoji pour affichage
}

/** Les 6 sections du wizard */
export const SECTIONS_META: SectionMeta[] = [
  {
    id: 'bitumes_oxydes',
    titre: 'Bitumes oxydés',
    ordre: 0,
    description: 'Contrôle des bitumes oxydés (pénétrabilité, point de ramollissement, etc.)',
    icon: '🔥',
  },
  {
    id: 'bitumes_fluidifies',
    titre: 'Bitumes fluidifiés',
    ordre: 1,
    description: 'Contrôle des bitumes fluidifiés (viscosité, distillation, etc.)',
    icon: '💧',
  },
  {
    id: 'bitumes_modifies',
    titre: 'Bitumes modifiés',
    ordre: 2,
    description: 'Contrôle des bitumes modifiés par polymères (élasticité, retour élastique, etc.)',
    icon: '⚗️',
  },
  {
    id: 'produits_finis_traditionnels',
    titre: 'Produits finis traditionnels',
    ordre: 3,
    description: 'Contrôle des produits finis traditionnels (enrobés, asphaltes, etc.)',
    icon: '🏗️',
  },
  {
    id: 'produits_finis_membranes',
    titre: 'Produits finis membranes',
    ordre: 4,
    description: 'Contrôle des membranes d\'étanchéité bitumineuses',
    icon: '🛡️',
  },
  {
    id: 'emulsions_stabilisees',
    titre: 'Émulsions stabilisées',
    ordre: 5,
    description: 'Contrôle des émulsions de bitume stabilisées',
    icon: '🧪',
  },
];

// ============================================================================
// DÉFINITION DES CHAMPS PAR SECTION
// ============================================================================

/** Types de champs supportés */
export type FieldType = 'text' | 'number' | 'select' | 'boolean' | 'date' | 'textarea';

/** Définition d'un champ du formulaire */
export interface FieldDef {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  unite?: string;         // Unité de mesure (°C, mm, %, etc.)
  min?: number;           // Valeur min (pour number)
  max?: number;           // Valeur max (pour number)
  step?: number;          // Incrément (pour number)
  maxLength?: number;     // Taille max (text/textarea)
  options?: string[];     // Options (pour select)
  placeholder?: string;
  defaultValue?: string | number | boolean;
}

/** Définition d'une section avec ses champs */
export interface SectionFieldsDef {
  sectionId: SectionId;
  fields: FieldDef[];
}

// ============================================================================
// ÉTAT DU FORMULAIRE
// ============================================================================

/** Données saisies pour une section (clé = nom du champ, valeur = valeur saisie) */
export type SectionFormData = Record<string, string | number | boolean | null>;

/** État global du formulaire multi-step */
export interface FicheFormState {
  titre: string;
  produit: string;
  referenceDocument: string;
  versionDocument: string;
  dateApplication: string;
  dateFiche: string;
  sections: Record<SectionId, SectionFormData>;
}

/** Erreurs de validation par champ */
export type FieldErrors = Record<string, string>;

/** Erreurs de validation par section */
export type FormErrors = Record<SectionId | 'general', FieldErrors>;

// ============================================================================
// PAYLOADS API
// ============================================================================

/** Payload pour créer une fiche */
export interface CreateFichePayload {
  titre: string;
  produit: string;
  referenceDocument: string;
  versionDocument: string;
  dateApplication: string;
  dateFiche: string;
  sections: {
    sectionId: SectionId;
    titre: string;
    ordre: number;
    donnees: {
      sectionType: SectionId;
      raw: SectionFormData;
      entries: {
        fieldName: string;
        value: string | number | boolean | null;
        unit: string;
        conformite: boolean | null;
        observation: string;
      }[];
    };
  }[];
}

/** Réponse après création */
export interface CreateFicheResponse {
  id: string;
  numero: string;
  titre: string;
  produit: string;
  referenceDocument: string;
  versionDocument: string;
  dateApplication: string | null;
  dateFiche: string | null;
  statut: StatutControle;
  createdAt: string;
}

/** Fiche complète pour affichage */
export interface FicheComplete {
  id: string;
  numero: string;
  titre: string;
  produit: string;
  referenceDocument: string;
  versionDocument: string;
  dateApplication: string | null;
  dateFiche: string | null;
  statut: StatutControle;
  commentaire: string | null;
  createdAt: string;
  updatedAt: string;
  dateSoumission: string | null;
  dateDecision: string | null;
  createdBy: {
    id: string;
    nom: string;
    prenom: string;
    email: string;
  };
  validatedBy: {
    id: string;
    nom: string;
    prenom: string;
  } | null;
  sections: {
    id: string;
    titre: string;
    ordre: number;
    donnees: SectionFormData;
  }[];
}

// ============================================================================
// PRODUITS — Liste des types de produits
// ============================================================================

export const PRODUITS = [
  'Fiche multi-produits ISO 9001',
  'Bitume routier 35/50',
  'Bitume routier 50/70',
  'Bitume routier 70/100',
  'Bitume oxydé 85/25',
  'Bitume oxydé 90/40',
  'Bitume oxydé 95/25',
  'Bitume fluidifié 0/1',
  'Bitume fluidifié 10/15',
  'Bitume modifié SBS',
  'Bitume modifié APP',
  'Émulsion cationique C60B3',
  'Émulsion cationique C65B3',
  'Émulsion cationique C69B3',
  'Membrane SBS 4mm',
  'Membrane APP 3mm',
  'Enrobé à chaud',
  'Asphalte coulé',
] as const;

export type Produit = (typeof PRODUITS)[number];
