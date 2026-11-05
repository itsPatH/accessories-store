"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Inicio" },
  { href: "/catalogo", label: "Catálogo" },
] as const;

// Hook-free version: also the Suspense fallback, since usePathname() is request-time data on dynamic routes.
export const NavLinks = ({ activePath }: { activePath: string | null }) => (
  <nav aria-label="Principal" className="flex items-center gap-1 text-sm font-semibold">
    {NAV_ITEMS.map((item) => {
      const isActive = item.href === activePath;
      return (
        <Link
          key={item.href}
          href={item.href}
          aria-current={isActive ? "page" : undefined}
          className={cn(
            "rounded-full px-4 py-1.5 text-white/85 transition-colors hover:text-white",
            isActive && "bg-linear-to-r from-brand to-brand-strong text-white",
          )}
        >
          {item.label}
        </Link>
      );
    })}
  </nav>
);

export const MainNav = () => <NavLinks activePath={usePathname()} />;
