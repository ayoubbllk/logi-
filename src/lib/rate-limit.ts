// ============================================================================
// RATE LIMITER — Protection contre les abus (en mémoire, sans dépendance)
// Algorithme : Sliding window counter
// Production : remplacer par Redis (voir commentaire en bas)
// ============================================================================

interface RateLimitEntry {
  count: number;
  resetAt: number; // timestamp ms
}

interface RateLimitConfig {
  /** Nombre max de requêtes par fenêtre */
  maxRequests: number;
  /** Durée de la fenêtre en millisecondes */
  windowMs: number;
}

// ── Presets par type d'endpoint ──

export const RATE_LIMIT_PRESETS = {
  /** Login : 5 requêtes / 60s par IP */
  AUTH_LOGIN: { maxRequests: 5, windowMs: 60_000 },
  /** Register : 3 requêtes / 60s par IP */
  AUTH_REGISTER: { maxRequests: 3, windowMs: 60_000 },
  /** API standard : 100 requêtes / 60s par IP */
  API_STANDARD: { maxRequests: 100, windowMs: 60_000 },
  /** API lecture : 200 requêtes / 60s par IP */
  API_READ: { maxRequests: 200, windowMs: 60_000 },
  /** Export PDF : 10 requêtes / 60s par user */
  EXPORT: { maxRequests: 10, windowMs: 60_000 },
} as const;

// ── Store en mémoire ──

const stores = new Map<string, Map<string, RateLimitEntry>>();

function getStore(namespace: string): Map<string, RateLimitEntry> {
  if (!stores.has(namespace)) {
    stores.set(namespace, new Map());
  }
  return stores.get(namespace)!;
}

// ── Nettoyage périodique des entrées expirées ──

const CLEANUP_INTERVAL = 60_000; // 1 min

if (typeof globalThis !== 'undefined') {
  const globalObj = globalThis as unknown as { _rateLimitCleanup?: NodeJS.Timeout };
  if (!globalObj._rateLimitCleanup) {
    globalObj._rateLimitCleanup = setInterval(() => {
      const now = Date.now();
      for (const store of stores.values()) {
        for (const [key, entry] of store.entries()) {
          if (now > entry.resetAt) {
            store.delete(key);
          }
        }
      }
    }, CLEANUP_INTERVAL);

    // Ne pas empêcher le process de s'arrêter
    if (globalObj._rateLimitCleanup.unref) {
      globalObj._rateLimitCleanup.unref();
    }
  }
}

// ── Interface publique ──

export interface RateLimitResult {
  /** true si la requête est autorisée */
  allowed: boolean;
  /** Nombre de requêtes restantes */
  remaining: number;
  /** Timestamp de reset de la fenêtre (ms) */
  resetAt: number;
  /** Nombre max de requêtes autorisées */
  limit: number;
  /** Durée en secondes avant le prochain reset */
  retryAfter: number;
}

/**
 * Vérifie et incrémente le compteur de rate limiting.
 *
 * @param namespace — Catégorie (ex: 'auth_login', 'api')
 * @param key — Identifiant unique (IP, userId, etc.)
 * @param config — Limites à appliquer
 */
export function checkRateLimit(
  namespace: string,
  key: string,
  config: RateLimitConfig
): RateLimitResult {
  const store = getStore(namespace);
  const now = Date.now();
  const entry = store.get(key);

  // Nouvelle fenêtre ou fenêtre expirée
  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + config.windowMs });
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetAt: now + config.windowMs,
      limit: config.maxRequests,
      retryAfter: 0,
    };
  }

  // Fenêtre active — incrémenter
  entry.count++;

  const allowed = entry.count <= config.maxRequests;
  const remaining = Math.max(0, config.maxRequests - entry.count);
  const retryAfter = allowed ? 0 : Math.ceil((entry.resetAt - now) / 1000);

  return {
    allowed,
    remaining,
    resetAt: entry.resetAt,
    limit: config.maxRequests,
    retryAfter,
  };
}

/**
 * Crée les headers HTTP de rate limiting (RFC 6585, draft-ietf-httpapi-ratelimit-headers)
 */
export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  const headers: Record<string, string> = {
    'X-RateLimit-Limit': String(result.limit),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(Math.ceil(result.resetAt / 1000)),
  };

  if (!result.allowed) {
    headers['Retry-After'] = String(result.retryAfter);
  }

  return headers;
}

// ============================================================================
// NOTE PRODUCTION — Migration vers Redis
// ============================================================================
//
// En production multi-instance, remplacer le store Map par Redis :
//
//   import Redis from 'ioredis';
//   const redis = new Redis(process.env.REDIS_URL);
//
//   export async function checkRateLimitRedis(
//     namespace: string,
//     key: string,
//     config: RateLimitConfig
//   ): Promise<RateLimitResult> {
//     const redisKey = `rate_limit:${namespace}:${key}`;
//     const count = await redis.incr(redisKey);
//     if (count === 1) {
//       await redis.pexpire(redisKey, config.windowMs);
//     }
//     const ttl = await redis.pttl(redisKey);
//     const allowed = count <= config.maxRequests;
//     return {
//       allowed,
//       remaining: Math.max(0, config.maxRequests - count),
//       resetAt: Date.now() + ttl,
//       limit: config.maxRequests,
//       retryAfter: allowed ? 0 : Math.ceil(ttl / 1000),
//     };
//   }
//
