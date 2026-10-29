"use server";

import { refresh, updateTag } from "next/cache";
import { z } from "zod";

import { getMerchantSession } from "@/lib/auth";
import { STORES_CACHE_TAG } from "@/lib/products/queries";
import { fail, ok, type Result } from "@/lib/result";
import { toUserMessage } from "@/lib/supabase/errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { storeProfileSchema } from "@/lib/validation/product";

const UNIQUE_VIOLATION = "23505";
const STORE_NAME_TAKEN = "Ese nombre de tienda ya está en uso";

export const updateStoreProfile = async (
  _previousState: Result<null>,
  formData: FormData,
): Promise<Result<null>> => {
  const session = await getMerchantSession();
  if (!session) return fail("No autorizado");

  const parsed = storeProfileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return fail("Revisa los campos marcados", z.flattenError(parsed.error).fieldErrors);
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: parsed.data.displayName || null,
      store_name: parsed.data.storeName,
    })
    .eq("id", session.user.id);

  if (error) {
    if (error.code === UNIQUE_VIOLATION) return fail(STORE_NAME_TAKEN, { storeName: [STORE_NAME_TAKEN] });
    return fail(toUserMessage(error, "updateStoreProfile failed"));
  }

  updateTag(STORES_CACHE_TAG);
  refresh();
  return ok(null);
};
