import type { ComponentProps } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface FormFieldProps extends ComponentProps<typeof Input> {
  name: string;
  label: string;
  errors?: string[];
}

export const FormField = ({ name, label, errors, ...inputProps }: FormFieldProps) => {
  const errorId = `${name}-error`;
  const hasError = Boolean(errors?.length);

  return (
    <div className="grid gap-2">
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        name={name}
        aria-invalid={hasError}
        aria-describedby={hasError ? errorId : undefined}
        {...inputProps}
      />
      {hasError && (
        <p id={errorId} className="text-sm text-destructive">
          {errors?.[0]}
        </p>
      )}
    </div>
  );
};
