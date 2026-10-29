import "server-only";

import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

import type { Database } from "@/types/database";

import { getSupabaseConfig, withSecureCookieOptions } from "./config";

export type TypedSupabaseClient = SupabaseClient<Database>;

// One client per request: it carries the user's session, so RLS always applies.
export const createSupabaseServerClient = async (): Promise<TypedSupabaseClient> => {
  const cookieStore = await cookies();
  const { url, anonKey } = getSupabaseConfig();

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, withSecureCookieOptions(options)),
          );
        } catch {
          // Called from a Server Component, where cookies are read-only.
          // proxy.ts already refreshed the session for this request.
        }
      },
    },
  });
};
