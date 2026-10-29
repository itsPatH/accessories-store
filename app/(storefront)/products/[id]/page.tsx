import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ImageOff, Store } from "lucide-react";
import { Suspense } from "react";
import { z } from "zod";

import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/format";
import { PRODUCT_CATEGORY_LABELS } from "@/lib/products/categories";
import { getActiveProduct } from "@/lib/products/queries";
import { getProductImageUrl } from "@/lib/storage";

export default function ProductPage({ params }: PageProps<"/products/[id]">) {
  return (
    <Suspense fallback={<div className="aspect-square max-w-lg animate-pulse rounded-lg bg-muted" />}>
      <ProductDetail params={params} />
    </Suspense>
  );
}

const ProductDetail = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();

  const product = await getActiveProduct(id);
  if (!product) notFound();

  const [cover, ...gallery] = product.images;

  return (
    <article className="grid gap-8 md:grid-cols-2">
      <div className="grid gap-3">
        <div className="relative aspect-square overflow-hidden rounded-lg border bg-muted">
          {cover ? (
            <Image
              src={getProductImageUrl(cover)}
              alt={product.title}
              fill
              sizes="(min-width: 768px) 50vw, 100vw"
              unoptimized
              priority
              className="object-cover"
            />
          ) : (
            <ImageOff className="absolute inset-0 m-auto size-10 text-muted-foreground" />
          )}
        </div>
        {gallery.length > 0 && (
          <ul className="grid grid-cols-4 gap-3">
            {gallery.map((path) => (
              <li key={path} className="relative aspect-square overflow-hidden rounded-md border bg-muted">
                <Image src={getProductImageUrl(path)} alt="" fill sizes="25vw" unoptimized className="object-cover" />
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="grid content-start gap-4">
        <span className="text-sm text-muted-foreground">{PRODUCT_CATEGORY_LABELS[product.category]}</span>
        <h1 className="text-3xl font-semibold tracking-tight">{product.title}</h1>
        <p className="text-2xl font-semibold">{formatPrice(product.price)}</p>
        {product.stock === 0 ? (
          <Badge variant="destructive" className="w-fit">Agotado</Badge>
        ) : (
          <Badge variant="secondary" className="w-fit">{product.stock} disponibles</Badge>
        )}
        {product.store && (
          <Link
            href={`/stores/${product.store.id}`}
            className="flex w-fit items-center gap-2 text-sm underline-offset-4 hover:underline"
          >
            <Store className="size-4" />
            {product.store.store_name}
          </Link>
        )}
        {product.description && (
          <p className="whitespace-pre-line leading-relaxed text-muted-foreground">{product.description}</p>
        )}
      </div>
    </article>
  );
};
