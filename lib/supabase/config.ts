import type { CookieOptions } from "@supabase/ssr";

interface SupabaseConfig {
  url: string;
  anonKey: string;
}

// Values shipped in .env.example; seeing them means .env.local was copied but never filled in.
const EXAMPLE_VALUES = ["your-project-ref", "your-anon-or-publishable-key"];
const ENV_HELP = "Fill .env.local with the values from Supabase → Project Settings → API, then restart `pnpm dev`.";

const isServiceRoleKey = (key: string): boolean => {
  if (key.startsWith("sb_secret_")) return true;
  const payload = key.split(".")[1];
  if (!payload) return false;
  try {
    const claims: unknown = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    return typeof claims === "object" && claims !== null && "role" in claims && claims.role === "service_role";
  } catch {
    return false;
  }
};

const assertValidSupabaseEnv = (url: string, anonKey: string): void => {
  if (EXAMPLE_VALUES.some((example) => url.includes(example) || anonKey.includes(example))) {
    throw new Error(`.env.local still has the example values from .env.example. ${ENV_HELP}`);
  }

  if (!URL.canParse(url) || !url.startsWith("https://")) {
    throw new Error(`NEXT_PUBLIC_SUPABASE_URL must look like https://<project-ref>.supabase.co. ${ENV_HELP}`);
  }

  // supabase-js appends /rest/v1, /auth/v1 and /storage/v1 itself.
  if (new URL(url).pathname !== "/") {
    throw new Error(
      `NEXT_PUBLIC_SUPABASE_URL must be the project root without a path (remove "${new URL(url).pathname}"). ${ENV_HELP}`,
    );
  }

  // NEXT_PUBLIC_* values reach the browser: a service role key there bypasses RLS for everyone.
  if (isServiceRoleKey(anonKey)) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY is a service_role/secret key. Use the anon (or publishable) key instead and rotate the exposed secret.",
    );
  }
};

export const getSupabaseConfig = (): SupabaseConfig => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!url || !anonKey) {
    throw new Error(`Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. ${ENV_HELP}`);
  }

  assertValidSupabaseEnv(url, anonKey);
  return { url, anonKey };
};

// Auth cookies are never readable by browser JavaScript (.specs/03-auth-flow.md §1).
export const withSecureCookieOptions = (options: CookieOptions): CookieOptions => ({
  ...options,
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
});
