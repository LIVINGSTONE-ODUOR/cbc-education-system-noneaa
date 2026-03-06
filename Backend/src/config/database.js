const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

// Build Postgres connection STRICTLY from SUPABASE_URL + DB credentials.
// DATABASE_URL is intentionally not used.
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const dbPassword = process.env.SUPABASE_DB_PASSWORD || null;
const dbUser = process.env.SUPABASE_DB_USER || 'postgres';
const dbName = process.env.SUPABASE_DB_NAME || 'postgres';
const dbPort = Number.parseInt(process.env.SUPABASE_DB_PORT || '5432', 10);

if (!supabaseUrl) {
  console.error('❌ Missing SUPABASE_URL in environment.');
  console.log('Please set SUPABASE_URL in your .env file.');
  process.exit(1);
}

let projectRef = null;
try {
  const parsed = new URL(supabaseUrl);
  projectRef = parsed.hostname.split('.')[0] || null;
} catch {
  // Fallback for malformed URL strings
  const host = supabaseUrl.replace(/^https?:\/\//, '').split('/')[0];
  projectRef = host.split('.')[0] || null;
}

if (!projectRef) {
  console.error('❌ Could not extract Supabase project reference from VITE_SUPABASE_URL.');
  process.exit(1);
}

const dbHost = process.env.SUPABASE_DB_HOST || `db.${projectRef}.supabase.co`;
const passwordForConnection = dbPassword || '[YOUR-PASSWORD]';

const connectionString = `postgresql://${encodeURIComponent(dbUser)}:${encodeURIComponent(
  passwordForConnection
)}@${dbHost}:${dbPort}/${encodeURIComponent(dbName)}`;

// Database connection configuration
const pool = new Pool({
  connectionString,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : { rejectUnauthorized: false },
  max: 30,
  min: 5,
  idle: 5000,
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 60000,
  statement_timeout: 30000,
  query_timeout: 30000,
});

// Test database connection
pool.on('connect', () => {
  console.log('🗄️  Connected to database');
});

pool.on('error', (err) => {
  console.error('❌ Database connection error:', err);
});

// Enhanced query function with error handling and logging
const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log(`📊 Query executed in ${duration}ms`, { text: text.substring(0, 50), rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('❌ Database query error:', error);
    throw error;
  }
};

// Transaction wrapper for atomic operations
const transaction = async (callback) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Transaction failed, rolling back:', error);
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  query,
  transaction,
  pool
};
