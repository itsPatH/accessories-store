import { isAllowedImageType } from "@/lib/storage";

const MAX_DIMENSION = 1600;
const WEBP_QUALITY = 0.82;

const canvasToBlob = (canvas: HTMLCanvasElement): Promise<Blob | null> =>
  new Promise((resolve) => canvas.toBlob(resolve, "image/webp", WEBP_QUALITY));

// Browser-only: resizes to ≤1600px and re-encodes as WebP before upload (.specs/01-architecture.md §4).
// Falls back to the original file when re-encoding does not help.
export const compressImage = async (file: File): Promise<File> => {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);

  const context = canvas.getContext("2d");
  if (!context) {
    bitmap.close();
    return file;
  }
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const blob = await canvasToBlob(canvas);
  if (!blob || !isAllowedImageType(blob.type) || (scale === 1 && blob.size >= file.size)) {
    return file;
  }

  const baseName = file.name.replace(/\.[^.]+$/, "");
  return new File([blob], `${baseName}.webp`, { type: blob.type });
};
