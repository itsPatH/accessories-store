import { notFound } from "next/navigation";
import { Suspense } from "react";
import { z } from "zod";

import { OrderButton } from "@/components/storefront/order-button";
import { ProductGallery } from "@/components/storefront/product-gallery";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/format";
import { PRODUCT_CATEGORY_LABELS } from "@/lib/products/categories";
import { getActiveProduct } from "@/lib/products/queries";
import { getProductImageUrl } from "@/lib/storage";

export default function ProductPage({ params }: PageProps<"/products/[id]">) {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10">
      <Suspense fallback={<div className="aspect-square max-w-lg animate-pulse rounded-2xl bg-muted" />}>
        <ProductDetail params={params} />
      </Suspense>
    </div>
  );
}

const ProductDetail = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();

  const product = await getActiveProduct(id);
  if (!product) notFound();

  return (
    <article className="grid gap-8 md:grid-cols-2">
      <ProductGallery title={product.title} imageUrls={product.images.map(getProductImageUrl)} />

      <div className="grid content-start gap-4">
        <span className="w-fit rounded-full bg-secondary px-3 py-0.5 text-sm font-medium text-secondary-foreground">
          {PRODUCT_CATEGORY_LABELS[product.category]}
        </span>
        <h1 className="text-3xl font-extrabold tracking-tight text-navy">{product.title}</h1>
        <p className="text-3xl font-extrabold text-brand-strong">{formatPrice(product.price)}</p>
        {product.stock === 0 ? (
          <Badge variant="destructive" className="w-fit">Agotado</Badge>
        ) : (
          <Badge variant="secondary" className="w-fit">{product.stock} disponibles</Badge>
        )}
        {product.stock > 0 && (
          <OrderButton product={product} showProductLinkFallback={false} className="sm:max-w-xs" />
        )}
        {product.description && (
          <p className="whitespace-pre-line leading-relaxed text-muted-foreground">{product.description}</p>
        )}
      </div>
    </article>
  );
};
