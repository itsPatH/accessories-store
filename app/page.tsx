import Link from "next/link";
import { Smartphone } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";

// Placeholder until the public storefront from .specs/04-products-crud.md is built.
export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-24 text-center">
      <Smartphone className="size-10" />
      <h1 className="text-3xl font-semibold tracking-tight">Accesorios Store</h1>
      <p className="max-w-md text-muted-foreground">
        Fundas, cargadores, cables y más, publicados por vendedores independientes.
      </p>
      <div className="flex gap-3">
        <Link href="/register" className={buttonVariants()}>
          Crear cuenta
        </Link>
        <Link href="/login" className={buttonVariants({ variant: "outline" })}>
          Iniciar sesión
        </Link>
      </div>
    </main>
  );
}
