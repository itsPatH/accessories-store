# 02 — Database (Supabase Postgres)

Status: **Draft for review** · Executable version: [`supabase/schema.sql`](../supabase/schema.sql) · Related: [01-architecture](./01-architecture.md), [03-auth-flow](./03-auth-flow.md)

The SQL file is idempotent (safe to re-run in the Supabase SQL Editor). Any schema change must update **both** this spec and `schema.sql`, then regenerate `types/database.ts`.

## 1. Entity Overview

```
auth.users (managed by Supabase Auth)
   │ 1:1  (trigger on_auth_user_created)
   ▼
public.profiles ── role: customer | merchant
   │ 1:N  (only merchants may insert)
   ▼
public.products ── images text[] → storage paths in bucket product-images/{user_id}/...
```

## 2. Tables

### 2.1 `public.profiles`

One row per auth user, created automatically by a trigger after sign-up.

| Column | Type | Constraints / default | Notes |
| --- | --- | --- | --- |
| `id` | `uuid` | PK, FK → `auth.users(id)` on delete cascade | Same id as the auth user |
| `role` | `text` | not null, default `'customer'`, check in (`customer`, `merchant`) | Not writable by users directly |
| `display_name` | `text` | nullable, 1–80 chars | Public for merchants |
| `store_name` | `text` | nullable, 2–80 chars, **unique (case-insensitive)** | Required when `role = 'merchant'` |
| `avatar_url` | `text` | nullable | |
| `created_at` / `updated_at` | `timestamptz` | not null, default `now()` | `updated_at` maintained by trigger |

Design notes:
- **No private data in `profiles`.** Email lives in `auth.users` and is never exposed. That allows merchant profiles to be publicly readable (storefront needs `store_name`).
- `role` cannot be changed through `UPDATE`: users only have column-level `UPDATE` privilege on `display_name`, `store_name`, `avatar_url`. Becoming a merchant goes through the `become_merchant()` function.

### 2.2 `public.products`

| Column | Type | Constraints / default | Notes |
| --- | --- | --- | --- |
| `id` | `uuid` | PK, default `gen_random_uuid()` | |
| `user_id` | `uuid` | not null, default `auth.uid()`, FK → `profiles(id)` on delete cascade | Owner (merchant). Tenant key. |
| `title` | `text` | not null, 3–120 chars | |
| `description` | `text` | not null, default `''`, ≤ 5000 chars | |
| `category` | `text` | not null, default `'other'`, check in list below | |
| `price` | `numeric(12,2)` | not null, `>= 0` | |
| `stock` | `integer` | not null, default 0, `>= 0` | |
| `images` | `text[]` | not null, default `'{}'`, max 8 items, no nulls | Storage **paths**, not URLs |
| `is_active` | `boolean` | not null, default `true` | Inactive = hidden from storefront |
| `created_at` / `updated_at` | `timestamptz` | not null, default `now()` | |

Categories: `case`, `screen_protector`, `charger`, `cable`, `headphones`, `power_bank`, `mount`, `other`.

## 3. Indexes

| Index | Purpose |
| --- | --- |
| `products (user_id, created_at desc)` | Merchant dashboard list + RLS ownership checks |
| `products (created_at desc) where is_active` | Storefront "latest products" |
| `products (category, created_at desc) where is_active` | Storefront category filter |
| `products using gin (title gin_trgm_ops) where is_active` | `ilike` search on title (`pg_trgm`, free extension) |
| `unique profiles (lower(store_name))` | Store names are unique, case-insensitive |

## 4. Functions & Triggers

| Name | Kind | Behavior |
| --- | --- | --- |
| `handle_new_user()` | `security definer`, trigger `after insert on auth.users` | Creates the profile. Reads `display_name`, `role`, `store_name` from `raw_user_meta_data`. Becomes merchant only if `role = 'merchant'` **and** a valid `store_name` is given; if the store name is taken, falls back to `customer` so **sign-up never fails** because of the profile. |
| `set_updated_at()` | trigger `before update` on both tables | Sets `updated_at = now()` |
| `validate_product_images()` | trigger `before insert or update` on `products` | Rejects any image path that does not start with `{user_id}/` or contains `..` |
| `is_merchant()` | `security definer`, `stable` | `true` if `auth.uid()` has `role = 'merchant'`. Used inside RLS policies. |
| `become_merchant(p_store_name text)` | `security definer`, RPC for `authenticated` only | Upgrades the caller to merchant and sets `store_name`. Raises `23505` if the name is taken. |

All functions use `set search_path = ''` and fully-qualified names (Supabase security advisor requirement).

## 5. Row Level Security

RLS is **enabled on every table**. `(select auth.uid())` is used instead of `auth.uid()` so Postgres evaluates it once per query (Supabase performance recommendation).

### 5.1 `profiles`

| Policy | Command | Roles | Rule |
| --- | --- | --- | --- |
| Owner can read own profile | SELECT | authenticated | `id = auth.uid()` |
| Merchant profiles are public | SELECT | anon, authenticated | `role = 'merchant'` |
| Owner can update own profile | UPDATE | authenticated | using + check `id = auth.uid()` |

No INSERT / DELETE policies: rows are created by the trigger and deleted by cascade when the auth user is deleted. Table privileges additionally revoke `INSERT`, `UPDATE`, `DELETE` and grant `UPDATE (display_name, store_name, avatar_url)` only.

### 5.2 `products`

| Policy | Command | Roles | Rule |
| --- | --- | --- | --- |
| Active products are public | SELECT | anon, authenticated | `is_active = true` |
| Owner can read all own products | SELECT | authenticated | `user_id = auth.uid()` (includes inactive) |
| Merchants can create own products | INSERT | authenticated | check `user_id = auth.uid() AND is_merchant()` |
| Owner can update own products | UPDATE | authenticated | using + check `user_id = auth.uid()` (cannot transfer ownership) |
| Owner can delete own products | DELETE | authenticated | using `user_id = auth.uid()` |

`anon` additionally has `INSERT/UPDATE/DELETE` revoked at the privilege level (defense in depth).

### 5.3 Storage — bucket `product-images`

Bucket: `public = true` (images readable by URL without auth), `file_size_limit = 5 MB`, `allowed_mime_types = image/jpeg, image/png, image/webp`.

Object path convention: `{user_id}/{uuid}.webp`.

| Policy on `storage.objects` | Command | Rule |
| --- | --- | --- |
| Merchants can read own folder | SELECT | bucket = `product-images` AND first folder = `auth.uid()` |
| Merchants can upload to own folder | INSERT | same + `is_merchant()` |
| Merchants can update own files | UPDATE | same + `is_merchant()` |
| Merchants can delete own files | DELETE | bucket + own folder |

(SELECT on own folder is required by the Storage API for `upsert` and `remove`. Public reads of a public bucket go through the CDN URL and do not need a policy.)

## 6. Verification Checklist (run after applying the schema)

1. Sign up user A (merchant) and user B (customer) → both rows exist in `profiles` with the right role.
2. As B: `insert into products` → **denied** (not a merchant).
3. As A: insert a product → OK; `user_id` defaults to A.
4. As B: `update products set price = 0 where user_id = A` → 0 rows affected.
5. As A: `update profiles set role = 'customer'` → **permission denied** (column privilege).
6. As anon: select products → only `is_active = true` rows.
7. As A: insert product with `images = '{"<B-id>/x.webp"}'` → **rejected** by trigger.
8. As A: upload to `product-images/<B-id>/x.webp` → **denied** by Storage RLS.
9. Supabase Dashboard → Advisors → Security: **no warnings**.

## 7. Future (not in v1)

`orders`, `order_items` (with stock decrement in a `security definer` function), `compatible_models` for device compatibility filtering, soft delete.
