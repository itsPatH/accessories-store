"use server";

import { z } from "zod";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";
import { fail, type Result } from "@/lib/result";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { becomeMerchantSchema } from "@/lib/validation/auth";

const UNIQUE_VIOLATION = "23505";
const STORE_NAME_TAKEN = "Ese nombre de tienda ya está en uso";

export const becomeMerchant = async (
  _previousState: Result<null>,
  formData: FormData,
): Promise<Result<null>> => {
  const user = await getCurrentUser();
  if (!user) return fail("Debes iniciar sesión");

  const parsed = becomeMerchantSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return fail("Revisa los campos marcados", z.flattenError(parsed.error).fieldErrors);
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("become_merchant", { p_store_name: parsed.data.storeName });

  if (error) {
    if (error.code === UNIQUE_VIOLATION) {
      return fail(STORE_NAME_TAKEN, { storeName: [STORE_NAME_TAKEN] });
    }
    console.error("become_merchant failed", error.code, error.message);
    return fail("No pudimos activar tu tienda. Inténtalo de nuevo.");
  }

  redirect("/dashboard");
};
