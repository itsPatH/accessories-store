import { Headset, MapPin, ShieldCheck, Truck, type LucideIcon } from "lucide-react";
import { cacheLife } from "next/cache";
import type { ComponentType } from "react";

import { Logo } from "@/components/brand/logo";
import { InstagramIcon, TikTokIcon, WhatsAppIcon } from "@/components/brand/social-icons";
import { getWhatsAppUrl, SITE_CONFIG } from "@/lib/site-config";

const FEATURES: { icon: LucideIcon; label: string }[] = [
  { icon: Truck, label: "Delivery" },
  { icon: ShieldCheck, label: "Compra segura" },
  { icon: Headset, label: "Atención personalizada" },
];

interface SocialLink {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
}

const getSocialLinks = (): SocialLink[] => {
  const whatsappUrl = getWhatsAppUrl();
  const links: (SocialLink | null)[] = [
    SITE_CONFIG.instagramUrl ? { href: SITE_CONFIG.instagramUrl, label: "Instagram", icon: InstagramIcon } : null,
    SITE_CONFIG.tiktokUrl ? { href: SITE_CONFIG.tiktokUrl, label: "TikTok", icon: TikTokIcon } : null,
    whatsappUrl ? { href: whatsappUrl, label: "WhatsApp", icon: WhatsAppIcon } : null,
  ];
  return links.filter((link) => link !== null);
};

export const SiteFooter = () => {
  const socialLinks = getSocialLinks();

  return (
    <footer id="contacto" className="relative overflow-hidden bg-navy text-white">
      {/* Decorative glow, echoes the hero. */}
      <div aria-hidden className="pointer-events-none absolute -right-24 -bottom-32 size-80 rounded-full bg-brand-strong/30 blur-3xl" />

      <div className="relative mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-[1.3fr_1fr_1.6fr] md:items-center md:divide-x md:divide-white/15">
        <div className="grid gap-2">
          <Logo />
          <p className="text-sm text-white/70">{SITE_CONFIG.tagline}</p>
        </div>

        <div className="grid gap-4 md:px-8">
          <p className="flex items-center gap-2 text-sm">
            <MapPin className="size-5 text-brand" />
            {SITE_CONFIG.location}
          </p>
          {socialLinks.length > 0 && (
            <ul className="flex gap-4">
              {socialLinks.map(({ href, label, icon: Icon }) => (
                <li key={label}>
                  <a href={href} target="_blank" rel="noopener noreferrer" aria-label={label} className="text-white/85 hover:text-brand">
                    <Icon className="size-6" />
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

        <ul className="grid grid-cols-3 gap-4 md:pl-8">
          {FEATURES.map(({ icon: Icon, label }) => (
            <li key={label} className="grid justify-items-center gap-2 text-center text-sm">
              <Icon className="size-7 text-brand" />
              {label}
            </li>
          ))}
        </ul>
      </div>

      <div className="relative border-t border-white/10 py-4 text-center text-xs text-white/60">
        © <CopyrightYear /> {SITE_CONFIG.name}. Todos los derechos reservados.
      </div>
    </footer>
  );
};

// Cached so the static shell can include the year without reading the clock at request time.
const CopyrightYear = async () => {
  "use cache";
  cacheLife("days");
  return <>{new Date().getFullYear()}</>;
};
