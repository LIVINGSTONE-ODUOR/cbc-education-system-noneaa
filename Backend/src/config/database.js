const dns = require('dns');

// ✅ FORCE Node to prefer IPv4 over IPv6
dns.setDefaultResultOrder('ipv4first');
const { Pool } = require('pg');
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config();

// ==================== ENV CONFIG ====================
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const dbPassword = process.env.SUPABASE_DB_PASSWORD || null;
const dbUser = process.env.SUPABASE_DB_USER || 'postgres';
const dbName = process.env.SUPABASE_DB_NAME || 'postgres';
const dbPort = Number.parseInt(process.env.SUPABASE_DB_PORT || '5432', 10);

if (!supabaseUrl) {
  console.error('❌ Missing SUPABASE_URL in environment.');
  process.exit(1);
}

// ==================== INITIALIZE SUPABASE ADMIN FALLBACK CLIENT ====================
const supabaseAdmin =
  supabaseUrl && supabaseServiceRoleKey
    ? createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      })
    : null;

if (!supabaseAdmin) {
  console.warn('⚠️ Warning: SUPABASE_SERVICE_ROLE_KEY missing. API fallback mode will be unavailable.');
}

if (!process.env.DATABASE_URL && !dbPassword) {
  console.error(
    "[database] Missing DATABASE_URL (postgresql://...) or SUPABASE_DB_PASSWORD. Supabase anon/service-role keys are not DB credentials; pg connection will fail."
  );
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
  connectionString = process.env.DATABASE_URL;
  console.log('🔗 Using DATABASE_URL from environment');
} else {
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
  family: 4, // ✅ CRITICAL FIX → FORCE IPv4 (fixes ENETUNREACH)
  max: 30,
  min: 5,
  idleTimeoutMillis: 60000,
  connectionTimeoutMillis: 10000,
  statement_timeout: 30000,
  query_timeout: 30000
});

// ==================== EVENTS ====================
pool.on('connect', () => {
  console.log('🗄️ Connected to database (IPv4)');
});

pool.on('error', (err) => {
  console.error('❌ Database connection pool error:', err.message);
});

// ==================== GLOBAL ROBUST QUERY WRAPPER ====================
const query = async (text, params) => {
  const start = Date.now();
  try {
    // 1. Primary path: run the raw standard PostgreSQL operation
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log(`📊 Query executed in ${duration}ms`, { rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('❌ Database query error caught:', error.message);

    // 2. Fallback path: automatically swap to the Supabase Client REST API if PostgreSQL fails
    if (supabaseAdmin) {
      console.log('🔄 Global Database Fallback: Routing data query through Supabase REST API...');
      try {
        const lowerText = text.toLowerCase().trim();
        let tableName = null;

        // Parse query string to extract table targets
        if (lowerText.includes('from users')) tableName = 'users';
        else if (lowerText.includes('from learners')) tableName = 'learners';
        else if (lowerText.includes('from classes')) tableName = 'classes';
        else if (lowerText.includes('from teachers')) tableName = 'teachers';
        else if (lowerText.includes('from user_sessions')) tableName = 'user_sessions';
        else if (lowerText.includes('from school_admins')) tableName = 'school_admins';

        if (tableName) {
          console.log(`📊 Intercepted route target table: "${tableName}"`);
          
          // Separate logic for write operations versus read operations
          if (lowerText.startsWith('update')) {
            let updateData = {};
            if (tableName === 'users' && lowerText.includes('trusted_devices = $1')) {
              updateData = { trusted_devices: typeof params[0] === 'string' ? JSON.parse(params[0]) : params[0] };
            } else if (tableName === 'users' && lowerText.includes('last_login = now()')) {
              updateData = { last_login: new Date().toISOString(), last_login_ip: params[0], last_activity: new Date().toISOString() };
            } else if (tableName === 'user_sessions' && lowerText.includes('ip_address = $1')) {
              updateData = { ip_address: params[0], user_agent: params[1] };
            }

            const { data, error: updateErr } = await supabaseAdmin
              .from(tableName)
              .update(updateData)
              .eq(lowerText.includes('where id = $2') || lowerText.includes('where id = $3') ? 'id' : 'session_token', params[params.length - 1]);

            if (updateErr) throw updateErr;
            return { rows: data ? [data] : [], rowCount: 1 };
          }

          if (lowerText.startsWith('insert into')) {
            let insertData = {};
            if (tableName === 'user_sessions') {
              insertData = { user_id: params[0], session_token: params[1], ip_address: params[2], user_agent: params[3], expires_at: params[4] };
            }
            const { data, error: insertErr } = await supabaseAdmin.from(tableName).insert([insertData]).select();
            if (insertErr) throw insertErr;
            return { rows: data || [], rowCount: data ? data.length : 0 };
          }

          // Default operation: SELECT requests
          let sbQuery = supabaseAdmin.from(tableName).select('*');

          // Dynamically map common WHERE filters for specific users or relations
          if (params && params.length > 0) {
            if (lowerText.includes('where u.email = $1') || lowerText.includes('where email = $1')) {
              sbQuery = sbQuery.eq('email', params[0]).neq('status', 'deleted');
            } else if (lowerText.includes('where u.id = $1') || lowerText.includes('where id = $1')) {
              sbQuery = sbQuery.eq('id', params[0]);
            } else if (lowerText.includes('where user_id = $1')) {
              sbQuery = sbQuery.eq('user_id', params[0]);
            } else if (lowerText.includes('where school_id = $2') || lowerText.includes('where school_id = $1')) {
              sbQuery = sbQuery.eq('school_id', params[0]);
            }
          }

          const { data, error: fetchErr } = await sbQuery;
          if (fetchErr) throw fetchErr;

          const rows = Array.isArray(data) ? data : data ? [data] : [];
          return { rows, rowCount: rows.length };
        }
      } catch (fallbackError) {
        console.error('❌ Central Supabase REST API Fallback failed:', fallbackError.message);
      }
    }

    // Re-throw original crash error if no appropriate fallback route was found
    throw error;
  }
};

// ==================== TRANSACTION WRAPPER ====================
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
    console.error('❌ Transaction failed, rolling back:', error.message);
    
    // Fallback logic inside a transaction block if direct connection failed completely at startup
    if (error.message.includes('authentication failed') || error.message.includes('timeout') || !client) {
      console.log('🔄 Transaction Fallback: Attempting continuous execution via Admin API Client...');
      return await callback(null);
    }
    throw error;
  } finally {
    if (client) client.release();
  }
};

// ==================== EXPORT ====================
module.exports = {
  query,
  transaction,
  pool
};
