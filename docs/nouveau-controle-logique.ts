// ============================================================================
// DOCUMENTATION — Structure JSON et Logique du module "Nouveau contrôle"
// ============================================================================
//
// ╔══════════════════════════════════════════════════════════════════════╗
// ║              LOGIQUE DU MODULE "NOUVEAU CONTRÔLE"                  ║
// ╚══════════════════════════════════════════════════════════════════════╝
//
// ── ARCHITECTURE DU WIZARD ──
//
// Le formulaire est un wizard multi-step de 8 étapes :
//
//   Étape 0 : Informations générales (titre + produit)
//   Étape 1 : Bitumes oxydés         → SectionData { sectionId, donnees: JSON }
//   Étape 2 : Bitumes fluidifiés     → SectionData { sectionId, donnees: JSON }
//   Étape 3 : Bitumes modifiés       → SectionData { sectionId, donnees: JSON }
//   Étape 4 : Produits finis trad.   → SectionData { sectionId, donnees: JSON }
//   Étape 5 : Produits finis membr.  → SectionData { sectionId, donnees: JSON }
//   Étape 6 : Émulsions stabilisées  → SectionData { sectionId, donnees: JSON }
//   Étape 7 : Récapitulatif + Envoi
//
//
// ── FLUX DE DONNÉES ──
//
//   ┌─────────────────────────────────┐
//   │   useNewFicheForm (hook)        │
//   │   ─ formState (état global)     │
//   │   ─ errors (par section/champ)  │
//   │   ─ currentStep (0-7)           │
//   │   ─ stepsStatus (progression)   │
//   └──────────┬──────────────────────┘
//              │ fournit
//              ▼
//   ┌─────────────────────────────────┐
//   │   NewFicheContent (orchestr.)   │
//   │   ─ route le step → composant   │
//   │   ─ gère navigation prev/next   │
//   └──────┬─────────┬────────────────┘
//          │         │
//    ┌─────▼───┐  ┌──▼──────────────┐
//    │ General │  │ SectionForm ×6  │
//    │ InfoForm│  │ FieldRenderer   │
//    └─────────┘  └──┬──────────────┘
//                    │                   
//    ┌───────────────▼──────────────────┐
//    │ ConfirmationStep → submitFiche() │
//    │   POST /api/fiches               │
//    └──────────────┬───────────────────┘
//                   │
//    ┌──────────────▼───────────────────┐
//    │ API : validateCreateFiche()      │
//    │   1. Zod (structure)             │
//    │   2. Métier (min/max/required)   │
//    │ → createFiche() (service)        │
//    │   1. $transaction                │
//    │   2. Générer FC-YYYY-NNNNN       │
//    │   3. Create QualityControl       │
//    │   4. Create SectionData ×6       │
//    │   5. Create ValidationLog        │
//    └──────────────────────────────────┘
//
//
// ── VALIDATION EN 2 COUCHES ──
//
// CÔTÉ CLIENT (temps réel) :
//   - validateField() → appelé à chaque onChange
//   - validateSection() → appelé au clic "Suivant"
//   - validateGeneralInfo() → titre ≥ 5 chars, produit requis
//   - Erreurs affichées inline sous chaque champ
//   - Barre de progression par section (obligatoires remplis / total)
//
// CÔTÉ SERVEUR (API) :
//   - Zod parse (createFicheSchema) → structure + types
//   - validateCreateFiche() → chaque champ vs sa définition
//   - Erreurs renvoyées en JSON structuré (422) avec détail par section
//
//
// ── GESTION DES ERREURS ──
//
// Format erreur serveur 422 :
//   {
//     "success": false,
//     "error": "{\"message\":\"Erreurs de validation\",\"details\":{...}}"
//   }
//
// Le hook parse ce JSON et injecte les erreurs dans l'état local
// pour les afficher au bon endroit dans le wizard.
//
// Erreurs réseau : catch global → message "Erreur réseau"
//
//
// ── NUMÉROTATION AUTOMATIQUE ──
//
// La génération du numéro est atomique (dans la même transaction que le create) :
//   1. Chercher la dernière fiche commençant par "FC-{année}-"
//   2. Incrémenter la séquence
//   3. Formater en FC-YYYY-NNNNN (ex: FC-2026-00001)
//   4. Créer la fiche avec ce numéro dans la même transaction
//   → Pas de conflit d'unicité possible
//
//
// ── STATUT PAR DÉFAUT ──
//
// Statut initial : EN_ATTENTE (la fiche est soumise directement)
// La dateSoumission est renseignée automatiquement.
// Un admin pourra ensuite VALIDER ou REFUSER via l'interface de validation.
//
//
// ╔══════════════════════════════════════════════════════════════════════╗
// ║              EXEMPLE DE STRUCTURE JSON STOCKÉE                     ║
// ╚══════════════════════════════════════════════════════════════════════╝

/**
 * EXEMPLE — Payload envoyé au POST /api/fiches
 */
export const exemplePayload = {
  titre: "Contrôle Bitume oxydé 85/25 - Lot 2026-042",
  produit: "Bitume oxydé 85/25",
  sections: [
    {
      sectionId: "bitumes_oxydes",
      titre: "Bitumes oxydés",
      ordre: 0,
      donnees: {
        date_prelevement: "2026-02-12",
        numero_lot: "LOT-2026-042",
        grade: "85/25",
        penetrabilite_25: 23,
        point_ramollissement: 87.5,
        ductilite_25: 3.2,
        densite_relative: 1.025,
        perte_chauffage: 0.15,
        point_eclair: 280,
        solubilite_trichlo: 99.8,
        conforme: "Conforme",
        observations: "Lot conforme aux spécifications NA 5075"
      }
    },
    {
      sectionId: "bitumes_fluidifies",
      titre: "Bitumes fluidifiés",
      ordre: 1,
      donnees: {
        date_prelevement: "2026-02-12",
        numero_lot: "LOT-2026-042",
        classe: "0/1",
        viscosite_standard: 45,
        point_eclair: 68,
        distillation_225: 12.5,
        distillation_315: 48.3,
        distillation_360: 72.1,
        penetrabilite_residu: 85,
        pseudo_viscosite: 120,
        conforme: "Conforme",
        observations: null
      }
    },
    {
      sectionId: "bitumes_modifies",
      titre: "Bitumes modifiés",
      ordre: 2,
      donnees: {
        date_prelevement: "2026-02-12",
        numero_lot: "LOT-2026-043",
        type_polymere: "SBS",
        taux_modification: 5.5,
        penetrabilite_25: 65,
        point_ramollissement: 72.0,
        retour_elastique: 85,
        force_ductilite: 8.5,
        stabilite_stockage: 2.1,
        fraass: -18,
        conforme: "Conforme",
        observations: "Excellente élasticité"
      }
    },
    {
      sectionId: "produits_finis_traditionnels",
      titre: "Produits finis traditionnels",
      ordre: 3,
      donnees: {
        date_prelevement: "2026-02-12",
        numero_lot: "LOT-2026-044",
        type_produit: "Enrobé à chaud",
        temperature_fabrication: 165,
        teneur_bitume: 5.8,
        granulometrie: "0/14",
        compacite: 97.2,
        stabilite_marshall: 12.5,
        fluage_marshall: 3.2,
        mvr: 2.450,
        conforme: "Conforme",
        observations: null
      }
    },
    {
      sectionId: "produits_finis_membranes",
      titre: "Produits finis membranes",
      ordre: 4,
      donnees: {
        date_prelevement: "2026-02-12",
        numero_lot: "LOT-2026-045",
        type_membrane: "SBS 4mm",
        epaisseur: 4.1,
        masse_surfacique: 4.85,
        resistance_traction_long: 850,
        resistance_traction_trav: 650,
        allongement_rupture: 45.2,
        souplesse_froid: -20,
        tenue_chaleur: 100,
        etancheite: "Étanche",
        conforme: "Conforme",
        observations: "Membrane conforme EN 13707"
      }
    },
    {
      sectionId: "emulsions_stabilisees",
      titre: "Émulsions stabilisées",
      ordre: 5,
      donnees: {
        date_prelevement: "2026-02-12",
        numero_lot: "LOT-2026-046",
        type_emulsion: "C69B3",
        teneur_eau: 31.0,
        teneur_liant: 69.0,
        ph: 2.5,
        viscosite_efflux: 35,
        indice_rupture: 120,
        stabilite_stockage_7j: 1.2,
        tamisage_500um: 0.05,
        adhesivite: "Bonne",
        conforme: "Conforme",
        observations: null
      }
    }
  ]
};

/**
 * EXEMPLE — Réponse après création réussie (201)
 */
export const exempleReponse = {
  success: true,
  data: {
    id: "clx1234567890abcdef",
    numero: "FC-2026-00042",
    titre: "Contrôle Bitume oxydé 85/25 - Lot 2026-042",
    produit: "Bitume oxydé 85/25",
    statut: "EN_ATTENTE",
    createdAt: "2026-02-12T10:30:00.000Z"
  }
};

/**
 * EXEMPLE — Structure stockée en BDD (SectionData.donnees)
 *
 * Table: quality_controls
 * ┌────────────────────────────────────────────────────────┐
 * │ id:        "clx..."                                    │
 * │ numero:    "FC-2026-00042"                             │
 * │ titre:     "Contrôle Bitume oxydé 85/25 - Lot..."     │
 * │ produit:   "Bitume oxydé 85/25"                       │
 * │ statut:    "EN_ATTENTE"                               │
 * │ createdAt: 2026-02-12T10:30:00Z                       │
 * └────────────────────────────────────────────────────────┘
 *          │
 *          ├── Table: section_data (ordre=0)
 *          │   ┌────────────────────────────────────────────┐
 *          │   │ titre:   "Bitumes oxydés"                  │
 *          │   │ donnees: {                                  │
 *          │   │   "date_prelevement": "2026-02-12",        │
 *          │   │   "grade": "85/25",                        │
 *          │   │   "penetrabilite_25": 23,                  │
 *          │   │   "point_ramollissement": 87.5,             │
 *          │   │   "conforme": "Conforme",                  │
 *          │   │   ...                                       │
 *          │   │ }                                           │
 *          │   └────────────────────────────────────────────┘
 *          │
 *          ├── Table: section_data (ordre=1)
 *          │   │ titre: "Bitumes fluidifiés"
 *          │   │ donnees: { ... }
 *          │
 *          ├── (sections 2 à 5...)
 *          │
 *          └── Table: validation_logs
 *              ┌────────────────────────────────────────────┐
 *              │ action:  "CREATION"                        │
 *              │ details: {                                  │
 *              │   "titre": "...",                           │
 *              │   "produit": "...",                         │
 *              │   "nbSections": 6                          │
 *              │ }                                           │
 *              └────────────────────────────────────────────┘
 */

/**
 * EXEMPLE — Erreur de validation (422)
 */
export const exempleErreur422 = {
  success: false,
  error: JSON.stringify({
    message: "Erreurs de validation",
    details: {
      sections: {
        bitumes_oxydes: {
          penetrabilite_25: "Pénétrabilité à 25°C est obligatoire",
          point_ramollissement: "Point de ramollissement doit être ≥ 30 °C"
        },
        emulsions_stabilisees: {
          ph: "pH doit être ≤ 7"
        }
      }
    }
  })
};
