// ============================================================================
// VALIDATION ZOD — Décision de validation (valider / refuser)
// ============================================================================

import { z } from 'zod';

/** Schéma de validation pour la décision admin */
export const decisionSchema = z.object({
  action: z.enum(['VALIDATION', 'REJET'], {
    required_error: 'L\'action est obligatoire',
    invalid_type_error: 'L\'action doit être VALIDATION ou REJET',
  }),
  commentaire: z.string().max(2000, 'Le commentaire ne doit pas dépasser 2000 caractères').optional(),
}).refine(
  (data) => {
    // Le commentaire est obligatoire en cas de rejet
    if (data.action === 'REJET' && (!data.commentaire || data.commentaire.trim().length === 0)) {
      return false;
    }
    return true;
  },
  {
    message: 'Le commentaire est obligatoire en cas de rejet',
    path: ['commentaire'],
  }
);

export type DecisionInput = z.infer<typeof decisionSchema>;
