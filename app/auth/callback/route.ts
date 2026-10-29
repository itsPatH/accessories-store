import { NextResponse, type NextRequest } from "next/server";

import { getSafeRedirectPath } from "@/lib/safe-redirect";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// Email confirmation link target: exchanges the PKCE code for a session cookie.
export const GET = async (request: NextRequest): Promise<NextResponse> => {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = getSafeRedirectPath(searchParams.get("next"), "/dashboard");

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL(next, origin));
    }
    console.error("exchangeCodeForSession failed", error.code, error.message);
  }

  return NextResponse.redirect(new URL("/login?error=confirmation_failed", origin));
};
