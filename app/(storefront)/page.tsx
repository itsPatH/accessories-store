import Link from "next/link";
import { Search } from "lucide-react";
import { Suspense } from "react";

import { ProductGrid, ProductGridSkeleton } from "@/components/storefront/product-card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isProductCategory, PRODUCT_CATEGORIES, PRODUCT_CATEGORY_LABELS } from "@/lib/products/categories";
import { getCatalogPage, type CatalogFilters } from "@/lib/products/queries";
import { cn } from "@/lib/utils";

type SearchParams = Awaited<PageProps<"/">["searchParams"]>;

const MAX_QUERY_LENGTH = 100;

const firstValue = (value: string | string[] | undefined): string | undefined =>
  Array.isArray(value) ? value[0] : value;

const parseFilters = (searchParams: SearchParams): CatalogFilters => {
  const category = firstValue(searchParams.category);
  const page = Number.parseInt(firstValue(searchParams.page) ?? "1", 10);
  return {
    query: (firstValue(searchParams.q) ?? "").trim().slice(0, MAX_QUERY_LENGTH),
    category: isProductCategory(category) ? category : null,
    page: Number.isInteger(page) && page > 0 ? page : 1,
  };
};

const buildCatalogHref = (filters: CatalogFilters): string => {
  const params = new URLSearchParams();
  if (filters.query) params.set("q", filters.query);
  if (filters.category) params.set("category", filters.category);
  if (filters.page > 1) params.set("page", String(filters.page));
  const search = params.toString();
  return search ? `/?${search}` : "/";
};

export default function HomePage({ searchParams }: PageProps<"/">) {
  return (
    <div className="grid gap-8">
      <section className="grid gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Accesorios para tu teléfono</h1>
        <p className="text-muted-foreground">Fundas, cargadores, cables y más, de vendedores independientes.</p>
      </section>
      {/* Filters come from the URL (request-time), so the catalog streams in. */}
      <Suspense fallback={<ProductGridSkeleton />}>
        <Catalog searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

const Catalog = async ({ searchParams }: { searchParams: Promise<SearchParams> }) => {
  const filters = parseFilters(await searchParams);
  const { products, totalCount, pageCount } = await getCatalogPage(filters);

  return (
    <div className="grid gap-6">
      <form action="/" className="flex max-w-md gap-2" role="search">
        <Input name="q" defaultValue={filters.query} placeholder="Buscar productos…" maxLength={MAX_QUERY_LENGTH} />
        {filters.category && <input type="hidden" name="category" value={filters.category} />}
        <Button type="submit" variant="outline" size="icon" aria-label="Buscar">
          <Search />
        </Button>
      </form>

      <nav className="flex flex-wrap gap-2" aria-label="Categorías">
        <CategoryChip href={buildCatalogHref({ ...filters, category: null, page: 1 })} isActive={!filters.category}>
          Todo
        </CategoryChip>
        {PRODUCT_CATEGORIES.map((category) => (
          <CategoryChip
            key={category}
            href={buildCatalogHref({ ...filters, category, page: 1 })}
            isActive={filters.category === category}
          >
            {PRODUCT_CATEGORY_LABELS[category]}
          </CategoryChip>
        ))}
      </nav>

      {products.length === 0 ? (
        <p className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
          No encontramos productos con esos filtros.
        </p>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">{totalCount} productos</p>
          <ProductGrid products={products} />
        </>
      )}

      {pageCount > 1 && (
        <nav className="flex items-center justify-center gap-3" aria-label="Paginación">
          {filters.page > 1 && (
            <Link href={buildCatalogHref({ ...filters, page: filters.page - 1 })} className={buttonVariants({ variant: "outline" })}>
              Anterior
            </Link>
          )}
          <span className="text-sm text-muted-foreground">
            Página {filters.page} de {pageCount}
          </span>
          {filters.page < pageCount && (
            <Link href={buildCatalogHref({ ...filters, page: filters.page + 1 })} className={buttonVariants({ variant: "outline" })}>
              Siguiente
            </Link>
          )}
        </nav>
      )}
    </div>
  );
};

const CategoryChip = ({ href, isActive, children }: { href: string; isActive: boolean; children: string }) => (
  <Link
    href={href}
    aria-current={isActive ? "page" : undefined}
    className={cn(
      buttonVariants({ variant: isActive ? "default" : "outline", size: "sm" }),
      "rounded-full",
    )}
  >
    {children}
  </Link>
);
