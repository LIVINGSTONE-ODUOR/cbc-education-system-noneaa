const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

const { Pool } = require('pg');
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  console.error('❌ Missing SUPABASE_URL');
  process.exit(1);
}

// ====================== Supabase Admin Client ======================
const supabaseAdmin = supabaseUrl && supabaseServiceRoleKey
  ? createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  : null;

// ====================== Project Ref Extraction ======================
let projectRef = null;
try {
  const parsed = new URL(supabaseUrl);
  projectRef = parsed.hostname.split('.')[0];
} catch (e) {
  const host = supabaseUrl.replace(/^https?:\/\//, '').split('/')[0];
  projectRef = host.split('.')[0];
}

// ====================== Postgres Pool ======================
const dbHost = process.env.SUPABASE_DB_HOST || `db.${projectRef}.supabase.co`;
const connectionString = process.env.DATABASE_URL || 
  `postgresql://${encodeURIComponent(process.env.SUPABASE_DB_USER || 'postgres')}` +
  `:${encodeURIComponent(process.env.SUPABASE_DB_PASSWORD)}@${dbHost}:${process.env.SUPABASE_DB_PORT || 5432}/postgres`;

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
  family: 4,                    // Force IPv4
  max: 20,                      // Reduced from 30 (Render free tier friendly)
  idleTimeoutMillis: 60000,
  connectionTimeoutMillis: 15000,
  statement_timeout: 60000,
  query_timeout: 60000,
});

pool.on('connect', () => console.log('🗄️ Postgres pool connected (IPv4)'));
pool.on('error', (err) => console.error('❌ Pool error:', err.message));

// ====================== Query Wrapper ======================
const query = async (text, params = []) => {
  const start = Date.now();

  try {
    const res = await pool.query(text, params);
    console.log(`📊 Query OK [${Date.now() - start}ms]`, { rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('❌ Direct Postgres failed:', error.message);

    if (!supabaseAdmin) throw error;

    console.log('🔄 Falling back to Supabase REST...');
    return await executeViaRest(text, params);
  }
};

// ====================== REST Fallback (Cleaner) ======================
async function executeViaRest(text, params) {
  const lower = text.toLowerCase().trim();
  const tableMatch = lower.match(/\bfrom\s+["`]?(\w+)/i) || 
                     lower.match(/\bupdate\s+["`]?(\w+)/i) ||
                     lower.match(/\binsert\s+into\s+["`]?(\w+)/i);
  
  const tableName = tableMatch ? tableMatch[1] : null;

  if (!tableName) {
    throw new Error('REST fallback: Could not determine target table');
  }

  // --- WRITE OPERATIONS ---
  if (lower.startsWith('insert')) {
    // Better to let caller pass data explicitly for writes
    const { data, error } = await supabaseAdmin
      .from(tableName)
      .insert(params[0] || {}) // Expect first param as object/array
      .select();
    if (error) throw error;
    return { rows: data || [], rowCount: data?.length || 0 };
  }

  if (lower.startsWith('update')) {
    const { data, error } = await supabaseAdmin
      .from(tableName)
      .update(params[0] || {})
      .eq('id', params[1])
      .select();
    if (error) throw error;
    return { rows: data || [], rowCount: data?.length || 0 };
  }

  // --- READ OPERATIONS ---
  let queryBuilder = supabaseAdmin.from(tableName).select('*');

  // Simple where clause mapping (expand as needed)
  if (params.length > 0) {
    if (lower.includes('where id =') || lower.includes('id = $1')) {
      queryBuilder = queryBuilder.eq('id', params[0]);
    } else if (lower.includes('email =') || lower.includes('email = $1')) {
      queryBuilder = queryBuilder.eq('email', params[0]);
    } else if (lower.includes('user_id =') || lower.includes('user_id = $1')) {
      queryBuilder = queryBuilder.eq('user_id', params[0]);
    } else if (lower.includes('school_id =')) {
      queryBuilder = queryBuilder.eq('school_id', params[0]);
    }
  }

  const { data, error } = await queryBuilder;
  if (error) throw error;

  return { rows: data || [], rowCount: data?.length || 0 };
}

// ====================== Transaction Wrapper ======================
const transaction = async (callback) => {
  let client;
  try {
    client = await pool.connect();
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    if (client) await client.query('ROLLBACK');
    console.error('Transaction failed:', error.message);
    throw error;
  } finally {
    if (client) client.release();
  }
};

module.exports = { query, transaction, pool, supabaseAdmin };
