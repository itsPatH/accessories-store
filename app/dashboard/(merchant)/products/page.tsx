import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ImageOff, Plus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireMerchant } from "@/lib/auth";
import { formatPrice } from "@/lib/format";
import { PRODUCT_CATEGORY_LABELS } from "@/lib/products/categories";
import { getOwnProducts } from "@/lib/products/merchant-queries";
import { getProductImageUrl } from "@/lib/storage";

import { ProductActiveToggle, ProductRowActions } from "./product-row-actions";

export const metadata: Metadata = {
  title: "Mis productos",
};

export default async function ProductsPage() {
  const { user } = await requireMerchant();
  const products = await getOwnProducts(user.id);

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Mis productos</h1>
        <Link href="/dashboard/products/new" className={buttonVariants()}>
          <Plus />
          Nuevo producto
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
          Aún no tienes productos. Publica el primero para que aparezca en la tienda.
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Foto</TableHead>
                <TableHead>Producto</TableHead>
                <TableHead className="text-right">Precio</TableHead>
                <TableHead className="text-right">Stock</TableHead>
                <TableHead>Visible</TableHead>
                <TableHead className="sr-only">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <div className="relative size-12 overflow-hidden rounded-md bg-muted">
                      {product.images[0] ? (
                        <Image
                          src={getProductImageUrl(product.images[0])}
                          alt=""
                          fill
                          sizes="48px"
                          unoptimized
                          className="object-cover"
                        />
                      ) : (
                        <ImageOff className="absolute inset-0 m-auto size-5 text-muted-foreground" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{product.title}</div>
                    <div className="text-xs text-muted-foreground">{PRODUCT_CATEGORY_LABELS[product.category]}</div>
                  </TableCell>
                  <TableCell className="text-right">{formatPrice(product.price)}</TableCell>
                  <TableCell className="text-right">
                    {product.stock === 0 ? <Badge variant="destructive">Agotado</Badge> : product.stock}
                  </TableCell>
                  <TableCell>
                    <ProductActiveToggle productId={product.id} isActive={product.is_active} title={product.title} />
                  </TableCell>
                  <TableCell>
                    <ProductRowActions productId={product.id} title={product.title} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
