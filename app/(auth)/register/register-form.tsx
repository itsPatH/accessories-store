"use client";

import { MailCheck } from "lucide-react";
import { useActionState } from "react";

import { FormAlert } from "@/components/form-alert";
import { FormField } from "@/components/form-field";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type { Result } from "@/lib/result";

import { signUp, type SignUpSuccess } from "../actions";

const INITIAL_STATE: Result<SignUpSuccess> = { data: null, error: null };

export const RegisterForm = () => {
  const [state, formAction, isPending] = useActionState(signUp, INITIAL_STATE);

  if (state.data) {
    return (
      <Alert>
        <MailCheck />
        <AlertTitle>Revisa tu email</AlertTitle>
        <AlertDescription>
          Enviamos un enlace de confirmación a {state.data.email}. Ábrelo en este navegador para activar tu cuenta.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <form action={formAction} className="grid gap-4">
      <FormAlert message={state.error} />
      <FormField
        name="displayName"
        label="Nombre"
        autoComplete="name"
        required
        errors={state.fieldErrors?.displayName}
      />
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
        autoComplete="new-password"
        minLength={8}
        required
        errors={state.fieldErrors?.password}
      />

      <Button type="submit" disabled={isPending}>
        {isPending ? "Creando cuenta…" : "Crear cuenta"}
      </Button>
    </form>
  );
};
