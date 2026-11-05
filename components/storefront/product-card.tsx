import Image from "next/image";
import Link from "next/link";
import { ImageOff } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/format";
import { PRODUCT_CATEGORY_LABELS } from "@/lib/products/categories";
import type { CatalogProduct } from "@/lib/products/queries";
import { getProductImageUrl } from "@/lib/storage";

import { OrderButton } from "./order-button";

interface ProductCardProps {
  product: CatalogProduct;
}

export const ProductCard = ({ product }: ProductCardProps) => {
  const cover = product.images[0];
  const productUrl = `/products/${product.id}`;

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border bg-card shadow-sm transition-shadow hover:shadow-md">
      <Link href={productUrl} className="relative block aspect-square bg-muted" tabIndex={-1} aria-hidden>
        {cover ? (
          <Image
            src={getProductImageUrl(cover)}
            alt=""
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            unoptimized
            className="object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <ImageOff className="absolute inset-0 m-auto size-8 text-muted-foreground" />
        )}
        {product.stock === 0 && (
          <Badge variant="destructive" className="absolute top-3 left-3">
            Agotado
          </Badge>
        )}
        <span className="absolute bottom-3 left-3 rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
          {PRODUCT_CATEGORY_LABELS[product.category]}
        </span>
      </Link>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <Link href={productUrl} className="line-clamp-2 font-semibold hover:text-brand-strong">
          {product.title}
        </Link>
        <p className="mt-auto text-2xl font-extrabold text-brand-strong">{formatPrice(product.price)}</p>
        <OrderButton product={product} compactOnMobile />
      </div>
    </article>
  );
};

export const ProductGrid = ({ products }: { products: CatalogProduct[] }) => (
  <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
    {products.map((product) => (
      <li key={product.id}>
        <ProductCard product={product} />
      </li>
    ))}
  </ul>
);

export const ProductGridSkeleton = ({ count = 8 }: { count?: number }) => (
  <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4" aria-hidden>
    {Array.from({ length: count }, (_, index) => (
      <li key={index} className="grid gap-3 rounded-2xl border bg-card p-4">
        <div className="aspect-square animate-pulse rounded-xl bg-muted" />
        <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
        <div className="h-6 w-1/3 animate-pulse rounded bg-muted" />
        <div className="h-10 animate-pulse rounded-full bg-muted" />
      </li>
    ))}
  </ul>
);
