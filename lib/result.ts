export type FieldErrors = Partial<Record<string, string[]>>;

// Structured Server Action result (CLAUDE.md "Error Handling").
export interface Result<T> {
  data: T | null;
  error: string | null;
  fieldErrors?: FieldErrors;
}

export const ok = <T>(data: T): Result<T> => ({ data, error: null });

export const fail = <T>(error: string, fieldErrors?: FieldErrors): Result<T> => ({
  data: null,
  error,
  fieldErrors,
});
