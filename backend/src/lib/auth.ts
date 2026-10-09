import { createClient } from "@supabase/supabase-js";

import { env } from "@/config/env.js";

export function createSupabaseAuthClient() {
  return createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}
