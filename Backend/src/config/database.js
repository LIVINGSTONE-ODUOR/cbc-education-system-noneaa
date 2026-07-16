/**
 * Database Configuration — CBC Education System
 *
 * Provides:
 * - Supabase admin client (recommended for most operations)
 * - Direct PostgreSQL pool (optional, for heavy queries)
 * - Query wrapper with automatic retry and REST fallback
 * - Connection health monitoring
 * - Graceful reconnection
 */

const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const logger = require('../utils/logger');

dotenv.config();

// ─────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  logger.error('Missing SUPABASE_URL environment variable. Exiting.');
  process.exit(1);
}

if (!supabaseServiceRoleKey) {
  logger.error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable. Exiting.');
  process.exit(1);
}

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;
const POOL_MAX = 20;
const POOL_IDLE_TIMEOUT = 60000;
const POOL_CONNECTION_TIMEOUT = 15000;

// ─────────────────────────────────────────────
// Supabase Admin Client
// ─────────────────────────────────────────────
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

logger.boot('Supabase admin client initialized');

// ─────────────────────────────────────────────
// Optional: Direct PostgreSQL Pool
// ─────────────────────────────────────────────
let pool = null;
let poolConnecting = false;
let poolConnectionAttempts = 0;

const shouldUseDirectPostgres =
  process.env.ENABLE_DIRECT_POSTGRES === 'true' ||
  Boolean(process.env.DATABASE_URL || process.env.SUPABASE_DB_HOST);

async function initPool() {
  if (poolConnecting) return;
  poolConnecting = true;

  try {
    const { Pool } = require('pg');

    const dbHost =
      process.env.SUPABASE_DB_HOST ||
      supabaseUrl.replace(/^https?:\/\//, '').split('.')[0] + '.supabase.co';

    const connectionString =
      process.env.DATABASE_URL ||
      `postgresql://${encodeURIComponent(process.env.SUPABASE_DB_USER || 'postgres')}` +
        `:${encodeURIComponent(process.env.SUPABASE_DB_PASSWORD)}@${dbHost}:${
          process.env.SUPABASE_DB_PORT || 5432
        }/postgres`;

    pool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
      max: POOL_MAX,
      idleTimeoutMillis: POOL_IDLE_TIMEOUT,
      connectionTimeoutMillis: POOL_CONNECTION_TIMEOUT,
    });

    pool.on('connect', () => {
      logger.boot('Postgres pool connected (IPv4)');
      poolConnectionAttempts = 0;
    });

    pool.on('error', (err) => {
      logger.error('Postgres pool error:', err.message);
      // Attempt to reconnect after a delay
      if (!poolConnecting) {
        setTimeout(() => {
          poolConnecting = false;
          pool = null;
          initPool().catch(() => {});
        }, RETRY_DELAY_MS * 2);
      }
    });

    // Test the pool with a simple query
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    logger.boot('Postgres pool connection verified');
  } catch (err) {
    logger.error('Failed to initialize Postgres pool:', err.message);
    pool = null;
  } finally {
    poolConnecting = false;
  }
}

if (shouldUseDirectPostgres) {
  initPool().catch((err) => logger.error('Pool initialization failed:', err.message));
}

// ─────────────────────────────────────────────
// Retry Helper
// ─────────────────────────────────────────────
async function withRetry(fn, retries = MAX_RETRIES) {
  let lastError;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < retries) {
        const delay = RETRY_DELAY_MS * attempt;
        logger.warn(`DB query retry ${attempt}/${retries} after ${delay}ms:`, error.message);
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }
  throw lastError;
}

// ─────────────────────────────────────────────
// Query Wrapper
// ─────────────────────────────────────────────
const query = async (text, params = []) => {
  const start = Date.now();

  // Try direct Postgres first if pool is available
  if (pool) {
    try {
      const res = await pool.query(text, params);
      return res;
    } catch (error) {
      const CONNECTION_ERROR_CODES = new Set([
        'ECONNREFUSED',
        'ETIMEDOUT',
        'ENOTFOUND',
        'EHOSTUNREACH',
        '57P01',
        '57P02',
        '57P03',
        '08000',
        '08003',
        '08006',
        '08001',
        '08004',
      ]);

      if (!CONNECTION_ERROR_CODES.has(error.code)) {
        logger.error('Postgres query failed:', { message: error.message, code: error.code });
        throw error;
      }

      logger.warn('Direct Postgres connection failed, falling back to REST:', error.message);
    }
  }

  // Fallback: execute via Supabase REST API
  return executeViaRest(text, params);
};

// ─────────────────────────────────────────────
// REST Fallback
// ─────────────────────────────────────────────
async function executeViaRest(text, params = []) {
  const lower = text.toLowerCase().trim();
  const tableMatches = lower.match(/\b(?:from|into|update)\s+["']?(\w+)["']?/i);
  const tableName = tableMatches ? tableMatches[1] : null;

  if (!tableName) {
    throw new Error('Could not determine target table for REST fallback');
  }

  try {
    // INSERT
    if (lower.startsWith('insert')) {
      const insertData = Array.isArray(params[0]) ? params[0] : params[0] || {};
      const { data, error } = await supabaseAdmin.from(tableName).insert(insertData).select();
      if (error) throw error;
      return { rows: data || [], rowCount: data?.length || 0 };
    }

    // UPDATE
    if (lower.startsWith('update')) {
      const updateData = params[0] || {};
      const { data, error } = await supabaseAdmin
        .from(tableName)
        .update(updateData)
        .eq('id', params[1])
        .select();
      if (error) throw error;
      return { rows: data || [], rowCount: data?.length || 0 };
    }

    // SELECT
    let qb = supabaseAdmin.from(tableName).select('*');
    if (params.length > 0) {
      if (lower.includes('email')) qb = qb.eq('email', params[0]);
      else if (lower.includes('id')) qb = qb.eq('id', params[0]);
      else if (lower.includes('user_id')) qb = qb.eq('user_id', params[0]);
      else if (lower.includes('session_token')) qb = qb.eq('session_token', params[0]);
    }

    const { data, error } = await qb;
    if (error) throw error;
    return { rows: data || [], rowCount: data?.length || 0 };
  } catch (error) {
    logger.error(`REST fallback failed for table '${tableName}':`, error.message);
    throw error;
  }
}

// ─────────────────────────────────────────────
// Transaction Support
// ─────────────────────────────────────────────
const transaction = async (callback) => {
  if (!pool) throw new Error('Transactions require direct Postgres pool. Enable ENABLE_DIRECT_POSTGRES.');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// ─────────────────────────────────────────────
// Connection Health Check
// ─────────────────────────────────────────────
let lastHealthCheck = Date.now();
let isHealthy = true;

async function checkConnectionHealth() {
  try {
    await query('SELECT 1');
    isHealthy = true;
  } catch (error) {
    isHealthy = false;
    logger.error('Database health check failed:', error.message);

    // Attempt to reconnect pool if it was lost
    if (shouldUseDirectPostgres && !pool) {
      initPool().catch(() => {});
    }
  }
  lastHealthCheck = Date.now();
}

// Run health check every 30 seconds
setInterval(() => {
  checkConnectionHealth().catch(() => {});
}, 30000);

// Run initial health check after 5 seconds
setTimeout(() => {
  checkConnectionHealth().catch(() => {});
}, 5000);

// ─────────────────────────────────────────────
// Exports
// ─────────────────────────────────────────────
module.exports = {
  query,
  withRetry,
  transaction,
  pool,
  supabaseAdmin,
  isHealthy: () => isHealthy,
};
