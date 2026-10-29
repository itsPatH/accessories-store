import { cacheLife, cacheTag } from "next/cache";

import { escapeLikePattern } from "@/lib/sql";
import { createSupabasePublicClient } from "@/lib/supabase/public";
import type { Product, ProductCategory, Profile } from "@/types/database";

// Public storefront reads: anon client (RLS → active products only) cached across requests.
// Mutations call updateTag() with these tags (.specs/04-products-crud.md §4).
export const PRODUCTS_CACHE_TAG = "products";
export const STORES_CACHE_TAG = "stores";

export const CATALOG_PAGE_SIZE = 24;

const CATALOG_COLUMNS = "id, user_id, title, price, stock, images, category" as const;

export type CatalogProduct = Pick<
  Product,
  "id" | "user_id" | "title" | "price" | "stock" | "images" | "category"
>;

export type PublicStore = Pick<Profile, "id" | "store_name" | "display_name" | "avatar_url">;

export interface CatalogFilters {
  query: string;
  category: ProductCategory | null;
  page: number;
}

export interface CatalogPage {
  products: CatalogProduct[];
  totalCount: number;
  pageCount: number;
}

export interface ProductDetail extends Product {
  store: PublicStore | null;
}

export const getCatalogPage = async ({ query, category, page }: CatalogFilters): Promise<CatalogPage> => {
  "use cache";
  cacheTag(PRODUCTS_CACHE_TAG);
  cacheLife("minutes");

  const from = (page - 1) * CATALOG_PAGE_SIZE;
  let request = createSupabasePublicClient()
    .from("products")
    .select(CATALOG_COLUMNS, { count: "exact" })
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .range(from, from + CATALOG_PAGE_SIZE - 1);

  if (category) request = request.eq("category", category);
  if (query) request = request.ilike("title", `%${escapeLikePattern(query)}%`);

  const { data, count, error } = await request;
  if (error) {
    console.error("getCatalogPage failed", error.code, error.message);
    return { products: [], totalCount: 0, pageCount: 0 };
  }

  const totalCount = count ?? 0;
  return { products: data, totalCount, pageCount: Math.ceil(totalCount / CATALOG_PAGE_SIZE) };
};

export const getPublicStore = async (merchantId: string): Promise<PublicStore | null> => {
  "use cache";
  cacheTag(STORES_CACHE_TAG);
  cacheLife("minutes");

  const { data } = await createSupabasePublicClient()
    .from("profiles")
    .select("id, store_name, display_name, avatar_url")
    .eq("id", merchantId)
    .eq("role", "merchant")
    .maybeSingle();
  return data;
};

export const getActiveProduct = async (productId: string): Promise<ProductDetail | null> => {
  "use cache";
  cacheTag(PRODUCTS_CACHE_TAG, STORES_CACHE_TAG);
  cacheLife("minutes");

  const { data: product } = await createSupabasePublicClient()
    .from("products")
    .select("*")
    .eq("id", productId)
    .eq("is_active", true)
    .maybeSingle();

  if (!product) return null;
  return { ...product, store: await getPublicStore(product.user_id) };
};

export const getStoreProducts = async (merchantId: string): Promise<CatalogProduct[]> => {
  "use cache";
  cacheTag(PRODUCTS_CACHE_TAG);
  cacheLife("minutes");

  const { data, error } = await createSupabasePublicClient()
    .from("products")
    .select(CATALOG_COLUMNS)
    .eq("user_id", merchantId)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("getStoreProducts failed", error.code, error.message);
    return [];
  }
  return data;
};
