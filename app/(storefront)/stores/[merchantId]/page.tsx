import { notFound } from "next/navigation";
import { Store } from "lucide-react";
import { Suspense } from "react";
import { z } from "zod";

import { ProductGrid, ProductGridSkeleton } from "@/components/storefront/product-card";
import { getPublicStore, getStoreProducts } from "@/lib/products/queries";

export default function StorePage({ params }: PageProps<"/stores/[merchantId]">) {
  return (
    <Suspense fallback={<ProductGridSkeleton />}>
      <StoreDetail params={params} />
    </Suspense>
  );
}

const StoreDetail = async ({ params }: { params: Promise<{ merchantId: string }> }) => {
  const { merchantId } = await params;
  if (!z.uuid().safeParse(merchantId).success) notFound();

  const [store, products] = await Promise.all([getPublicStore(merchantId), getStoreProducts(merchantId)]);
  if (!store) notFound();

  return (
    <div className="grid gap-8">
      <header className="flex items-center gap-3">
        <div className="flex size-12 items-center justify-center rounded-full bg-muted">
          <Store className="size-6" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold">{store.store_name}</h1>
          {store.display_name && <p className="text-sm text-muted-foreground">por {store.display_name}</p>}
        </div>
      </header>

      {products.length === 0 ? (
        <p className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
          Esta tienda aún no tiene productos publicados.
        </p>
      ) : (
        <ProductGrid products={products} />
      )}
    </div>
  );
};
