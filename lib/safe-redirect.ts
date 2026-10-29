// Only same-origin relative paths are allowed, preventing open redirects (e.g. "//evil.com").
export const getSafeRedirectPath = (
  value: string | null | undefined,
  fallback: string,
): string => {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) {
    return fallback;
  }
  return value;
};
