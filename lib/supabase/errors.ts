interface DatabaseError {
  code?: string;
  message: string;
}

const DATABASE_ERROR_MESSAGES: Record<string, string> = {
  "23505": "Ya existe un registro con ese valor",
  "23514": "Algunos datos no son válidos",
  "22023": "Algunos datos no son válidos",
  "42501": "No tienes permiso para realizar esta acción",
};

// Logs the raw error server-side and returns a user-friendly message.
export const toUserMessage = (error: DatabaseError, context: string): string => {
  console.error(context, error.code, error.message);
  return (error.code && DATABASE_ERROR_MESSAGES[error.code]) || "Ocurrió un error. Inténtalo de nuevo.";
};
