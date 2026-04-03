const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.warn("Faltan SUPABASE_URL o SUPABASE_ANON_KEY en el environment.");
}

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;