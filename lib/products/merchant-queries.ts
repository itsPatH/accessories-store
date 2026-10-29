import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Product } from "@/types/database";

// Dashboard reads: run with the merchant's session (RLS) plus an explicit ownership filter.

export interface MerchantProductStats {
  total: number;
  active: number;
  outOfStock: number;
}

export const getOwnProducts = async (userId: string): Promise<Product[]> => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getOwnProducts failed", error.code, error.message);
    return [];
  }
  return data;
};

export const getOwnProduct = async (userId: string, productId: string): Promise<Product | null> => {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("products")
    .select("*")
    .eq("id", productId)
    .eq("user_id", userId)
    .maybeSingle();
  return data;
};

export const getOwnProductStats = async (userId: string): Promise<MerchantProductStats> => {
  const products = await getOwnProducts(userId);
  return {
    total: products.length,
    active: products.filter((product) => product.is_active).length,
    outOfStock: products.filter((product) => product.stock === 0).length,
  };
};
