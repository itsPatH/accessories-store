import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import type { Database } from "@/types/database";

import { getSupabaseConfig, withSecureCookieOptions } from "./config";

interface SessionUpdate {
  response: NextResponse;
  userId: string | null;
}

// Refreshes the Supabase session and writes the rotated cookies onto the response.
// The returned response must be the one sent back (or have its cookies copied).
export const updateSession = async (request: NextRequest): Promise<SessionUpdate> => {
  const { url, anonKey } = getSupabaseConfig();
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet, headers) => {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, withSecureCookieOptions(options)),
        );
        Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
      },
    },
  });

  // getUser() validates the JWT with Supabase Auth; never trust getSession() on the server.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { response, userId: user?.id ?? null };
};
