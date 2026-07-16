/**
 * Environment Variable Validation — CBC Education System
 */

const logger = require('../utils/logger');

const required = [
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
];

function env(name, { allowEmpty = false } = {}) {
  const value = process.env[name];
  if (!allowEmpty && (!value || String(value).trim().length === 0)) {
    return undefined;
  }
  return value;
}

function validateEnv() {
  const missing = required.filter((k) => {
    const v = env(k);
    return v === undefined;
  });

  const isProd = (process.env.NODE_ENV || 'development').toLowerCase() === 'production';

  if (missing.length > 0) {
    const message = `Missing required environment variables: ${missing.join(', ')}`;
    if (isProd) {
      throw new Error(message);
    }
    logger.warn(`[env] ${message}. Continuing with limited functionality.`);
  }

  return {
    SUPABASE_URL: env('SUPABASE_URL', { allowEmpty: false }),
    SUPABASE_ANON_KEY: env('SUPABASE_ANON_KEY', { allowEmpty: false }),
    SUPABASE_SERVICE_ROLE_KEY: env('SUPABASE_SERVICE_ROLE_KEY', { allowEmpty: false }),
  };
}

module.exports = {
  validateEnv,
};
