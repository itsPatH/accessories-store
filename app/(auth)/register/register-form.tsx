"use client";

import { MailCheck } from "lucide-react";
import { useActionState, useState } from "react";

import { FormAlert } from "@/components/form-alert";
import { FormField } from "@/components/form-field";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { Result } from "@/lib/result";

import { signUp, type SignUpSuccess } from "../actions";

type AccountType = "customer" | "merchant";

const INITIAL_STATE: Result<SignUpSuccess> = { data: null, error: null };

const ACCOUNT_TYPES: { value: AccountType; label: string; description: string }[] = [
  { value: "customer", label: "Cliente", description: "Quiero comprar accesorios" },
  { value: "merchant", label: "Vendedor", description: "Quiero publicar mis productos" },
];

const isAccountType = (value: unknown): value is AccountType =>
  value === "customer" || value === "merchant";

export const RegisterForm = () => {
  const [state, formAction, isPending] = useActionState(signUp, INITIAL_STATE);
  const [accountType, setAccountType] = useState<AccountType>("customer");

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

      <fieldset className="grid gap-2">
        <legend className="mb-2 text-sm font-medium">Tipo de cuenta</legend>
        <RadioGroup
          name="accountType"
          value={accountType}
          onValueChange={(value) => {
            if (isAccountType(value)) setAccountType(value);
          }}
        >
          {ACCOUNT_TYPES.map((option) => (
            <Label
              key={option.value}
              className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 font-normal has-data-checked:border-primary"
            >
              <RadioGroupItem value={option.value} className="mt-0.5" />
              <span className="grid gap-0.5">
                <span className="font-medium">{option.label}</span>
                <span className="text-muted-foreground">{option.description}</span>
              </span>
            </Label>
          ))}
        </RadioGroup>
      </fieldset>

      {accountType === "merchant" && (
        <FormField
          name="storeName"
          label="Nombre de la tienda"
          required
          errors={state.fieldErrors?.storeName}
        />
      )}

      <Button type="submit" disabled={isPending}>
        {isPending ? "Creando cuenta…" : "Crear cuenta"}
      </Button>
    </form>
  );
};
