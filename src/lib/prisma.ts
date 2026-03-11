// ============================================================================
// PRISMA CLIENT SINGLETON — Optimisé pour production
// ─ Singleton avec globalThis (évite les connexions multiples en dev)
// ─ Logging structuré via logger.ts
// ─ Middleware de monitoring des requêtes lentes
// ─ Configuration du pool de connexions
// ============================================================================

import { PrismaClient, Prisma } from '@prisma/client';
import { logger } from '@/lib/logger';

const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// ── Seuil de requête lente (ms) ──
const SLOW_QUERY_THRESHOLD = parseInt(process.env.SLOW_QUERY_THRESHOLD || '500', 10);

// ── Configuration du pool de connexions ──
// MySQL max_connections par défaut = 151
// On utilise ~10% par instance Next.js (ajuster selon nombre d'instances)
const CONNECTION_LIMIT = parseInt(process.env.DATABASE_POOL_SIZE || '10', 10);

function buildDatabaseUrl(): string {
  const baseUrl = process.env.DATABASE_URL || '';
  // Ajouter les paramètres de pool si pas déjà présents
  if (baseUrl && !baseUrl.includes('connection_limit')) {
    const separator = baseUrl.includes('?') ? '&' : '?';
    return `${baseUrl}${separator}connection_limit=${CONNECTION_LIMIT}&pool_timeout=10`;
  }
  return baseUrl;
}

function createPrismaClient(): PrismaClient {
  const client = new PrismaClient({
    log: IS_PRODUCTION
      ? [
          { level: 'error', emit: 'event' },
          { level: 'warn', emit: 'event' },
        ]
      : [
          { level: 'query', emit: 'event' },
          { level: 'error', emit: 'event' },
          { level: 'warn', emit: 'event' },
        ],
    datasources: {
      db: {
        url: buildDatabaseUrl(),
      },
    },
  });

  // ── Event handlers pour logging structuré ──

  // @ts-expect-error Prisma event typing
  client.$on('error', (e: Prisma.LogEvent) => {
    logger.error('Database error', {
      context: 'DATABASE',
      meta: { message: e.message, target: e.target },
    });
  });

  // @ts-expect-error Prisma event typing
  client.$on('warn', (e: Prisma.LogEvent) => {
    logger.warn('Database warning', {
      context: 'DATABASE',
      meta: { message: e.message },
    });
  });

  // Monitoring des requêtes lentes (dev uniquement pour éviter l'overhead)
  if (!IS_PRODUCTION) {
    // @ts-expect-error Prisma event typing
    client.$on('query', (e: Prisma.QueryEvent) => {
      if (e.duration > SLOW_QUERY_THRESHOLD) {
        logger.slowQuery(e.query, e.duration, { params: e.params });
      }
    });
  }

  return client;
}

// ── Singleton ──

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (!IS_PRODUCTION) {
  globalForPrisma.prisma = prisma;
}

export default prisma;

// ── Graceful shutdown ──
// En production, fermer proprement les connexions à l'arrêt du process

if (IS_PRODUCTION) {
  const shutdown = async () => {
    logger.info('Shutting down Prisma client...', { context: 'DATABASE' });
    await prisma.$disconnect();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}
