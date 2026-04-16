const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Read credentials from .env
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('ERROR: SUPABASE_URL and SUPABASE_KEY not set in .env');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

console.log(`📊 Connected to Supabase: ${supabaseUrl}`);

module.exports = { supabase };
