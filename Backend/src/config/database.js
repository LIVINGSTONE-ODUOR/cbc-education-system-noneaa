const dns = require('dns');

// ✅ FORCE Node to prefer IPv4 over IPv6
dns.setDefaultResultOrder('ipv4first');
const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

// ==================== ENV CONFIG ====================
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const dbPassword = process.env.SUPABASE_DB_PASSWORD || null;
const dbUser = process.env.SUPABASE_DB_USER || 'postgres';
const dbName = process.env.SUPABASE_DB_NAME || 'postgres';
const dbPort = Number.parseInt(process.env.SUPABASE_DB_PORT || '5432', 10);

if (!supabaseUrl) {
  console.error('❌ Missing SUPABASE_URL in environment.');
  process.exit(1);
}

if (!dbPassword) {
  console.error('❌ Missing SUPABASE_DB_PASSWORD in environment.');
  process.exit(1);
}

// ==================== EXTRACT PROJECT REF ====================
let projectRef = null;

try {
  const parsed = new URL(supabaseUrl);
  projectRef = parsed.hostname.split('.')[0] || null;
} catch {
  const host = supabaseUrl.replace(/^https?:\/\//, '').split('/')[0];
  projectRef = host.split('.')[0] || null;
}

if (!projectRef) {
  console.error('❌ Could not extract Supabase project reference.');
  process.exit(1);
}

// ==================== CONNECTION STRING ====================
const dbHost = process.env.SUPABASE_DB_HOST || `db.${projectRef}.supabase.co`;

let connectionString;
if (process.env.DATABASE_URL) {
  // Use the provided DATABASE_URL (e.g., for Supabase pooler in Codespaces)
  connectionString = process.env.DATABASE_URL;
  console.log('🔗 Using DATABASE_URL from environment');
} else {
  // Build connection string from components
  connectionString = `postgresql://${encodeURIComponent(dbUser)}:${encodeURIComponent(
    dbPassword
  )}@${dbHost}:${dbPort}/${encodeURIComponent(dbName)}`;
  console.log('🔗 Built connection string from components');
}

console.log('🔗 Connecting to DB host:', dbHost);

// ==================== POOL CONFIG ====================
const pool = new Pool({
  connectionString,

  ssl: {
    rejectUnauthorized: false
  },

  // ✅ CRITICAL FIX → FORCE IPv4 (fixes ENETUNREACH)
  family: 4,

  // Pool tuning
  max: 30,
  min: 5,
  idleTimeoutMillis: 60000,
  connectionTimeoutMillis: 10000,

  // Query safety
  statement_timeout: 30000,
  query_timeout: 30000
});

// ==================== EVENTS ====================
pool.on('connect', () => {
  console.log('🗄️ Connected to database (IPv4)');
});

pool.on('error', (err) => {
  console.error('❌ Database connection error:', err.message);
});

// ==================== QUERY ====================
const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;

    console.log(`📊 Query executed in ${duration}ms`, {
      rows: res.rowCount
    });

    return res;
  } catch (error) {
    console.error('❌ Database query error:', error.message);
    throw error;
  }
};

// ==================== TRANSACTION ====================
const transaction = async (callback) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Transaction failed, rolling back:', error.message);
    throw error;
  } finally {
    client.release();
  }
};

// ==================== EXPORT ====================
module.exports = {
  query,
  transaction,
  pool
};