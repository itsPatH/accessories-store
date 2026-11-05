// Public store details (.specs/05-branding.md). Contact values stay null until the client
// provides them; every UI element that depends on one is hidden while it is null.
interface SiteConfig {
  name: string;
  tagline: string;
  location: string;
  // International format, digits only (e.g. "584121234567").
  whatsappNumber: string | null;
  instagramUrl: string | null;
  tiktokUrl: string | null;
}

export const SITE_CONFIG: SiteConfig = {
  name: "Guaro Cell",
  tagline: "Celulares, accesorios, tecnología y más.",
  location: "Barquisimeto · Lara",
  whatsappNumber: null,
  instagramUrl: null,
  tiktokUrl: null,
};

export const getSiteUrl = (): string => process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const getWhatsAppUrl = (message?: string): string | null => {
  if (!SITE_CONFIG.whatsappNumber) return null;
  const url = new URL(`https://wa.me/${SITE_CONFIG.whatsappNumber}`);
  if (message) url.searchParams.set("text", message);
  return url.toString();
};
