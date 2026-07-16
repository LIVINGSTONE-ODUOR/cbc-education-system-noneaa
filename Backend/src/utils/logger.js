/**
 * Centralized Logger — CBC Education System
 * 
 * Environment-aware logging:
 * - development: full debug output (console.log, warn, error, info)
 * - production:  only warnings and errors, no sensitive data
 * - test:        suppressed unless LOG_LEVEL=debug
 *
 * Never log: credentials, tokens, passwords, API keys, DB connection strings,
 * environment variable values that are secrets, or internal stack traces to clients.
 */

const LOG_LEVELS = { debug: 0, info: 1, warn: 2, error: 3, silent: 4 };

const ENV = (process.env.NODE_ENV || 'development').toLowerCase();
const LOG_LEVEL = (process.env.LOG_LEVEL || (ENV === 'production' ? 'warn' : 'debug')).toLowerCase();
const CURRENT_LEVEL = LOG_LEVELS[LOG_LEVEL] ?? (ENV === 'production' ? LOG_LEVELS.warn : LOG_LEVELS.debug);

const isProduction = ENV === 'production';
const isTest = ENV === 'test';

/**
 * Strip sensitive fields from an object before logging.
 * Returns a new object with sensitive fields replaced by '[REDACTED]'.
 */
function sanitize(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(sanitize);

  const SENSITIVE_KEYS = new Set([
    'password', 'password_hash', 'token', 'accessToken', 'refreshToken',
    'secret', 'apiKey', 'api_key', 'authorization', 'cookie', 'set-cookie',
    'jwt', 'jwt_secret', 'supabase_key', 'service_role_key',
    'connectionString', 'connection_string', 'database_url',
    'email_password', 'smtp_pass', 'private_key',
  ]);

  const cleaned = {};
  for (const [key, value] of Object.entries(obj)) {
    if (SENSITIVE_KEYS.has(key) || SENSITIVE_KEYS.has(key.toLowerCase())) {
      cleaned[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      cleaned[key] = sanitize(value);
    } else {
      cleaned[key] = value;
    }
  }
  return cleaned;
}

const logger = {
  debug(...args) {
    if (CURRENT_LEVEL > LOG_LEVELS.debug) return;
    if (isTest) return;
    const safe = args.map(a => (typeof a === 'object' && a !== null) ? sanitize(a) : a);
    console.debug('[DEBUG]', ...safe);
  },

  info(...args) {
    if (CURRENT_LEVEL > LOG_LEVELS.info) return;
    if (isProduction) return; // No info logs in production
    const safe = args.map(a => (typeof a === 'object' && a !== null) ? sanitize(a) : a);
    console.log('[INFO]', ...safe);
  },

  warn(...args) {
    if (CURRENT_LEVEL > LOG_LEVELS.warn) return;
    const safe = args.map(a => (typeof a === 'object' && a !== null) ? sanitize(a) : a);
    console.warn('[WARN]', ...safe);
  },

  error(...args) {
    if (CURRENT_LEVEL > LOG_LEVELS.error) return;
    const safe = args.map(a => {
      if (a instanceof Error) {
        return isProduction
          ? { message: a.message, name: a.name }
          : { message: a.message, name: a.name, stack: a.stack };
      }
      if (typeof a === 'object' && a !== null) return sanitize(a);
      return a;
    });
    console.error('[ERROR]', ...safe);
  },

  /** Use for startup / boot messages only — safe for production */
  boot(...args) {
    console.log('[BOOT]', ...args);
  },
};

module.exports = logger;
