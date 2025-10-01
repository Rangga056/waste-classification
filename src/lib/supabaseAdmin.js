// src/lib/supabaseAdmin.js
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error(
    "Missing Supabase URL or Service Key. Make sure SUPABASE_SERVICE_KEY is set in your .env file."
  );
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
