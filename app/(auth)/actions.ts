"use server";

import { z } from "zod";
import { redirect } from "next/navigation";

import { fail, ok, type Result } from "@/lib/result";
import { getSafeRedirectPath } from "@/lib/safe-redirect";
import { escapeLikePattern } from "@/lib/sql";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { signInSchema, signUpSchema } from "@/lib/validation/auth";

export interface SignUpSuccess {
  email: string;
}

const STORE_NAME_TAKEN = "Ese nombre de tienda ya está en uso";

const getSiteUrl = (): string => process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const signUp = async (
  _previousState: Result<SignUpSuccess>,
  formData: FormData,
): Promise<Result<SignUpSuccess>> => {
  const parsed = signUpSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return fail("Revisa los campos marcados", z.flattenError(parsed.error).fieldErrors);
  }

  const { email, password, displayName, accountType, storeName } = parsed.data;
  const supabase = await createSupabaseServerClient();

  if (accountType === "merchant" && storeName) {
    // Merchant profiles are publicly readable, so availability can be checked before sign-up.
    const { data: existingStore } = await supabase
      .from("profiles")
      .select("id")
      .ilike("store_name", escapeLikePattern(storeName))
      .maybeSingle();

    if (existingStore) {
      return fail(STORE_NAME_TAKEN, { storeName: [STORE_NAME_TAKEN] });
    }
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${getSiteUrl()}/auth/callback?next=/dashboard`,
      data: {
        display_name: displayName,
        role: accountType,
        store_name: accountType === "merchant" ? storeName : null,
      },
    },
  });

  if (error) {
    console.error("signUp failed", error.code, error.message);
    if (error.code === "weak_password") {
      return fail("La contraseña es demasiado débil", {
        password: ["La contraseña es demasiado débil"],
      });
    }
    if (error.code === "over_email_send_rate_limit") {
      return fail("Demasiados intentos. Espera unos minutos e inténtalo de nuevo.");
    }
    return fail("No pudimos crear tu cuenta. Inténtalo de nuevo.");
  }

  // Email confirmation disabled in Supabase: the user is already signed in.
  if (data.session) {
    redirect("/dashboard");
  }

  return ok({ email });
};

export const signIn = async (
  _previousState: Result<null>,
  formData: FormData,
): Promise<Result<null>> => {
  const parsed = signInSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return fail("Revisa los campos marcados", z.flattenError(parsed.error).fieldErrors);
  }

  const { email, password, next } = parsed.data;
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    if (error.code === "email_not_confirmed") {
      return fail("Confirma tu email antes de iniciar sesión.");
    }
    // Generic message on purpose: do not reveal whether the email exists.
    return fail("Email o contraseña incorrectos");
  }

  redirect(getSafeRedirectPath(next, "/dashboard"));
};

export const signOut = async (): Promise<void> => {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/");
};
