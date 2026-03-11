// ============================================================================
// VALIDATION ZOD — Schémas d'authentification
// Validation partagée entre frontend et backend
// ============================================================================

import { z } from 'zod';

// ── Schéma de connexion ──

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'L\'email est requis')
    .email('Format d\'email invalide')
    .max(191, 'Email trop long'),

  password: z
    .string()
    .min(1, 'Le mot de passe est requis'),
});

export type LoginInput = z.infer<typeof loginSchema>;

// ── Schéma d'inscription ──

export const registerSchema = z.object({
  email: z
    .string()
    .min(1, 'L\'email est requis')
    .email('Format d\'email invalide')
    .max(191, 'Email trop long'),

  password: z
    .string()
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
    .max(100, 'Le mot de passe est trop long')
    .regex(/[A-Z]/, 'Le mot de passe doit contenir au moins une majuscule')
    .regex(/[a-z]/, 'Le mot de passe doit contenir au moins une minuscule')
    .regex(/[0-9]/, 'Le mot de passe doit contenir au moins un chiffre')
    .regex(/[^A-Za-z0-9]/, 'Le mot de passe doit contenir au moins un caractère spécial'),

  nom: z
    .string()
    .min(1, 'Le nom est requis')
    .max(100, 'Le nom est trop long')
    .trim(),

  prenom: z
    .string()
    .min(1, 'Le prénom est requis')
    .max(100, 'Le prénom est trop long')
    .trim(),

  role: z
    .enum(['ADMIN', 'CONTROLEUR'])
    .optional()
    .default('CONTROLEUR'),
});

export type RegisterInput = z.infer<typeof registerSchema>;

// ── Helper : formater les erreurs Zod ──

export function formatZodErrors(error: z.ZodError): string {
  return error.errors
    .map((e) => e.message)
    .join(', ');
}
