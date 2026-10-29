"use client";

import Link from "next/link";
import { startTransition, useActionState, useState, type FormEvent } from "react";

import { FormAlert } from "@/components/form-alert";
import { FormField } from "@/components/form-field";
import { ImageUploader, toUploadItems, type UploadItem } from "@/components/products/image-uploader";
import { Button, buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { PRODUCT_CATEGORIES, PRODUCT_CATEGORY_LABELS } from "@/lib/products/categories";
import type { Result } from "@/lib/result";
import type { Product } from "@/types/database";

type ProductFormAction = (previousState: Result<null>, formData: FormData) => Promise<Result<null>>;

interface ProductFormProps {
  action: ProductFormAction;
  product?: Product;
}

const INITIAL_STATE: Result<null> = { data: null, error: null };

const CATEGORY_ITEMS = PRODUCT_CATEGORIES.map((value) => ({ value, label: PRODUCT_CATEGORY_LABELS[value] }));

const FieldError = ({ errors }: { errors?: string[] }) =>
  errors?.length ? <p className="text-sm text-destructive">{errors[0]}</p> : null;

export const ProductForm = ({ action, product }: ProductFormProps) => {
  const [state, formAction, isPending] = useActionState(action, INITIAL_STATE);
  const [images, setImages] = useState<UploadItem[]>(() => toUploadItems(product?.images ?? []));

  const isUploading = images.some((item) => item.status === "uploading");
  const hasFailedUploads = images.some((item) => item.status === "error");

  // Submitting manually keeps the inputs filled when the server returns validation errors.
  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => formAction(formData));
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-6">
      <FormAlert message={state.error} />
      {product && <input type="hidden" name="id" value={product.id} />}
      {images.map((item) =>
        item.path && item.status === "done" ? (
          <input key={item.key} type="hidden" name="images" value={item.path} />
        ) : null,
      )}

      <section className="grid gap-2">
        <Label>Fotos</Label>
        <ImageUploader items={images} onItemsChange={setImages} />
        <FieldError errors={state.fieldErrors?.images} />
      </section>

      <FormField
        name="title"
        label="Título"
        defaultValue={product?.title}
        minLength={3}
        maxLength={120}
        required
        errors={state.fieldErrors?.title}
      />

      <div className="grid gap-2">
        <Label htmlFor="description">Descripción</Label>
        <Textarea
          id="description"
          name="description"
          rows={5}
          maxLength={5000}
          defaultValue={product?.description}
          aria-invalid={Boolean(state.fieldErrors?.description)}
        />
        <FieldError errors={state.fieldErrors?.description} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="grid gap-2">
          <Label>Categoría</Label>
          <Select name="category" items={CATEGORY_ITEMS} defaultValue={product?.category ?? "case"}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORY_ITEMS.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError errors={state.fieldErrors?.category} />
        </div>
        <FormField
          name="price"
          label="Precio"
          type="number"
          inputMode="decimal"
          min={0}
          step="0.01"
          defaultValue={product?.price}
          required
          errors={state.fieldErrors?.price}
        />
        <FormField
          name="stock"
          label="Stock"
          type="number"
          inputMode="numeric"
          min={0}
          step={1}
          defaultValue={product?.stock ?? 0}
          required
          errors={state.fieldErrors?.stock}
        />
      </div>

      <Label className="flex items-center gap-3 font-normal">
        <Switch name="isActive" defaultChecked={product?.is_active ?? true} />
        Visible en la tienda
      </Label>

      <div className="flex flex-wrap items-center justify-end gap-3">
        {hasFailedUploads && (
          <p className="mr-auto text-sm text-destructive">Quita las fotos con error para continuar.</p>
        )}
        <Link href="/dashboard/products" className={buttonVariants({ variant: "outline" })}>
          Cancelar
        </Link>
        <Button type="submit" disabled={isPending || isUploading || hasFailedUploads}>
          {isPending ? "Guardando…" : isUploading ? "Subiendo fotos…" : "Guardar producto"}
        </Button>
      </div>
    </form>
  );
};
