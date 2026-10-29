import type { Metadata } from "next";

import { ProductForm } from "@/components/products/product-form";
import { requireMerchant } from "@/lib/auth";

import { createProduct } from "../actions";

export const metadata: Metadata = {
  title: "Nuevo producto",
};

export default async function NewProductPage() {
  await requireMerchant();

  return (
    <div className="mx-auto grid max-w-3xl gap-6">
      <h1 className="text-2xl font-semibold">Nuevo producto</h1>
      <ProductForm action={createProduct} />
    </div>
  );
}
