// ============================================================================
// HOOK CSRF — Récupération du token CSRF côté client
// À utiliser pour inclure le token dans les requêtes POST/PUT/DELETE
// ============================================================================

/**
 * Récupère le token CSRF depuis le cookie.
 * Utilisé pour le pattern "Double-submit cookie" :
 *   1. Le middleware met le token dans un cookie non-HttpOnly
 *   2. Le client le lit et le renvoie dans le header x-csrf-token
 *   3. Le middleware vérifie que cookie === header
 */
export function getCSRFToken(): string | null {
  if (typeof document === 'undefined') return null;

  const match = document.cookie.match(
    new RegExp('(?:^|; )qc-csrf-token=([^;]*)')
  );

  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * Crée les headers incluant le token CSRF.
 * Utiliser avec fetch() pour les requêtes mutantes.
 *
 * @example
 * ```ts
 * const response = await fetch('/api/fiches', {
 *   method: 'POST',
 *   headers: getSecureHeaders(),
 *   body: JSON.stringify(data),
 * });
 * ```
 */
export function getSecureHeaders(
  additionalHeaders?: Record<string, string>
): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...additionalHeaders,
  };

  const csrfToken = getCSRFToken();
  if (csrfToken) {
    headers['x-csrf-token'] = csrfToken;
  }

  return headers;
}
