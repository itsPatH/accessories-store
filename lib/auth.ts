import "server-only";

import type { User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { cache } from "react";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/database";

interface MerchantSession {
  user: User;
  profile: Profile;
}

// Memoized per request so layouts, pages and actions share one Auth round trip.
export const getCurrentUser = cache(async (): Promise<User | null> => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

export const getCurrentProfile = cache(async (): Promise<Profile | null> => {
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  return data;
});

export const requireUser = async (): Promise<User> => {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
};

// For Server Actions: returns null instead of redirecting so the action can return a Result.
export const getMerchantSession = async (): Promise<MerchantSession | null> => {
  const user = await getCurrentUser();
  if (!user) return null;
  const profile = await getCurrentProfile();
  if (profile?.role !== "merchant") return null;
  return { user, profile };
};

// For pages: customers are sent to onboarding instead of seeing merchant UI.
export const requireMerchant = async (): Promise<MerchantSession> => {
  const user = await requireUser();
  const profile = await getCurrentProfile();
  if (profile?.role !== "merchant") redirect("/dashboard/onboarding");
  return { user, profile };
};
