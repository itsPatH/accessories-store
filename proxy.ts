import { NextResponse, type NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/proxy";

const PROTECTED_PREFIX = "/dashboard";
const GUEST_ONLY_PATHS = ["/login", "/register"];

// Copies refreshed auth cookies onto a redirect so the session is not lost.
const redirectWithCookies = (
  request: NextRequest,
  sessionResponse: NextResponse,
  pathname: string,
  searchParams?: Record<string, string>,
): NextResponse => {
  const target = request.nextUrl.clone();
  target.pathname = pathname;
  target.search = new URLSearchParams(searchParams).toString();

  const redirect = NextResponse.redirect(target);
  sessionResponse.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
  return redirect;
};

// Optimistic checks only. Pages and Server Actions re-verify the user (.specs/03-auth-flow.md §4).
export const proxy = async (request: NextRequest): Promise<NextResponse> => {
  const { response, userId } = await updateSession(request);
  const { pathname, search } = request.nextUrl;

  if (!userId && pathname.startsWith(PROTECTED_PREFIX)) {
    return redirectWithCookies(request, response, "/login", { next: `${pathname}${search}` });
  }

  if (userId && GUEST_ONLY_PATHS.includes(pathname)) {
    return redirectWithCookies(request, response, "/dashboard");
  }

  return response;
};

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
