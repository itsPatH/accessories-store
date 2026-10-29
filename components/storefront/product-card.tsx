import Image from "next/image";
import Link from "next/link";
import { ImageOff } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/format";
import { PRODUCT_CATEGORY_LABELS } from "@/lib/products/categories";
import type { CatalogProduct } from "@/lib/products/queries";
import { getProductImageUrl } from "@/lib/storage";

interface ProductCardProps {
  product: CatalogProduct;
}

export const ProductCard = ({ product }: ProductCardProps) => {
  const cover = product.images[0];

  return (
    <Link href={`/products/${product.id}`} className="group grid gap-2">
      <div className="relative aspect-square overflow-hidden rounded-lg border bg-muted">
        {cover ? (
          <Image
            src={getProductImageUrl(cover)}
            alt={product.title}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            unoptimized
            className="object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <ImageOff className="absolute inset-0 m-auto size-8 text-muted-foreground" />
        )}
        {product.stock === 0 && (
          <Badge variant="secondary" className="absolute top-2 left-2">
            Agotado
          </Badge>
        )}
      </div>
      <div className="grid gap-0.5">
        <span className="text-xs text-muted-foreground">{PRODUCT_CATEGORY_LABELS[product.category]}</span>
        <span className="line-clamp-2 font-medium group-hover:underline">{product.title}</span>
        <span className="font-semibold">{formatPrice(product.price)}</span>
      </div>
    </Link>
  );
};

export const ProductGrid = ({ products }: { products: CatalogProduct[] }) => (
  <ul className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
    {products.map((product) => (
      <li key={product.id}>
        <ProductCard product={product} />
      </li>
    ))}
  </ul>
);

export const ProductGridSkeleton = () => (
  <ul className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4" aria-hidden>
    {Array.from({ length: 8 }, (_, index) => (
      <li key={index} className="grid gap-2">
        <div className="aspect-square animate-pulse rounded-lg bg-muted" />
        <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
        <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />
      </li>
    ))}
  </ul>
);
