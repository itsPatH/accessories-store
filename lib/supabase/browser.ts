import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

import type { TypedSupabaseClient } from "./server";

let uploadClient: TypedSupabaseClient | null = null;

// Session-less client used ONLY for uploadToSignedUrl (.specs/03-auth-flow.md §2).
// The signed token authorizes the upload; the user's session never reaches the browser.
export const getSupabaseUploadClient = (): TypedSupabaseClient => {
  uploadClient ??= createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  return uploadClient;
};
