import { z } from "zod";

import { PRODUCT_CATEGORIES } from "@/lib/products/categories";
import {
  ALLOWED_IMAGE_TYPES,
  MAX_IMAGE_BYTES,
  MAX_PRODUCT_IMAGES,
  STORAGE_PATH_REGEX,
} from "@/lib/storage";

import { storeNameSchema } from "./auth";

const emptyToUndefined = (value: unknown): unknown => (value === "" ? undefined : value);

export const productInputSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "El título debe tener al menos 3 caracteres")
    .max(120, "El título no puede superar 120 caracteres"),
  description: z.string().trim().max(5000, "La descripción no puede superar 5000 caracteres"),
  category: z.enum(PRODUCT_CATEGORIES, { error: "Elige una categoría" }),
  price: z.preprocess(
    emptyToUndefined,
    z.coerce
      .number({ error: "Ingresa un precio válido" })
      .min(0, "El precio no puede ser negativo")
      .max(9_999_999_999.99, "El precio es demasiado alto")
      .multipleOf(0.01, "Usa como máximo 2 decimales"),
  ),
  stock: z.preprocess(
    emptyToUndefined,
    z.coerce
      .number({ error: "Ingresa un stock válido" })
      .int("El stock debe ser un número entero")
      .min(0, "El stock no puede ser negativo")
      .max(1_000_000, "El stock es demasiado alto"),
  ),
  images: z
    .array(z.string().regex(STORAGE_PATH_REGEX, "Imagen inválida"))
    .max(MAX_PRODUCT_IMAGES, `Máximo ${MAX_PRODUCT_IMAGES} imágenes`),
  isActive: z.boolean(),
});

export const productIdSchema = z.object({
  id: z.uuid("Producto inválido"),
});

export const updateProductSchema = productIdSchema.extend(productInputSchema.shape);

export const setProductActiveSchema = productIdSchema.extend({
  isActive: z.boolean(),
});

export const uploadRequestSchema = z.object({
  files: z
    .array(
      z.object({
        contentType: z.enum(ALLOWED_IMAGE_TYPES),
        size: z.number().int().positive().max(MAX_IMAGE_BYTES),
      }),
    )
    .min(1)
    .max(MAX_PRODUCT_IMAGES),
});

export const storeProfileSchema = z.object({
  displayName: z.string().trim().max(80, "El nombre no puede superar 80 caracteres"),
  storeName: storeNameSchema,
});

export type ProductInput = z.infer<typeof productInputSchema>;
export type UploadRequest = z.infer<typeof uploadRequestSchema>;

// Maps the product form fields to the shape productInputSchema expects.
export const readProductFormData = (formData: FormData): Record<string, unknown> => ({
  id: formData.get("id") ?? undefined,
  title: formData.get("title"),
  description: formData.get("description") ?? "",
  category: formData.get("category"),
  price: formData.get("price"),
  stock: formData.get("stock"),
  images: formData.getAll("images"),
  isActive: formData.get("isActive") === "on",
});
