import Link from "next/link";
import { Smartphone } from "lucide-react";
import { Suspense } from "react";

import { buttonVariants } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth";

export default function StorefrontLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <Smartphone className="size-5" />
            Accesorios Store
          </Link>
          {/* The account link reads the session; the rest of the header stays in the static shell. */}
          <Suspense fallback={<div className="h-8 w-24" />}>
            <AccountLink />
          </Suspense>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
    </div>
  );
}

const AccountLink = async () => {
  const user = await getCurrentUser();

  return user ? (
    <Link href="/dashboard" className={buttonVariants({ variant: "outline", size: "sm" })}>
      Mi panel
    </Link>
  ) : (
    <div className="flex gap-2">
      <Link href="/login" className={buttonVariants({ variant: "ghost", size: "sm" })}>
        Ingresar
      </Link>
      <Link href="/register" className={buttonVariants({ size: "sm" })}>
        Vender aquí
      </Link>
    </div>
  );
};
