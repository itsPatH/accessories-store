import type { ProductCategory } from "@/types/database";

export const PRODUCT_CATEGORIES = [
  "case",
  "screen_protector",
  "charger",
  "cable",
  "headphones",
  "power_bank",
  "mount",
  "other",
] as const satisfies readonly ProductCategory[];

export const PRODUCT_CATEGORY_LABELS: Record<ProductCategory, string> = {
  case: "Fundas",
  screen_protector: "Protectores de pantalla",
  charger: "Cargadores",
  cable: "Cables",
  headphones: "Audífonos",
  power_bank: "Baterías externas",
  mount: "Soportes",
  other: "Otros",
};

export const isProductCategory = (value: unknown): value is ProductCategory =>
  PRODUCT_CATEGORIES.some((category) => category === value);
