// ============================================================================
// LOGGER — Système de logging structuré pour production
// Niveaux : DEBUG < INFO < WARN < ERROR < FATAL
// Format JSON en production, lisible en développement
// ============================================================================

type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: string;
  requestId?: string;
  userId?: string;
  ip?: string;
  method?: string;
  path?: string;
  statusCode?: number;
  duration?: number;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  meta?: Record<string, unknown>;
}

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  FATAL: 4,
};

const CURRENT_LEVEL: LogLevel =
  (process.env.LOG_LEVEL as LogLevel) ??
  (process.env.NODE_ENV === 'production' ? 'INFO' : 'DEBUG');

const IS_PRODUCTION = process.env.NODE_ENV === 'production';

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[CURRENT_LEVEL];
}

function formatEntry(entry: LogEntry): string {
  if (IS_PRODUCTION) {
    // JSON structuré pour parsing par ELK/CloudWatch/Loki
    return JSON.stringify(entry);
  }

  // Format lisible pour le développement
  const parts = [
    `[${entry.timestamp}]`,
    `[${entry.level.padEnd(5)}]`,
    entry.context ? `[${entry.context}]` : '',
    entry.message,
  ].filter(Boolean);

  let line = parts.join(' ');

  if (entry.method && entry.path) {
    line += ` — ${entry.method} ${entry.path}`;
  }
  if (entry.statusCode) {
    line += ` (${entry.statusCode})`;
  }
  if (entry.duration !== undefined) {
    line += ` [${entry.duration}ms]`;
  }
  if (entry.userId) {
    line += ` user=${entry.userId}`;
  }
  if (entry.error) {
    line += `\n  Error: ${entry.error.name}: ${entry.error.message}`;
    if (entry.error.stack && !IS_PRODUCTION) {
      line += `\n  ${entry.error.stack}`;
    }
  }
  if (entry.meta && Object.keys(entry.meta).length > 0) {
    line += `\n  Meta: ${JSON.stringify(entry.meta)}`;
  }

  return line;
}

function emit(level: LogLevel, entry: LogEntry): void {
  if (!shouldLog(level)) return;

  const output = formatEntry(entry);

  switch (level) {
    case 'ERROR':
    case 'FATAL':
      console.error(output);
      break;
    case 'WARN':
      console.warn(output);
      break;
    case 'DEBUG':
      console.debug(output);
      break;
    default:
      console.log(output);
  }
}

// ── Interface publique ──

function createLogMethod(level: LogLevel) {
  return (
    message: string,
    opts?: Partial<Omit<LogEntry, 'timestamp' | 'level' | 'message'>>
  ) => {
    emit(level, {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...opts,
    });
  };
}

export const logger = {
  debug: createLogMethod('DEBUG'),
  info: createLogMethod('INFO'),
  warn: createLogMethod('WARN'),
  error: createLogMethod('ERROR'),
  fatal: createLogMethod('FATAL'),

  /**
   * Log une requête API avec durée et statut
   */
  request(opts: {
    method: string;
    path: string;
    statusCode: number;
    duration: number;
    userId?: string;
    ip?: string;
    meta?: Record<string, unknown>;
  }) {
    const level: LogLevel = opts.statusCode >= 500 ? 'ERROR' : opts.statusCode >= 400 ? 'WARN' : 'INFO';
    emit(level, {
      timestamp: new Date().toISOString(),
      level,
      message: `${opts.method} ${opts.path} ${opts.statusCode}`,
      context: 'HTTP',
      ...opts,
    });
  },

  /**
   * Log une erreur avec stack trace
   */
  exception(err: unknown, context?: string, meta?: Record<string, unknown>) {
    const error =
      err instanceof Error
        ? { name: err.name, message: err.message, stack: err.stack }
        : { name: 'Unknown', message: String(err) };

    emit('ERROR', {
      timestamp: new Date().toISOString(),
      level: 'ERROR',
      message: error.message,
      context,
      error,
      meta,
    });
  },

  /**
   * Log un événement de sécurité
   */
  security(
    message: string,
    opts?: { ip?: string; userId?: string; meta?: Record<string, unknown> }
  ) {
    emit('WARN', {
      timestamp: new Date().toISOString(),
      level: 'WARN',
      message,
      context: 'SECURITY',
      ...opts,
    });
  },

  /**
   * Log une requête DB lente
   */
  slowQuery(query: string, duration: number, meta?: Record<string, unknown>) {
    emit('WARN', {
      timestamp: new Date().toISOString(),
      level: 'WARN',
      message: `Slow query (${duration}ms): ${query.slice(0, 200)}`,
      context: 'DATABASE',
      duration,
      meta,
    });
  },
};
