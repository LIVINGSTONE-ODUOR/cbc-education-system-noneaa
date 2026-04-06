const { createClient } = require('@supabase/supabase-js');

// Supabase credentials - using environment variables with fallback to default values
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('SUPABASE_URL and SUPABASE_ANON_KEY/SUPABASE_SERVICE_ROLE_KEY required in .env');
}

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;
