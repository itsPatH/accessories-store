import Link from "next/link";
import { LogOut } from "lucide-react";
import { Suspense, type ReactNode } from "react";

import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { getCurrentProfile, requireUser } from "@/lib/auth";

import { signOut } from "../(auth)/actions";

export default function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  return (
    <div className="flex flex-1 flex-col">
      {/* The session is request-time data, so everything that reads it streams behind Suspense. */}
      <Suspense fallback={<DashboardSkeleton />}>
        <AuthenticatedShell>{children}</AuthenticatedShell>
      </Suspense>
    </div>
  );
}

const AuthenticatedShell = async ({ children }: { children: ReactNode }) => {
  const user = await requireUser();
  const profile = await getCurrentProfile();
  const accountLabel = profile?.store_name ?? profile?.display_name ?? user.email;

  return (
    <>
      <header className="bg-navy text-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
          <div className="flex items-center gap-4">
            <Logo />
            <Link href="/dashboard" className="hidden text-sm font-semibold text-white/80 hover:text-white sm:inline">
              Panel de vendedor
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-white/70 sm:inline">{accountLabel}</span>
            <form action={signOut}>
              <Button type="submit" variant="ghost" size="sm" className="text-white hover:bg-white/10 hover:text-white">
                <LogOut />
                Salir
              </Button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
    </>
  );
};

const DashboardSkeleton = () => (
  <div className="mx-auto w-full max-w-6xl px-4 py-8">
    <div className="h-8 w-48 animate-pulse rounded-md bg-muted" />
  </div>
);
