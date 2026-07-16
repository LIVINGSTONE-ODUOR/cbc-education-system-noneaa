/**
 * Environment Variable Validation — CBC Education System
 */

const logger = require('../utils/logger');

const required = [
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'JWT_SECRET',
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

  if (missing.length > 0) {
    const message = `Missing required environment variables: ${missing.join(', ')}. Application startup failed.`;
    throw new Error(message);
  }

  return {
    SUPABASE_URL: env('SUPABASE_URL', { allowEmpty: false }),
    SUPABASE_ANON_KEY: env('SUPABASE_ANON_KEY', { allowEmpty: false }),
    SUPABASE_SERVICE_ROLE_KEY: env('SUPABASE_SERVICE_ROLE_KEY', { allowEmpty: false }),
    JWT_SECRET: env('JWT_SECRET', { allowEmpty: false }),
  };
}

module.exports = {
  validateEnv,
};
