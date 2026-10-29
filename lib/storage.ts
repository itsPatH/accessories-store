// Product image storage contract (.specs/01-architecture.md §4, .specs/02-database.md §5.3).

export const PRODUCT_IMAGES_BUCKET = "product-images";
export const MAX_PRODUCT_IMAGES = 8;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export const ALLOWED_IMAGE_TYPES = ["image/webp", "image/jpeg", "image/png"] as const;
export type AllowedImageType = (typeof ALLOWED_IMAGE_TYPES)[number];

export const IMAGE_EXTENSIONS: Record<AllowedImageType, string> = {
  "image/webp": "webp",
  "image/jpeg": "jpg",
  "image/png": "png",
};

// "{user_id}/{uuid}.{ext}"
export const STORAGE_PATH_REGEX = /^[0-9a-f-]{36}\/[0-9a-f-]{36}\.(webp|jpg|png)$/;

export const isAllowedImageType = (value: string): value is AllowedImageType =>
  ALLOWED_IMAGE_TYPES.some((type) => type === value);

export const isOwnedImagePath = (path: string, userId: string): boolean =>
  STORAGE_PATH_REGEX.test(path) && path.startsWith(`${userId}/`);

export const getProductImageUrl = (path: string): string =>
  `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${PRODUCT_IMAGES_BUCKET}/${path}`;
