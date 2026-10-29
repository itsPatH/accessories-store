import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

import { getSupabaseConfig } from "./config";
import type { TypedSupabaseClient } from "./server";

// Cookie-less anon client for public, cacheable reads. RLS limits it to public rows.
export const createSupabasePublicClient = (): TypedSupabaseClient => {
  const { url, anonKey } = getSupabaseConfig();
  return createClient<Database>(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
};
