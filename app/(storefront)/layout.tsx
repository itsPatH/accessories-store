import Link from "next/link";
import { LayoutDashboard, Search } from "lucide-react";
import { Suspense } from "react";

import { Logo } from "@/components/brand/logo";
import { MainNav, NavLinks } from "@/components/storefront/main-nav";
import { SiteFooter } from "@/components/storefront/site-footer";
import { getCurrentUser } from "@/lib/auth";

// Pages own their width: the home hero is full-bleed, the rest use a max-w-6xl container.
export default function StorefrontLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-navy">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
          <Logo />
          <div className="hidden md:block">
            <ActiveNav />
          </div>
          <div className="flex items-center gap-1">
            <Link
              href="/catalogo"
              aria-label="Buscar productos"
              className="rounded-full p-2 text-white/85 transition-colors hover:bg-white/10 hover:text-white"
            >
              <Search className="size-5" />
            </Link>
            {/* No public sign-in link: only the store owner signs in, from /login. */}
            <Suspense>
              <DashboardLink />
            </Suspense>
          </div>
        </div>
        <div className="flex justify-center pb-2 md:hidden">
          <ActiveNav />
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}

const ActiveNav = () => (
  <Suspense fallback={<NavLinks activePath={null} />}>
    <MainNav />
  </Suspense>
);

const DashboardLink = async () => {
  const user = await getCurrentUser();
  if (!user) return null;

  return (
    <Link
      href="/dashboard"
      aria-label="Mi panel"
      className="rounded-full p-2 text-white/85 transition-colors hover:bg-white/10 hover:text-white"
    >
      <LayoutDashboard className="size-5" />
    </Link>
  );
};
