// Escapes user input used inside LIKE/ILIKE patterns so "%" and "_" match literally.
export const escapeLikePattern = (value: string): string =>
  value.replace(/[\\%_]/g, (match) => `\\${match}`);
