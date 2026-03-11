// ============================================================================
// AUTH SERVICE — Logique métier d'authentification
// Couche service isolée des routes API (testable, réutilisable)
// ============================================================================

import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { signJWT } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { AUTH_CONFIG, AUTH_ERRORS } from '@/lib/constants';
import type { AuthUser } from '@/types/auth.types';
import type { LoginInput, RegisterInput } from '@/validations/auth.schema';

// ── Résultat d'une opération auth ──

type AuthResult =
  | { success: true; user: AuthUser; token: string }
  | { success: false; error: string };

// ============================================================================
// LOGIN
// ============================================================================

export async function login(input: LoginInput): Promise<AuthResult> {
  // 1. Chercher l'utilisateur par email
  const user = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (!user) {
    logger.security('Login failed: user not found', { meta: { email: input.email } });
    return { success: false, error: AUTH_ERRORS.INVALID_CREDENTIALS };
  }

  // 2. Vérifier que le compte est actif
  if (!user.estActif) {
    logger.security('Login failed: inactive account', { userId: user.id, meta: { email: input.email } });
    return { success: false, error: AUTH_ERRORS.USER_INACTIVE };
  }

  // 3. Comparer le mot de passe avec le hash bcrypt
  const passwordValid = await bcrypt.compare(input.password, user.password);
  if (!passwordValid) {
    logger.security('Login failed: wrong password', { userId: user.id, meta: { email: input.email } });
    return { success: false, error: AUTH_ERRORS.INVALID_CREDENTIALS };
  }

  // 4. Générer le JWT
  const token = await signJWT({
    sub: user.id,
    email: user.email,
    role: user.role,
    nom: user.nom,
    prenom: user.prenom,
  });

  // 5. Retourner les données utilisateur (sans le password)
  const { password: _, ...safeUser } = user;
  logger.info('Login successful', { context: 'AUTH', userId: user.id, meta: { email: user.email, role: user.role } });
  return { success: true, user: safeUser, token };
}

// ============================================================================
// REGISTER
// ============================================================================

export async function register(input: RegisterInput): Promise<AuthResult> {
  // 1. Vérifier que l'email n'existe pas déjà
  const existing = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (existing) {
    logger.security('Register failed: email already exists', { meta: { email: input.email } });
    return { success: false, error: AUTH_ERRORS.EMAIL_EXISTS };
  }

  // 2. Hasher le mot de passe
  const hashedPassword = await bcrypt.hash(
    input.password,
    AUTH_CONFIG.BCRYPT_SALT_ROUNDS
  );

  // 3. Créer l'utilisateur
  const user = await prisma.user.create({
    data: {
      email: input.email,
      password: hashedPassword,
      nom: input.nom,
      prenom: input.prenom,
      role: input.role ?? 'CONTROLEUR',
    },
  });

  // 4. Générer le JWT
  const token = await signJWT({
    sub: user.id,
    email: user.email,
    role: user.role,
    nom: user.nom,
    prenom: user.prenom,
  });

  // 5. Retourner les données utilisateur (sans le password)
  const { password: _, ...safeUser } = user;
  logger.info('User registered', { context: 'AUTH', userId: user.id, meta: { email: user.email, role: user.role } });
  return { success: true, user: safeUser, token };
}

// ============================================================================
// GET USER BY ID (pour /api/auth/me)
// ============================================================================

export async function getUserById(userId: string): Promise<AuthUser | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      nom: true,
      prenom: true,
      role: true,
      estActif: true,
      createdAt: true,
    },
  });

  return user;
}
