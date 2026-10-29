"use client";

import { useSearchParams } from "next/navigation";
import { useActionState } from "react";

import { FormAlert } from "@/components/form-alert";
import { FormField } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import type { Result } from "@/lib/result";

import { signIn } from "../actions";

const INITIAL_STATE: Result<null> = { data: null, error: null };

const CALLBACK_ERRORS: Record<string, string> = {
  confirmation_failed: "El enlace de confirmación no es válido o expiró.",
};

export const LoginForm = () => {
  const searchParams = useSearchParams();
  const [state, formAction, isPending] = useActionState(signIn, INITIAL_STATE);

  const callbackError = CALLBACK_ERRORS[searchParams.get("error") ?? ""] ?? null;

  return (
    <form action={formAction} className="grid gap-4">
      <FormAlert message={state.error ?? callbackError} />
      <input type="hidden" name="next" value={searchParams.get("next") ?? ""} />
      <FormField
        name="email"
        label="Email"
        type="email"
        autoComplete="email"
        required
        errors={state.fieldErrors?.email}
      />
      <FormField
        name="password"
        label="Contraseña"
        type="password"
        autoComplete="current-password"
        required
        errors={state.fieldErrors?.password}
      />
      <Button type="submit" disabled={isPending}>
        {isPending ? "Ingresando…" : "Iniciar sesión"}
      </Button>
    </form>
  );
};
