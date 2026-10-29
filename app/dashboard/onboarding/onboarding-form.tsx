"use client";

import { useActionState } from "react";

import { FormAlert } from "@/components/form-alert";
import { FormField } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import type { Result } from "@/lib/result";

import { becomeMerchant } from "./actions";

const INITIAL_STATE: Result<null> = { data: null, error: null };

export const OnboardingForm = () => {
  const [state, formAction, isPending] = useActionState(becomeMerchant, INITIAL_STATE);

  return (
    <form action={formAction} className="grid gap-4">
      <FormAlert message={state.error} />
      <FormField
        name="storeName"
        label="Nombre de la tienda"
        minLength={2}
        maxLength={80}
        required
        errors={state.fieldErrors?.storeName}
      />
      <Button type="submit" disabled={isPending}>
        {isPending ? "Activando…" : "Activar mi tienda"}
      </Button>
    </form>
  );
};
