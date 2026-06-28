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

// ==================== INITIALIZE SUPABASE CLIENT ====================
const supabaseAdmin =
  supabaseUrl && supabaseServiceRoleKey
    ? createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      })
    : null;

// ==================== CONNECTION STRING ====================
let projectRef = null;
try {
  projectRef = new URL(supabaseUrl).hostname.split('.')[0];
} catch {
  projectRef = 'postgres';
}
const dbHost = process.env.SUPABASE_DB_HOST || `db.${projectRef}.supabase.co`;
let connectionString = process.env.DATABASE_URL || `postgresql://${encodeURIComponent(dbUser)}:${encodeURIComponent(dbPassword)}@${dbHost}:${dbPort}/${encodeURIComponent(dbName)}`;

// ==================== POOL CONFIG ====================
const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
  family: 4, 
  max: 30,
  min: 5,
  idleTimeoutMillis: 60000,
  connectionTimeoutMillis: 10000,
  statement_timeout: 60000, // 1 minute allowed for large sweeps
  query_timeout: 60000
});

// ==================== GLOBAL QUERY WRAPPER ====================
const query = async (text, params) => {
  const start = Date.now();
  try {
    // 1. Try standard SQL query path
    const res = await pool.query(text, params);
    console.log(`📊 SQL executed in ${Date.now() - start}ms`, { rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('❌ Database query error caught:', error.message);

    // 2. Fallback path via API Client if direct DB fails
    if (supabaseAdmin) {
      console.log('🔄 Global Database Fallback: Routing data query through Supabase REST API...');
      try {
        const lowerText = text.toLowerCase().trim();
        let tableName = null;

        if (lowerText.includes('from users')) tableName = 'users';
        else if (lowerText.includes('from learners')) tableName = 'learners';
        else if (lowerText.includes('from classes')) tableName = 'classes';
        else if (lowerText.includes('from teachers')) tableName = 'teachers';
        else if (lowerText.includes('from user_sessions')) tableName = 'user_sessions';

        if (tableName) {
          // --- WRITE OPERATIONS HANDLERS ---
          if (lowerText.startsWith('update')) {
            let updateData = {};
            if (tableName === 'users' && lowerText.includes('last_login = now()')) {
              updateData = { last_login: new Date().toISOString() };
            }
            const { data, error: updateErr } = await supabaseAdmin
              .from(tableName)
              .update(updateData)
              .eq('id', params[params.length - 1]);
            if (updateErr) throw updateErr;
            return { rows: data ? [data] : [], rowCount: 1 };
          }

          if (lowerText.startsWith('insert into')) {
            let insertData = {};
            if (tableName === 'user_sessions') {
              insertData = { user_id: params[0], session_token: params[1], expires_at: params[4] };
            }
            const { data, error: insertErr } = await supabaseAdmin.from(tableName).insert([insertData]).select();
            if (insertErr) throw insertErr;
            return { rows: data || [], rowCount: data ? data.length : 0 };
          }

          // --- UNCONSTRAINED FETCH MODE WITH STREAMGUARD ---
          let allRows = [];
          let fetchPage = 0;
          const pageSize = 1000; // Large chunk compilation size to optimize transit traffic
          let keepingLoopAlive = true;

          while (keepingLoopAlive) {
            let sbQuery = supabaseAdmin
              .from(tableName)
              .select('*')
              .range(fetchPage * pageSize, (fetchPage + 1) * pageSize - 1);

            // Apply specific parameter where logic
            if (params && params.length > 0) {
              if (lowerText.includes('where email = $1')) {
                sbQuery = sbQuery.eq('email', params[0]);
              } else if (lowerText.includes('where id = $1')) {
                sbQuery = sbQuery.eq('id', params[0]);
              } else if (lowerText.includes('school_id =')) {
                sbQuery = sbQuery.eq('school_id', params[0]);
              }
            }

            const { data, error: fetchErr } = await sbQuery;
            if (fetchErr) throw fetchErr;

            if (!data || data.length === 0) {
              keepingLoopAlive = false;
            } else {
              allRows = allRows.concat(data);
              // If we pulled fewer records than the chunk size, we've hit the end of the table
              if (data.length < pageSize) {
                keepingLoopAlive = false;
              } else {
                fetchPage++;
              }
            }

            // Production Circuit Breaker: Safety check to avoid infinite loops if data gets too massive
            if (allRows.length >= 50000) {
              console.warn('⚠️ Safety Circuit Breaker triggered: Stopped loading at 50,000 items to protect server memory.');
              break;
            }
          }

          return { 
            rows: allRows, 
            rowCount: allRows.length 
          };
        }
      } catch (fallbackError) {
        console.error('❌ Central Supabase REST API Fallback failed:', fallbackError.message);
      }
    }
    throw error;
  }
};

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
    if (!client) return await callback(null);
    throw error;
  } finally {
    if (client) client.release();
  }
};

module.exports = { query, transaction, pool };
