// ============================================================================
// TYPES — Authentification
// ============================================================================

import { Role } from '@prisma/client';

// ── Payload de connexion ──

export interface LoginRequest {
  email: string;
  password: string;
}

// ── Payload d'inscription ──

export interface RegisterRequest {
  email: string;
  password: string;
  nom: string;
  prenom: string;
  role?: Role;
}

// ── Réponse après login/register (données utilisateur sans le password) ──

export interface AuthUser {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  role: Role;
  estActif: boolean;
  createdAt: Date;
}

// ── Réponse API standardisée ──

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// ── Payload JWT décodé (utilisé dans le middleware) ──

export interface DecodedToken {
  sub: string;
  email: string;
  role: Role;
  nom: string;
  prenom: string;
  iat: number;
  exp: number;
}
