"use client";

import { CircleCheck } from "lucide-react";
import { startTransition, useActionState, type FormEvent } from "react";

import { FormAlert } from "@/components/form-alert";
import { FormField } from "@/components/form-field";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type { Result } from "@/lib/result";
import type { Profile } from "@/types/database";

import { updateStoreProfile } from "./actions";

const INITIAL_STATE: Result<null> = { data: null, error: null };

interface SettingsFormProps {
  profile: Profile;
}

export const SettingsForm = ({ profile }: SettingsFormProps) => {
  const [state, formAction, isPending] = useActionState(updateStoreProfile, INITIAL_STATE);
  const isSaved = !isPending && state.error === null && state !== INITIAL_STATE;

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => formAction(formData));
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <FormAlert message={state.error} />
      {isSaved && (
        <Alert>
          <CircleCheck />
          <AlertDescription>Cambios guardados.</AlertDescription>
        </Alert>
      )}
      <FormField
        name="storeName"
        label="Nombre de la tienda"
        defaultValue={profile.store_name ?? ""}
        minLength={2}
        maxLength={80}
        required
        errors={state.fieldErrors?.storeName}
      />
      <FormField
        name="displayName"
        label="Tu nombre (público)"
        defaultValue={profile.display_name ?? ""}
        maxLength={80}
        errors={state.fieldErrors?.displayName}
      />
      <Button type="submit" disabled={isPending} className="w-fit">
        {isPending ? "Guardando…" : "Guardar cambios"}
      </Button>
    </form>
  );
};
