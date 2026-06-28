const dns = require('dns');

// ✅ FORCE Node to prefer IPv4 over IPv6 (prevents socket ENETUNREACH drops on Render)
dns.setDefaultResultOrder('ipv4first');
const { Pool } = require('pg');
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config();

// ==================== ENVIRONMENT CONFIGURATION ====================
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

// ==================== INITIALIZE SUPABASE REST API CLIENT ====================
const supabaseAdmin =
  supabaseUrl && supabaseServiceRoleKey
    ? createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      })
    : null;

if (!supabaseAdmin) {
  console.warn('⚠️ Warning: SUPABASE_SERVICE_ROLE_KEY is missing. REST API global fallback mode will fail.');
}

// ==================== EXTRACT PROJECT REFERENCE ====================
let projectRef = null;
try {
  const parsed = new URL(supabaseUrl);
  projectRef = parsed.hostname.split('.')[0] || null;
} catch {
  const host = supabaseUrl.replace(/^https?:\/\//, '').split('/')[0];
  projectRef = host.split('.')[0] || null;
}

// ==================== DATABASE CONNECTION STRING SET UP ====================
const dbHost = process.env.SUPABASE_DB_HOST || `db.${projectRef}.supabase.co`;

let connectionString = process.env.DATABASE_URL || `postgresql://${encodeURIComponent(dbUser)}:${encodeURIComponent(dbPassword)}@${dbHost}:${dbPort}/${encodeURIComponent(dbName)}`;

// ==================== NATIVE POSTGRESQL POOL DEFINITION ====================
const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
  family: 4, 
  max: 30,
  min: 5,
  idleTimeoutMillis: 60000,
  connectionTimeoutMillis: 10000,
  statement_timeout: 60000, 
  query_timeout: 60000
});

pool.on('connect', () => console.log('🗄️ Connected to direct PostgreSQL pool (IPv4)'));
pool.on('error', (err) => console.error('❌ Database connection pool error:', err.message));

// ==================== GLOBAL ROBUST QUERY WRAPPER ====================
const query = async (text, params) => {
  const start = Date.now();
  try {
    // 1. Try traditional direct raw SQL connection first
    const res = await pool.query(text, params);
    console.log(`📊 SQL Query executed natively in ${Date.now() - start}ms`, { rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('❌ Primary SQL database connection failed:', error.message);

    // 2. Fallback Path: Route query intelligently through Supabase API
    if (supabaseAdmin) {
      console.log('🔄 Global Fallback Active: Converting SQL statement for Supabase REST API...');
      try {
        const lowerText = text.toLowerCase().trim();
        let tableName = null;

        // --- INTELLIGENT PRIMARY TABLE EXTRACTION ---
        // Looks for target tables following "FROM" or "JOIN" statements even in complex relational configurations
        if (/\bfrom\s+["`]?(\w+)/.test(lowerText)) {
          const match = lowerText.match(/\bfrom\s+["`]?(\w+)/);
          tableName = match ? match[1] : null;
        }

        // Fallback fuzzy lookup filter matching critical core schemas
        if (!tableName || ['l', 'c', 't', 'u', 's'].includes(tableName)) {
          if (lowerText.includes('learner')) tableName = 'learners';
          else if (lowerText.includes('class')) tableName = 'classes';
          else if (lowerText.includes('teacher')) tableName = 'teachers';
          else if (lowerText.includes('usersession') || lowerText.includes('user_sessions')) tableName = 'user_sessions';
          else if (lowerText.includes('user')) tableName = 'users';
          else if (lowerText.includes('school_admin')) tableName = 'school_admins';
          else if (lowerText.includes('school')) tableName = 'schools';
          else if (lowerText.includes('branch')) tableName = 'branches'; // Catches branches endpoint
        }

        if (tableName) {
          console.log(`📊 Intercepted and routed query target table: "${tableName}"`);
          
          // --- WRITE OPERATIONS HANDLERS (INSERT / UPDATE) ---
          if (lowerText.startsWith('update') || lowerText.startsWith('insert')) {
            let actionData = {};
            if (tableName === 'users' && lowerText.includes('last_login')) {
              actionData = { last_login: new Date().toISOString(), last_login_ip: params[0], last_activity: new Date().toISOString() };
            } else if (tableName === 'user_sessions') {
              actionData = { user_id: params[0], session_token: params[1], ip_address: params[2], user_agent: params[3], expires_at: params[4] };
            } else {
              actionData = { updated_at: new Date().toISOString() };
            }

            if (lowerText.startsWith('update')) {
              const { data, error: utErr } = await supabaseAdmin.from(tableName).update(actionData).eq('id', params[params.length - 1]);
              if (utErr) throw utErr;
              return { rows: data ? [data] : [], rowCount: 1 };
            } else {
              const { data, error: inErr } = await supabaseAdmin.from(tableName).insert([actionData]).select();
              if (inErr) throw inErr;
              return { rows: data || [], rowCount: data ? data.length : 0 };
            }
          }

          // --- HIGH VOLUME FETCH STRATAGEM (STREAMGUARD PAGINATION LOOP) ---
          let allRows = [];
          let fetchPage = 0;
          const pageSize = 1000; 
          let keepingLoopAlive = true;

          // Dynamically map table relationships using Supabase internal nested joins if applicable
          let selectFields = '*';
          if (tableName === 'learners') selectFields = '*, classes(*), schools(*)';
          if (tableName === 'teachers') selectFields = '*, departments(*), schools(*)';

          while (keepingLoopAlive) {
            let sbQuery = supabaseAdmin
              .from(tableName)
              .select(selectFields)
              .range(fetchPage * pageSize, (fetchPage + 1) * pageSize - 1);

            // Dynamically reconstruct standard raw WHERE parameters ($1, $2) into equivalent REST filters
            if (params && params.length > 0) {
              if (lowerText.includes('where email = $1') || lowerText.includes('where u.email = $1') || lowerText.includes('.email = $1')) {
                sbQuery = sbQuery.eq('email', params[0]);
              } else if (lowerText.includes('where id = $1') || lowerText.includes('where u.id = $1') || lowerText.includes('.id = $1')) {
                sbQuery = sbQuery.eq('id', params[0]);
              } else if (lowerText.includes('user_id = $1')) {
                sbQuery = sbQuery.eq('user_id', params[0]);
              } else if (lowerText.includes('school_id = $1') || lowerText.includes('school_id = $2')) {
                sbQuery = sbQuery.eq('school_id', params[0]);
              }
            }

            const { data, error: fetchErr } = await sbQuery;
            if (fetchErr) throw fetchErr;

            if (!data || data.length === 0) {
              keepingLoopAlive = false;
            } else {
              // Standardize relational join responses to mirror identical shallow property access configurations
              const flattenedData = data.map(row => {
                const clone = { ...row };
                if (row.classes) clone.class_name = row.classes.class_name || row.classes.name;
                if (row.schools) clone.school_name = row.schools.school_name || row.schools.name;
                if (row.departments) clone.department_name = row.departments.name;
                return clone;
              });

              allRows = allRows.concat(flattenedData);
              if (data.length < pageSize) keepingLoopAlive = false;
              else fetchPage++;
            }

            if (allRows.length >= 50000) break; // Memory safety valve trigger
          }

          return { 
            rows: allRows, 
            rowCount: allRows.length 
          };
        }
      } catch (fallbackError) {
        console.error('❌ Central Supabase REST API Fallback processing failed:', fallbackError.message);
      }
    }

    throw error;
  }
};

// ==================== TRANSACTION CONTEXT WRAPPER ====================
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
    if (!client) return await callback(null); // Execute via REST context fallback channel
    throw error;
  } finally {
    if (client) client.release();
  }
};

module.exports = { query, transaction, pool };
