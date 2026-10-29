"use server";

import { randomUUID } from "node:crypto";

import { refresh, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { getMerchantSession } from "@/lib/auth";
import { PRODUCTS_CACHE_TAG } from "@/lib/products/queries";
import { fail, ok, type Result } from "@/lib/result";
import { IMAGE_EXTENSIONS, isOwnedImagePath, PRODUCT_IMAGES_BUCKET } from "@/lib/storage";
import { toUserMessage } from "@/lib/supabase/errors";
import { createSupabaseServerClient, type TypedSupabaseClient } from "@/lib/supabase/server";
import {
  productInputSchema,
  productIdSchema,
  readProductFormData,
  setProductActiveSchema,
  updateProductSchema,
  uploadRequestSchema,
  type UploadRequest,
} from "@/lib/validation/product";

export interface SignedUpload {
  path: string;
  token: string;
}

const UNAUTHORIZED = "No autorizado";
const INVALID_FIELDS = "Revisa los campos marcados";
const PRODUCT_NOT_FOUND = "Producto no encontrado";
const INVALID_IMAGES = "Alguna imagen no es válida. Quítala y vuelve a subirla.";

// Storage cleanup is best effort: the row change already succeeded.
const removeStoredImages = async (supabase: TypedSupabaseClient, paths: string[]): Promise<void> => {
  if (paths.length === 0) return;
  const { error } = await supabase.storage.from(PRODUCT_IMAGES_BUCKET).remove(paths);
  if (error) console.error("removeStoredImages failed", error.message);
};

export const createImageUploadUrls = async (input: UploadRequest): Promise<Result<SignedUpload[]>> => {
  const session = await getMerchantSession();
  if (!session) return fail(UNAUTHORIZED);

  const parsed = uploadRequestSchema.safeParse(input);
  if (!parsed.success) return fail("Formato o tamaño de imagen no permitido");

  const supabase = await createSupabaseServerClient();
  const uploads: SignedUpload[] = [];

  for (const file of parsed.data.files) {
    const path = `${session.user.id}/${randomUUID()}.${IMAGE_EXTENSIONS[file.contentType]}`;
    // Runs with the merchant's session, so Storage RLS checks the target folder here.
    const { data, error } = await supabase.storage.from(PRODUCT_IMAGES_BUCKET).createSignedUploadUrl(path);
    if (error) {
      console.error("createSignedUploadUrl failed", error.message);
      return fail("No pudimos preparar la subida de imágenes");
    }
    uploads.push({ path: data.path, token: data.token });
  }

  return ok(uploads);
};

export const createProduct = async (_previousState: Result<null>, formData: FormData): Promise<Result<null>> => {
  const session = await getMerchantSession();
  if (!session) return fail(UNAUTHORIZED);

  const parsed = productInputSchema.safeParse(readProductFormData(formData));
  if (!parsed.success) return fail(INVALID_FIELDS, z.flattenError(parsed.error).fieldErrors);

  const { title, description, category, price, stock, images, isActive } = parsed.data;
  if (!images.every((path) => isOwnedImagePath(path, session.user.id))) return fail(INVALID_IMAGES);

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("products").insert({
    user_id: session.user.id,
    title,
    description,
    category,
    price,
    stock,
    images,
    is_active: isActive,
  });

  if (error) return fail(toUserMessage(error, "createProduct failed"));

  updateTag(PRODUCTS_CACHE_TAG);
  redirect("/dashboard/products");
};

export const updateProduct = async (_previousState: Result<null>, formData: FormData): Promise<Result<null>> => {
  const session = await getMerchantSession();
  if (!session) return fail(UNAUTHORIZED);

  const parsed = updateProductSchema.safeParse(readProductFormData(formData));
  if (!parsed.success) return fail(INVALID_FIELDS, z.flattenError(parsed.error).fieldErrors);

  const { id, title, description, category, price, stock, images, isActive } = parsed.data;
  if (!images.every((path) => isOwnedImagePath(path, session.user.id))) return fail(INVALID_IMAGES);

  const supabase = await createSupabaseServerClient();
  const { data: current } = await supabase
    .from("products")
    .select("images")
    .eq("id", id)
    .eq("user_id", session.user.id)
    .maybeSingle();
  if (!current) return fail(PRODUCT_NOT_FOUND);

  const { error } = await supabase
    .from("products")
    .update({ title, description, category, price, stock, images, is_active: isActive })
    .eq("id", id)
    .eq("user_id", session.user.id);

  if (error) return fail(toUserMessage(error, "updateProduct failed"));

  await removeStoredImages(
    supabase,
    current.images.filter((path) => !images.includes(path)),
  );

  updateTag(PRODUCTS_CACHE_TAG);
  redirect("/dashboard/products");
};

export const setProductActive = async (input: {
  id: string;
  isActive: boolean;
}): Promise<Result<{ id: string; isActive: boolean }>> => {
  const session = await getMerchantSession();
  if (!session) return fail(UNAUTHORIZED);

  const parsed = setProductActiveSchema.safeParse(input);
  if (!parsed.success) return fail(PRODUCT_NOT_FOUND);

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("products")
    .update({ is_active: parsed.data.isActive })
    .eq("id", parsed.data.id)
    .eq("user_id", session.user.id)
    .select("id, is_active")
    .maybeSingle();

  if (error) return fail(toUserMessage(error, "setProductActive failed"));
  if (!data) return fail(PRODUCT_NOT_FOUND);

  updateTag(PRODUCTS_CACHE_TAG);
  refresh();
  return ok({ id: data.id, isActive: data.is_active });
};

export const deleteProduct = async (input: { id: string }): Promise<Result<{ id: string }>> => {
  const session = await getMerchantSession();
  if (!session) return fail(UNAUTHORIZED);

  const parsed = productIdSchema.safeParse(input);
  if (!parsed.success) return fail(PRODUCT_NOT_FOUND);

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("products")
    .delete()
    .eq("id", parsed.data.id)
    .eq("user_id", session.user.id)
    .select("id, images")
    .maybeSingle();

  if (error) return fail(toUserMessage(error, "deleteProduct failed"));
  if (!data) return fail(PRODUCT_NOT_FOUND);

  await removeStoredImages(supabase, data.images);

  updateTag(PRODUCTS_CACHE_TAG);
  refresh();
  return ok({ id: data.id });
};
