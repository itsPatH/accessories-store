"use client";

import { ArrowLeft, ArrowRight, ImagePlus, LoaderCircle, TriangleAlert, X } from "lucide-react";
import type { ChangeEvent, Dispatch, SetStateAction } from "react";

import { createImageUploadUrls } from "@/app/dashboard/(merchant)/products/actions";
import { Button } from "@/components/ui/button";
import { compressImage } from "@/lib/images/compress-image";
import { cn } from "@/lib/utils";
import {
  ALLOWED_IMAGE_TYPES,
  getProductImageUrl,
  isAllowedImageType,
  MAX_IMAGE_BYTES,
  MAX_PRODUCT_IMAGES,
  PRODUCT_IMAGES_BUCKET,
} from "@/lib/storage";
import { getSupabaseUploadClient } from "@/lib/supabase/browser";

export interface UploadItem {
  key: string;
  previewUrl: string;
  path: string | null;
  status: "uploading" | "done" | "error";
  error?: string;
}

export const toUploadItems = (paths: string[]): UploadItem[] =>
  paths.map((path) => ({ key: path, previewUrl: getProductImageUrl(path), path, status: "done" }));

interface ImageUploaderProps {
  items: UploadItem[];
  onItemsChange: Dispatch<SetStateAction<UploadItem[]>>;
}

const markItem = (key: string, patch: Partial<UploadItem>) => (items: UploadItem[]): UploadItem[] =>
  items.map((item) => (item.key === key ? { ...item, ...patch } : item));

export const ImageUploader = ({ items, onItemsChange }: ImageUploaderProps) => {
  const remainingSlots = MAX_PRODUCT_IMAGES - items.length;

  const uploadFiles = async (files: File[]): Promise<void> => {
    const pending = files.map((file) => ({
      file,
      item: {
        key: crypto.randomUUID(),
        previewUrl: URL.createObjectURL(file),
        path: null,
        status: "uploading",
      } satisfies UploadItem,
    }));
    onItemsChange((current) => [...current, ...pending.map(({ item }) => item)]);

    const failAll = (message: string): void =>
      pending.forEach(({ item }) => onItemsChange(markItem(item.key, { status: "error", error: message })));

    let compressed: File[];
    try {
      compressed = await Promise.all(files.map(compressImage));
    } catch {
      failAll("No pudimos procesar la imagen");
      return;
    }

    if (compressed.some((file) => file.size > MAX_IMAGE_BYTES || !isAllowedImageType(file.type))) {
      failAll("La imagen supera 5 MB o tiene un formato no permitido");
      return;
    }

    const signed = await createImageUploadUrls({
      files: compressed.map((file) => ({
        contentType: isAllowedImageType(file.type) ? file.type : "image/webp",
        size: file.size,
      })),
    });
    if (!signed.data) {
      failAll(signed.error ?? "No pudimos subir las imágenes");
      return;
    }

    // Binaries go straight from the browser to Supabase Storage, never through Next.js.
    const storage = getSupabaseUploadClient().storage.from(PRODUCT_IMAGES_BUCKET);
    await Promise.all(
      signed.data.map(async ({ path, token }, index) => {
        const { item } = pending[index];
        const file = compressed[index];
        const { error } = await storage.uploadToSignedUrl(path, token, file, {
          contentType: file.type,
          cacheControl: "31536000",
        });
        onItemsChange(
          markItem(item.key, error ? { status: "error", error: "Falló la subida" } : { status: "done", path }),
        );
      }),
    );
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const files = Array.from(event.target.files ?? [])
      .filter((file) => isAllowedImageType(file.type))
      .slice(0, remainingSlots);
    event.target.value = "";
    if (files.length > 0) void uploadFiles(files);
  };

  const removeItem = (key: string): void => {
    onItemsChange((current) => current.filter((item) => item.key !== key));
  };

  const moveItem = (index: number, offset: -1 | 1): void => {
    onItemsChange((current) => {
      const target = index + offset;
      if (target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  return (
    <div className="grid gap-3">
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {items.map((item, index) => (
          <li
            key={item.key}
            className={cn(
              "group relative aspect-square overflow-hidden rounded-lg border bg-muted",
              item.status === "error" && "border-destructive",
            )}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- local blob previews */}
            <img src={item.previewUrl} alt="" className="size-full object-cover" />

            {index === 0 && item.status === "done" && (
              <span className="absolute top-1.5 left-1.5 rounded bg-background/90 px-1.5 py-0.5 text-xs font-medium">
                Portada
              </span>
            )}

            {item.status === "uploading" && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/60">
                <LoaderCircle className="size-6 animate-spin" aria-label="Subiendo" />
              </div>
            )}

            {item.status === "error" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-background/80 p-2 text-center text-xs text-destructive">
                <TriangleAlert className="size-5" />
                {item.error}
              </div>
            )}

            <div className="absolute inset-x-1.5 bottom-1.5 flex justify-between gap-1">
              <div className="flex gap-1">
                <Button
                  type="button"
                  size="icon-xs"
                  variant="secondary"
                  onClick={() => moveItem(index, -1)}
                  disabled={index === 0}
                  aria-label="Mover a la izquierda"
                >
                  <ArrowLeft />
                </Button>
                <Button
                  type="button"
                  size="icon-xs"
                  variant="secondary"
                  onClick={() => moveItem(index, 1)}
                  disabled={index === items.length - 1}
                  aria-label="Mover a la derecha"
                >
                  <ArrowRight />
                </Button>
              </div>
              <Button
                type="button"
                size="icon-xs"
                variant="destructive"
                onClick={() => removeItem(item.key)}
                aria-label="Quitar imagen"
              >
                <X />
              </Button>
            </div>
          </li>
        ))}

        {remainingSlots > 0 && (
          <li>
            <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed text-sm text-muted-foreground transition-colors hover:bg-muted">
              <ImagePlus className="size-6" />
              Agregar fotos
              <input
                type="file"
                accept={ALLOWED_IMAGE_TYPES.join(",")}
                multiple
                className="sr-only"
                onChange={handleFileChange}
              />
            </label>
          </li>
        )}
      </ul>
      <p className="text-xs text-muted-foreground">
        Hasta {MAX_PRODUCT_IMAGES} fotos JPG, PNG o WebP. La primera es la portada. Se optimizan antes de subirlas.
      </p>
    </div>
  );
};
