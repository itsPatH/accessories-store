import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";

import { ProductForm } from "@/components/products/product-form";
import { requireMerchant } from "@/lib/auth";
import { getOwnProduct } from "@/lib/products/merchant-queries";

import { updateProduct } from "../../actions";

export const metadata: Metadata = {
  title: "Editar producto",
};

export default async function EditProductPage({ params }: PageProps<"/dashboard/products/[id]/edit">) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();

  const { user } = await requireMerchant();
  const product = await getOwnProduct(user.id, id);
  if (!product) notFound();

  return (
    <div className="mx-auto grid max-w-3xl gap-6">
      <h1 className="text-2xl font-semibold">Editar producto</h1>
      <ProductForm action={updateProduct} product={product} />
    </div>
  );
}
