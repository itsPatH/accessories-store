import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ShieldCheck, Zap } from "lucide-react";
import { Suspense, type ReactNode } from "react";

import { PRODUCT_CATEGORY_ICONS } from "@/components/storefront/category-icons";
import { ProductGrid, ProductGridSkeleton } from "@/components/storefront/product-card";
import { buttonVariants } from "@/components/ui/button";
import { PRODUCT_CATEGORIES, PRODUCT_CATEGORY_LABELS } from "@/lib/products/categories";
import { getFeaturedProducts } from "@/lib/products/queries";
import { cn } from "@/lib/utils";

const FEATURED_PRODUCTS_LIMIT = 8;

export default function HomePage() {
  return (
    <>
      <Hero />
      <div className="mx-auto grid w-full max-w-6xl gap-12 px-4 py-12">
        <Section title="Compra por categoría" moreHref="/catalogo" moreLabel="Ver todas">
          <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-3 lg:grid-cols-8">
            {PRODUCT_CATEGORIES.map((category) => {
              const Icon = PRODUCT_CATEGORY_ICONS[category];
              return (
                <li key={category}>
                  <Link
                    href={`/catalogo?category=${category}`}
                    className="grid h-full justify-items-center gap-2 rounded-2xl border border-transparent bg-accent px-1.5 py-4 text-center text-xs font-semibold sm:text-sm text-navy transition-colors hover:border-brand"
                  >
                    <Icon className="size-8 text-brand-strong" strokeWidth={1.75} />
                    {PRODUCT_CATEGORY_LABELS[category]}
                  </Link>
                </li>
              );
            })}
          </ul>
        </Section>

        <Section title="Productos destacados" moreHref="/catalogo" moreLabel="Ver todos">
          {/* Cached query; Suspense keeps the rest of the page in the static shell. */}
          <Suspense fallback={<ProductGridSkeleton count={4} />}>
            <FeaturedProducts />
          </Suspense>
        </Section>
      </div>
    </>
  );
}

const Hero = () => (
  <section className="relative overflow-hidden rounded-b-[2.5rem] bg-navy text-white">
    {/* Decorative light sweeps in the brand blues. */}
    <div aria-hidden className="pointer-events-none absolute inset-0">
      <div className="absolute -top-40 -right-20 size-[36rem] rounded-full bg-brand-strong/35 blur-3xl" />
      <div className="absolute -bottom-48 left-1/3 size-[28rem] rounded-full bg-brand/20 blur-3xl" />
    </div>

    <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 md:grid-cols-[1.2fr_1fr] md:py-20">
      <div className="grid justify-items-start gap-6">
        <span className="flex items-center gap-2 rounded-full border border-brand/40 bg-white/5 px-4 py-1.5 text-sm">
          <Zap className="size-4 fill-brand text-brand" />
          Accesorios para tu celular
        </span>
        <h1 className="text-4xl leading-[1.05] font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
          Todo para tu celular.
          <span className="block bg-linear-to-r from-brand to-brand-strong bg-clip-text text-transparent">
            En un solo lugar.
          </span>
        </h1>
        <p className="text-lg text-white/80">Fundas, cargadores, cables y más, con la mejor calidad.</p>
        <div className="flex flex-wrap items-center gap-6">
          <Link
            href="/catalogo"
            className={cn(buttonVariants({ size: "lg" }), "h-12 rounded-full px-7 text-base font-bold shadow-lg shadow-brand/30")}
          >
            Explorar catálogo
            <ArrowRight />
          </Link>
          <span className="flex items-center gap-2 text-sm text-white/85">
            <ShieldCheck className="size-6 text-brand" />
            Compra segura
          </span>
        </div>
      </div>

      <div aria-hidden className="relative mx-auto hidden aspect-square w-full max-w-sm md:block">
        <div className="absolute inset-0 rounded-full border-2 border-brand/40 shadow-[0_0_80px_-10px] shadow-brand/60" />
        <div className="absolute inset-8 rounded-full border border-brand-strong/40" />
        <Image src="/images/logo-mark.png" alt="" fill sizes="384px" priority className="rounded-full p-14" />
      </div>
    </div>
  </section>
);

const Section = ({
  title,
  moreHref,
  moreLabel,
  children,
}: {
  title: string;
  moreHref: string;
  moreLabel: string;
  children: ReactNode;
}) => (
  <section className="grid gap-5">
    <div className="flex items-center justify-between gap-4">
      <h2 className="flex items-center gap-3 text-xl font-extrabold tracking-tight text-navy sm:text-2xl">
        <span aria-hidden className="h-7 w-1 rounded-full bg-brand" />
        {title}
      </h2>
      <Link href={moreHref} className="flex shrink-0 items-center gap-1 text-sm font-semibold text-brand-strong hover:underline">
        {moreLabel}
        <ArrowRight className="size-4" />
      </Link>
    </div>
    {children}
  </section>
);

const FeaturedProducts = async () => {
  const products = await getFeaturedProducts(FEATURED_PRODUCTS_LIMIT);

  return products.length === 0 ? (
    <p className="rounded-2xl border border-dashed p-12 text-center text-muted-foreground">
      Pronto publicaremos nuestros productos.
    </p>
  ) : (
    <ProductGrid products={products} />
  );
};
