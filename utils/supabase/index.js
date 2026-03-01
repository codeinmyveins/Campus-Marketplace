require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
    process.env.STORAGE_URL,
    process.env.SUPABASE_SECRET_KEY
);


module.exports = supabase;
