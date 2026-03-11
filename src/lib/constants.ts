// ============================================================================
// CONSTANTES GLOBALES DE L'APPLICATION
// ============================================================================

// ── Authentification ──

export const AUTH_CONFIG = {
  /** Nom du cookie JWT */
  COOKIE_NAME: 'qc-auth-token',

  /** Durée de validité du JWT (8 heures = journée de travail) */
  JWT_EXPIRATION: '8h',

  /** Durée du cookie en secondes (8h) */
  COOKIE_MAX_AGE: 8 * 60 * 60,

  /** Nombre de rounds bcrypt pour le hashage */
  BCRYPT_SALT_ROUNDS: 12,

  /** Tentatives max de login par minute par IP */
  MAX_LOGIN_ATTEMPTS: 5,
} as const;

// ── Routes publiques (accessibles sans authentification) ──

export const PUBLIC_ROUTES = [
  '/login',
  '/api/auth/login',
  '/api/auth/register',
] as const;

// ── Routes réservées aux admins ──

export const ADMIN_ONLY_ROUTES = [
  '/utilisateurs',
  '/modeles',
  '/validation',
  '/api/users',
  '/api/validation',
] as const;

// ── Format de numérotation des fiches ──

export const FICHE_CONFIG = {
  PREFIX: 'FC',
  SEQUENCE_LENGTH: 5,
} as const;

// ── Messages d'erreur standardisés ──

export const AUTH_ERRORS = {
  INVALID_CREDENTIALS: 'Email ou mot de passe incorrect',
  UNAUTHORIZED: 'Authentification requise',
  FORBIDDEN: 'Accès interdit — droits insuffisants',
  TOKEN_EXPIRED: 'Session expirée — veuillez vous reconnecter',
  USER_INACTIVE: 'Compte désactivé — contactez un administrateur',
  EMAIL_EXISTS: 'Un compte existe déjà avec cet email',
  VALIDATION_ERROR: 'Données invalides',
  INTERNAL_ERROR: 'Erreur interne du serveur',
} as const;
