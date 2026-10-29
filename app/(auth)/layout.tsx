import Link from "next/link";
import { Smartphone } from "lucide-react";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 bg-muted/40 px-4 py-12">
      <Link href="/" className="flex items-center gap-2 text-lg font-semibold">
        <Smartphone className="size-5" />
        Accesorios Store
      </Link>
      <div className="w-full max-w-md">{children}</div>
    </main>
  );
}
