// src/config/database.js
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  console.error('❌ Missing SUPABASE_URL');
  process.exit(1);
}

if (!supabaseServiceRoleKey) {
  console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// ====================== Supabase Admin Client (Recommended) ======================
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { 
    autoRefreshToken: false, 
    persistSession: false 
  },
});

console.log('✅ Supabase admin client initialized successfully');

// ====================== Optional: Lightweight Postgres Pool (for heavy queries) ======================
let pool = null;
const shouldUseDirectPostgres = process.env.ENABLE_DIRECT_POSTGRES === 'true' || Boolean(process.env.DATABASE_URL || process.env.SUPABASE_DB_HOST);

if (shouldUseDirectPostgres) {
  const { Pool } = require('pg');
  
  const dbHost = process.env.SUPABASE_DB_HOST || 
    supabaseUrl.replace(/^https?:\/\//, '').split('.')[0] + '.supabase.co';
  
  const connectionString = process.env.DATABASE_URL || 
    `postgresql://${encodeURIComponent(process.env.SUPABASE_DB_USER || 'postgres')}` +
    `:${encodeURIComponent(process.env.SUPABASE_DB_PASSWORD)}@${dbHost}:${process.env.SUPABASE_DB_PORT || 5432}/postgres`;

  pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
    max: 20,
    idleTimeoutMillis: 60000,
    connectionTimeoutMillis: 15000,
  });

  pool.on('connect', () => console.log('✅ Postgres pool connected (IPv4)'));
  pool.on('error', (err) => console.error('Pool error:', err.message));
}

// ====================== Simple Query Wrapper (with fallback) ======================
const query = async (text, params = []) => {
  const start = Date.now();

  // Try direct Postgres first when the pool is available
  if (pool) {
    try {
      const res = await pool.query(text, params);
      console.log(`Query OK [${Date.now() - start}ms]`, { rows: res.rowCount });
      return res;
    } catch (error) {
      console.error('Direct Postgres failed:', error.message);
    }
  }

  // Fallback to Supabase JS client
  console.log('Falling back to Supabase REST...');
  return executeViaRest(text, params);
};

// ====================== Improved REST Fallback ======================
async function executeViaRest(text, params = []) {
  const lower = text.toLowerCase().trim();
  let tableName = null;

  // Better table detection
  const tableMatches = lower.match(/\b(?:from|into|update)\s+["']?(\w+)["']?/i);
  tableName = tableMatches ? tableMatches[1] : null;

  if (!tableName) {
    console.error('REST fallback: Could not determine table from query:', text);
    throw new Error('Could not determine target table for REST fallback');
  }

  console.log(`Supabase REST fallback → table: ${tableName}`);

  try {
    // INSERT
    if (lower.startsWith('insert')) {
      const insertData = Array.isArray(params[0]) ? params[0] : params[0] || {};
      const { data, error } = await supabaseAdmin
        .from(tableName)
        .insert(insertData)
        .select();
      if (error) throw error;
      return { rows: data || [], rowCount: data?.length || 0 };
    }

    // UPDATE
    if (lower.startsWith('update')) {
      const updateData = params[0] || {};
      const { data, error } = await supabaseAdmin
        .from(tableName)
        .update(updateData)
        .eq('id', params[1])   // Adjust this logic based on your queries
        .select();
      if (error) throw error;
      return { rows: data || [], rowCount: data?.length || 0 };
    }

    // SELECT (basic)
    let qb = supabaseAdmin.from(tableName).select('*');

    // Simple param handling - extend as needed
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
    console.error(`REST failed for table '${tableName}':`, error.message);
    throw error;
  }
}

// ====================== Transaction (Direct Postgres only) ======================
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

module.exports = { 
  query, 
  transaction, 
  pool, 
  supabaseAdmin 
};
