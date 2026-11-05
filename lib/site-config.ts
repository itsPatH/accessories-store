// Public store details (.specs/05-branding.md). Contact values stay null until the client
// provides them; every UI element that depends on one is hidden while it is null.
interface SiteConfig {
  name: string;
  tagline: string;
  location: string;
  // International format, digits only (e.g. "584121234567").
  whatsappNumber: string | null;
  instagramUrl: string | null;
  facebookUrl: string | null;
  tiktokUrl: string | null;
  // Credit line at the bottom of the footer.
  developer: { name: string; url: string };
}

export const SITE_CONFIG: SiteConfig = {
  name: "Guaro Cell",
  tagline: "Accesorios para tu celular, tecnología y más.",
  location: "Barquisimeto · Lara",
  whatsappNumber: "584127519145",
  // Share-tracking parameters removed from the links the client sent.
  instagramUrl: "https://www.instagram.com/guarocell1",
  facebookUrl: "https://www.facebook.com/profile.php?id=61596323247710",
  tiktokUrl: null,
  developer: { name: "Patricia Herrera", url: "https://patricia-herrera-portfolio.vercel.app/es" },
};

export const getSiteUrl = (): string => process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const getWhatsAppUrl = (message?: string): string | null => {
  if (!SITE_CONFIG.whatsappNumber) return null;
  const url = `https://wa.me/${SITE_CONFIG.whatsappNumber}`;
  // encodeURIComponent (%20) instead of URLSearchParams (+): some WhatsApp clients show "+" literally.
  return message ? `${url}?text=${encodeURIComponent(message)}` : url;
};
