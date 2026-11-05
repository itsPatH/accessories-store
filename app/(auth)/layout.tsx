import Image from "next/image";
import Link from "next/link";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 bg-navy px-4 py-12">
      <Link href="/" aria-label="Guaro Cell, inicio">
        <Image src="/images/logo-badge.webp" alt="Guaro Cell" width={140} height={140} priority className="rounded-full" />
      </Link>
      <div className="w-full max-w-md">{children}</div>
    </main>
  );
}
