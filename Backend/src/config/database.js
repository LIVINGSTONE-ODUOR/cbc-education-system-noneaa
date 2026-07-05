const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

const { Pool } = require('pg');
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  console.error('Missing SUPABASE_URL');
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
  family: 4, // Force IPv4
  max: 20,
  idleTimeoutMillis: 60000,
  connectionTimeoutMillis: 15000,
  statement_timeout: 60000,
  query_timeout: 60000,
});

pool.on('connect', () => console.log('Postgres pool connected (IPv4)'));
pool.on('error', (err) => console.error('Pool error:', err.message));

// ====================== Query Wrapper ======================
const query = async (text, params = []) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    console.log(`Query OK [${Date.now() - start}ms]`, { rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Direct Postgres failed:', error.message);

    // For auth/session persistence, REST fallback is unsafe because the SQL->REST mapping
    // is not guaranteed to preserve parameterized values for this schema.
    // Fail fast so refresh-token/session logic doesn't silently desync.
    const lower = String(text || '').toLowerCase();
    const isAuthSessionQuery =
      lower.includes('from user_sessions') ||
      lower.includes('insert into user_sessions') ||
      lower.includes('update user_sessions') ||
      lower.includes('delete from user_sessions') ||
      lower.includes('from users') && lower.includes('session') ;

    if (isAuthSessionQuery) {
      throw error;
    }

    if (!supabaseAdmin) throw error;
    console.log('Falling back to Supabase REST...');
    return await executeViaRest(text, params);
  }
};

// ====================== REST Fallback (Fixed) ======================
async function executeViaRest(text, params = []) {
  const lower = text.toLowerCase().trim();

  // Improved table name detection
  let tableName = null;

  if (lower.includes('from users') || lower.includes('update users')) {
    tableName = 'users';
  } else if (lower.includes('from user_sessions') || lower.includes('update user_sessions')) {
    tableName = 'user_sessions';
  } else if (lower.includes('from school_admins')) {
    tableName = 'school_admins';
  } else {
    // Fallback regex
    // Must be careful with queries that contain the token "SET" (e.g. ON CONFLICT ... DO UPDATE ... SET ...)
    // This REST fallback uses the detected table name to build a .from(tableName) call.
    const fromMatch = lower.match(/\bfrom\s+["`]?(\w+)/i);
    const updateMatch = lower.match(/\bupdate\s+["`]?(\w+)/i);
    const insertMatch = lower.match(/\binsert\s+into\s+["`]?(\w+)/i);

    // If the query is an UPSERT/ON CONFLICT, prefer the INSERT INTO table name.
    tableName = insertMatch?.[1] || fromMatch?.[1] || updateMatch?.[1];
  }

  if (!tableName) {
    console.error('REST fallback: Could not determine target table from query:', text);
    throw new Error('REST fallback: Could not determine target table');
  }

  console.log(`Supabase REST fallback using table: ${tableName}`);

  try {
    // INSERT
    if (lower.startsWith('insert')) {
      const { data, error } = await supabaseAdmin
        .from(tableName)
        .insert(params[0] || {})
        .select();
      if (error) throw error;
      return { rows: data || [], rowCount: data?.length || 0 };
    }

    // UPDATE
    if (lower.startsWith('update')) {
      const { data, error } = await supabaseAdmin
        .from(tableName)
        .update(params[0] || {})
        .eq('id', params[1])
        .select();
      if (error) throw error;
      return { rows: data || [], rowCount: data?.length || 0 };
    }

    // SELECT
    let queryBuilder = supabaseAdmin.from(tableName).select('*');

    // Basic filters
    if (params.length > 0) {
      if (lower.includes('email =') || lower.includes('email = $1')) {
        queryBuilder = queryBuilder.eq('email', params[0]);
      } else if (lower.includes('id =') || lower.includes('id = $1')) {
        queryBuilder = queryBuilder.eq('id', params[0]);
      } else if (lower.includes('user_id =') || lower.includes('user_id = $1')) {
        queryBuilder = queryBuilder.eq('user_id', params[0]);
      } else if (lower.includes('session_token =')) {
        queryBuilder = queryBuilder.eq('session_token', params[0]);
      }
    }

    const { data, error } = await queryBuilder;
    if (error) throw error;

    return { rows: data || [], rowCount: data?.length || 0 };
  } catch (error) {
    console.error(`Supabase REST failed for table '${tableName}':`, error.message);
    throw error;
  }
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
