import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Server-side client (uses service key to bypass RLS)
export function getSupabaseAdmin() {
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("SUPABASE_URL or SUPABASE_SERVICE_KEY not set");
  }
  return createClient(supabaseUrl, supabaseServiceKey);
}

// Public client (anon key, respects RLS)
export function getSupabasePublic() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY not set");
  }
  return createClient(supabaseUrl, supabaseAnonKey);
}
