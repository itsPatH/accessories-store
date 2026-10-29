# 01 — Architecture

Status: **Draft for review** · Owner: Patricia Herrera · Related: [02-database](./02-database.md), [03-auth-flow](./03-auth-flow.md), [04-products-crud](./04-products-crud.md)

## 1. Product Scope

A multi-merchant marketplace for **phone accessories** (cases, screen protectors, chargers, cables, headphones, power banks, mounts).

| Actor | Can do |
| --- | --- |
| Visitor (anon) | Browse active products, view product detail, view a merchant's storefront. |
| Customer (signed in) | Everything a visitor can + manage own profile. (Cart/checkout are out of scope for v1.) |
| Merchant (signed in, `role = 'merchant'`) | Everything a customer can + create, edit, activate/deactivate, delete **their own** products and upload their images. |

Out of scope for v1: payments, orders, cart, reviews, admin panel. They will get their own specs.

## 2. The $0 Stack

| Layer | Choice | Free-tier limits that matter |
| --- | --- | --- |
| Frontend + backend | Next.js 16 (App Router, React Server Components, Server Actions), TypeScript strict | — |
| UI | Tailwind CSS v4, shadcn/ui, `clsx`, `tailwind-merge`, `lucide-react` | — |
| Validation | Zod (server-side in every Server Action) | — |
| Database | Supabase Postgres + Row Level Security | 500 MB DB, project **pauses after 7 days without activity** |
| Auth | Supabase Auth (email + password) via `@supabase/ssr` | 50k MAU; built-in SMTP is rate-limited (few emails/hour) — fine for dev |
| File storage | Supabase Storage, public bucket `product-images` | 1 GB storage, 5 GB egress / month, **no image transformations** |
| Hosting | Vercel Hobby | Serverless request body limit ~4.5 MB, limited `next/image` optimizations |
| Package manager | pnpm | — |

### 2.1 Known $0 risks (must be accepted or mitigated)

1. **Vercel Hobby is for personal / non-commercial use** under Vercel's fair-use terms. A store that sells real products is commercial use. Acceptable for development, demos, and a portfolio; before real sales, re-evaluate hosting (another host with a commercial-friendly free tier) — this would not change the code, only the deploy target.
2. **Supabase pauses inactive free projects.** A paused project returns errors until restored from the dashboard. Acceptable for v1.
3. **Storage egress (5 GB/month).** Mitigated by compressing images to WebP (max 1600 px, ~200 KB) in the browser before upload and serving them with long cache headers.
4. **`next/image` optimization quota on Hobby.** Product images use `unoptimized` (already compressed at upload) to avoid burning the quota.

## 3. Runtime Data Flow

```
Browser ──HTTP──► Vercel (Next.js)
                    │  proxy.ts            → refreshes Supabase session cookies (HttpOnly)
                    │  Server Components   → read data with the user's session (RLS applies)
                    │  Server Actions      → Zod validate → mutate with the user's session (RLS applies)
                    ▼
                 Supabase (Postgres + Auth + Storage)

Browser ──PUT (binary)──────────────────────► Supabase Storage   (signed upload URL, never via Vercel)
```

Rules:
- **Reads** happen in Server Components using a per-request Supabase server client (`lib/supabase/server.ts`). No client-side data fetching for catalog pages; pages are cacheable where possible.
- **Writes** happen only in Server Actions. Each action: (1) gets the user from the session, (2) validates input with Zod, (3) runs the query with the user's session so RLS is the final guard, (4) returns `Result<T> = { data: T | null; error: string | null }`.
- **The browser never holds the Supabase session.** Auth cookies are HttpOnly (see 03-auth-flow). The browser talks to Supabase directly only to PUT image binaries to a signed upload URL.
- The `service_role` key is **not used** by the app.

## 4. Image Upload Pipeline (browser → Supabase Storage)

Goal: binaries never pass through a Vercel Serverless Function (body limit, execution time, cost).

```
1. Merchant picks files in the product form (max 8 images per product).
2. Browser validates type (jpeg/png/webp) and compresses → WebP, ≤1600px, target ≤ 300 KB.
3. Browser calls Server Action  createImageUploadUrls({ count, contentTypes })
     └─ server: getUser() → is merchant? → Zod validate
     └─ server: for each file, path = `${user.id}/${crypto.randomUUID()}.webp`
     └─ server: supabase.storage.from('product-images').createSignedUploadUrl(path)
            (runs with the user's session → Storage RLS "insert into own folder" is checked here)
     └─ returns [{ path, token }]
4. Browser uploads each file directly:
     supabase.storage.from('product-images').uploadToSignedUrl(path, token, file)
   (an anon-key browser client is enough; the token authorizes exactly that path)
5. Browser submits the product form with images = [path, ...] (storage paths, not URLs).
6. Server Action createProduct/updateProduct validates that every path starts with `${user.id}/`
   (also enforced by a DB trigger, see 02-database).
7. Public URL is derived at render time: getPublicUrl(path).
```

Defense in depth for uploads:
- Bucket-level limits: `file_size_limit = 5 MB`, `allowed_mime_types = image/jpeg, image/png, image/webp`.
- Storage RLS: authenticated merchants can only write under `{auth.uid()}/`.
- DB trigger: `products.images` paths must start with the owner's `user_id`.

Orphaned files (uploaded but form abandoned) are tolerated in v1. When a product is deleted or an image removed, the Server Action deletes the storage objects too.

## 5. Proposed Folder Structure (to implement after spec approval)

```
app/
  (storefront)/            public catalog, product detail, merchant store pages
  (auth)/login, register    auth forms
  auth/callback/route.ts    email confirmation code exchange
  dashboard/                merchant area (protected)
components/ui/              shadcn/ui primitives
components/                 feature components
lib/supabase/server.ts      server client (HttpOnly cookies)
lib/supabase/proxy.ts       session refresh helper used by proxy.ts
lib/supabase/browser.ts     anon client used ONLY for uploadToSignedUrl
lib/validation/             Zod schemas
lib/result.ts               Result<T> type + helpers
types/database.ts           generated Supabase types
proxy.ts                    Next.js 16 proxy (formerly middleware.ts)
supabase/schema.sql         executable schema (02-database)
```

## 6. Environment Variables

| Name | Where | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | browser + server | public |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | browser + server | public, safe because RLS is enforced (or the new "publishable" key) |
| `NEXT_PUBLIC_SITE_URL` | server | used for auth email redirect URLs |

No other secrets are required in v1.
