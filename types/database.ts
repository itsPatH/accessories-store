// Mirrors supabase/schema.sql. Once a Supabase project is linked, replace this file with:
//   pnpm dlx supabase gen types typescript --project-id <project-id> > types/database.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = "customer" | "merchant";

export type ProductCategory =
  | "case"
  | "screen_protector"
  | "charger"
  | "cable"
  | "headphones"
  | "power_bank"
  | "mount"
  | "other";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          role: UserRole;
          display_name: string | null;
          store_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: never;
        Update: {
          display_name?: string | null;
          store_name?: string | null;
          avatar_url?: string | null;
        };
        Relationships: [];
      };
      products: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string;
          category: ProductCategory;
          price: number;
          stock: number;
          images: string[];
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          title: string;
          description?: string;
          category?: ProductCategory;
          price: number;
          stock?: number;
          images?: string[];
          is_active?: boolean;
        };
        Update: {
          title?: string;
          description?: string;
          category?: ProductCategory;
          price?: number;
          stock?: number;
          images?: string[];
          is_active?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "products_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      become_merchant: {
        Args: { p_store_name: string };
        Returns: undefined;
      };
      is_merchant: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
}

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

export type Profile = Tables<"profiles">;
export type Product = Tables<"products">;
