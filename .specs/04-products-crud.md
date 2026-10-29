# 04 — Products CRUD: Merchant Dashboard & Public Storefront

Status: **Draft for review** · Related: [01-architecture](./01-architecture.md), [02-database](./02-database.md), [03-auth-flow](./03-auth-flow.md)

## 1. Routes

### 1.1 Public storefront (anon + authenticated)

| Route | Rendering | Content |
| --- | --- | --- |
| `/` | Server Component | Latest active products grid, category chips, search box. Query params: `?q=&category=&page=` |
| `/products/[id]` | Server Component | Gallery, title, price, stock status ("Out of stock" when `stock = 0`), description, merchant `store_name` linking to the store. 404 if not found or inactive. |
| `/stores/[merchantId]` | Server Component | Merchant `store_name`, avatar, their active products. 404 if not a merchant. |

Pagination: 24 per page, ordered by `created_at desc`, using `.range(from, to)`. Search uses `title ilike %q%` (trigram index). `q` is trimmed and capped at 100 chars; `category` must be a valid enum value or is ignored.

### 1.2 Merchant dashboard (authenticated merchant)

| Route | Content |
| --- | --- |
| `/dashboard` | Summary: total products, active, out of stock. Links. |
| `/dashboard/products` | Table of own products (incl. inactive): thumbnail, title, price, stock, active toggle, edit, delete. |
| `/dashboard/products/new` | Product form (create) |
| `/dashboard/products/[id]/edit` | Product form (edit). 404 if not owned (RLS returns no row). |
| `/dashboard/settings` | Edit `display_name`, `store_name`, `avatar_url` |
| `/dashboard/onboarding` | Become a merchant (store name) |

## 2. Shared Types

```ts
type Result<T> = { data: T | null; error: string | null };

type ProductCategory =
  | 'case' | 'screen_protector' | 'charger' | 'cable'
  | 'headphones' | 'power_bank' | 'mount' | 'other';
```
`Product`, `Profile` come from `types/database.ts` (`Tables<'products'>`, `Tables<'profiles'>`).

## 3. Zod Schemas (`lib/validation/product.ts`)

```ts
productInputSchema = z.object({
  title:       z.string().trim().min(3).max(120),
  description: z.string().trim().max(5000).default(''),
  category:    z.enum(PRODUCT_CATEGORIES),
  price:       z.coerce.number().min(0).max(9_999_999_999.99).multipleOf(0.01),
  stock:       z.coerce.number().int().min(0).max(1_000_000),
  images:      z.array(z.string().regex(STORAGE_PATH_REGEX)).max(8),
  isActive:    z.coerce.boolean().default(true),
});
// STORAGE_PATH_REGEX = /^[0-9a-f-]{36}\/[0-9a-f-]{36}\.(webp|jpe?g|png)$/
// The server additionally checks every path starts with `${user.id}/`.

productIdSchema    = z.object({ id: z.string().uuid() });
uploadRequestSchema = z.object({
  files: z.array(z.object({
    contentType: z.enum(['image/webp', 'image/jpeg', 'image/png']),
    size: z.number().int().positive().max(5 * 1024 * 1024),
  })).min(1).max(8),
});
```

The client form relies on native HTML constraints (`required`, `min`, `maxLength`) for instant feedback and shows the server's `fieldErrors`; **server validation is authoritative**. Forms submit through `startTransition(() => formAction(formData))` so inputs keep their values when the server rejects them.

## 3.1 Caching (Next.js 16 Cache Components)

- Public storefront reads (`lib/products/queries.ts`) use a cookie-less anon client inside `'use cache'` functions tagged `products` / `stores` with `cacheLife('minutes')`. RLS still limits them to active products and merchant profiles.
- Dashboard reads (`lib/products/merchant-queries.ts`) use the merchant's session and are never cached.
- Every mutation calls `updateTag()` for the affected tag; actions that do not redirect also call `refresh()` so the dashboard re-renders.
- Request-time data (`searchParams`, `params`, the session) is read inside `<Suspense>` boundaries.

## 4. Server Action Contracts (`app/dashboard/products/actions.ts`)

All actions: `'use server'`, call `requireMerchant()`, Zod-validate, never accept `user_id` from the client, return `Result<T>`, and call `revalidatePath` for `/dashboard/products` and affected storefront paths.

| Action | Input | Output `data` | Behavior |
| --- | --- | --- | --- |
| `createImageUploadUrls` | `uploadRequestSchema` | `{ path: string; token: string }[]` | Builds `${user.id}/${uuid}.webp` paths, `createSignedUploadUrl` for each. |
| `createProduct` | `productInputSchema` | `{ id: string }` | Insert with `user_id = user.id`. Redirect to edit page or list on success. |
| `updateProduct` | `productIdSchema.merge(productInputSchema)` | `{ id: string }` | `update ... eq('id', id).eq('user_id', user.id)`; 0 rows → `error: 'Product not found'`. Removed images are deleted from Storage after the row update succeeds. |
| `setProductActive` | `{ id, isActive: boolean }` | `{ id; isActive }` | Toggle visibility. Optimistic UI in the table. |
| `deleteProduct` | `productIdSchema` | `{ id: string }` | Read row's `images`, delete row (RLS-scoped), then `storage.remove(images)`. Storage failure is logged, not surfaced (row already gone). |
| `updateStoreProfile` | `{ displayName?, storeName, avatarUrl? }` | `Profile` | Update own profile; `23505` → "Store name already taken". |
| `becomeMerchant` | `{ storeName }` | `{ ok: true }` | `rpc('become_merchant')`. |

Error messages returned to the UI are generic and user-friendly; raw Postgres errors are logged server-side only. Map: `23505` → duplicate, `42501`/RLS denial → "Not allowed", Zod → first field error per field (`fieldErrors` may be added to `Result` for forms).

> Why `.eq('user_id', user.id)` when RLS already enforces it? Explicit ownership checks are a project rule (CLAUDE.md "Data Guardrails") and make intent obvious in code review; RLS remains the guarantee.

## 5. Product Form (`components/products/product-form.tsx`)

Client Component used by both `new` and `edit`.

| Field | Control (shadcn/ui) | Rules |
| --- | --- | --- |
| Title | `Input` | 3–120 |
| Description | `Textarea` | ≤ 5000 |
| Category | `Select` | enum labels in Spanish for UI, English values |
| Price | `Input type=number step=0.01` | ≥ 0 |
| Stock | `Input type=number step=1` | integer ≥ 0 |
| Images | `ImageUploader` | up to 8, reorder with left/right buttons, first image = cover, remove button |
| Active | `Switch` | default on |

`ImageUploader` behavior:
1. Accept `image/jpeg, image/png, image/webp`; reject others client-side.
2. Compress to WebP ≤1600 px with `<canvas>` (`lib/images/compress-image.ts`, no extra dependency); keep the original if re-encoding does not shrink it.
3. Call `createImageUploadUrls`, then `uploadToSignedUrl` per file with a per-image uploading state.
4. Keep `images: string[]` (paths) in form state; disable submit while uploads are pending or failed.
5. On failure show the per-image error; the merchant removes it and adds the photo again.

UX: submit button shows pending state (`useActionState`), inline alerts for success/error (no toast library in v1), confirmation `AlertDialog` before delete, optimistic visibility switch (`useOptimistic`).

## 6. Rendering Images

`getPublicUrl(path)` from `lib/storage.ts` builds `${SUPABASE_URL}/storage/v1/object/public/product-images/${path}`. Rendered with `next/image` and `unoptimized` (see 01-architecture §2.1). `next.config.ts` must list the Supabase host in `images.remotePatterns`.

## 7. Acceptance Criteria

- A merchant can create, edit, deactivate, reactivate and delete only their own products.
- A customer visiting `/dashboard/products/new` is redirected to onboarding; calling `createProduct` directly returns `Unauthorized` and RLS would also reject it.
- Inactive products never appear on `/`, `/stores/[id]` or `/products/[id]` for other users.
- Image binaries never pass through a Next.js function (verify in the Network tab: PUT goes to `*.supabase.co`).
- `pnpm build` and `pnpm lint` pass with no `any`.
