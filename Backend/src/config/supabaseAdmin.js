const { createClient } = require('@supabase/supabase-js');
const { validateEnv } = require('./env');

const env = validateEnv();

if (!env.SUPABASE_URL) {
  // Allow process to boot; repositories should fail gracefully when called.
  require('../utils/logger').warn('[supabaseAdmin] SUPABASE_URL is missing. Supabase admin client is not initialized.');
}

const supabaseAdmin = env.SUPABASE_URL
  ? createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  : null;

function getSupabaseAdmin() {
  if (!supabaseAdmin) {
    throw new Error('Supabase admin client is not initialized. Check SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY.');
  }
  return supabaseAdmin;
}

module.exports = {
  getSupabaseAdmin,
};

