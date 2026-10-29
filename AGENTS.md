<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Project Rules — Phone Accessories Marketplace

Multi-merchant e-commerce for phone accessories: any registered user can become a **merchant** and publish/manage their own products; everyone can browse the public storefront. `CLAUDE.md` holds the same mandates — keep both files in sync.

## 1. Cost Constraint: $0 USD (non-negotiable)
- Operating cost must stay at **$0 USD**. Use only free tiers: Vercel Hobby, Supabase Free (Postgres, Auth, Storage).
- Never add paid APIs, paid SaaS, paid add-ons, or services whose free tier requires a credit card to run in production.
- Stay inside free-tier limits: no Supabase image transformations (Pro only), no Vercel Pro features, no cron/background workers that need paid plans. Compress images in the browser before upload.
- If a requirement cannot be met for $0, stop and raise it instead of picking a paid option.

## 2. Package Manager: pnpm only
Never run `npm` or `yarn` (and never commit `package-lock.json` / `yarn.lock`).

| Task | Command |
| --- | --- |
| Install deps | `pnpm install` |
| Add a dependency | `pnpm add <pkg>` |
| Add a dev dependency | `pnpm add -D <pkg>` |
| One-off CLI (e.g. shadcn, supabase) | `pnpm dlx <cli>` |
| Dev server | `pnpm dev` |
| Production build + type validation | `pnpm build` |
| Lint | `pnpm lint` |
| Full type check | `pnpm type-check` (`tsc --noEmit`) |

## 3. Security Principles
- **RLS is mandatory.** Every table in `public` has Row Level Security enabled with explicit policies. A table without RLS must never be merged.
- **Tenant isolation by `user_id`.** A merchant can only insert, update, or delete rows where `user_id = auth.uid()`. Server code must never trust a `user_id` coming from the client — it is derived from the session.
- **Storage isolation.** Product images live under `product-images/{user_id}/...`; Storage RLS only allows writes inside the caller's own folder.
- **No `service_role` key in app code.** The app uses the anon key + the user's session so RLS always applies. The service role key never reaches the browser, never goes in `NEXT_PUBLIC_*` vars, and is not used by Server Actions.
- **Server-side validation.** Every Server Action validates its payload with Zod before touching the database and returns `{ data, error }` instead of throwing.
- **Auth checks happen on the server.** `proxy.ts` (Next.js 16's renamed Middleware) only refreshes the session and does optimistic redirects; every protected page and Server Action re-verifies the user with Supabase.
- Secrets live in `.env.local` (git-ignored) and Vercel env vars only.

## 4. Specs Are the Source of Truth (`.specs/`)
Spec-Driven Development: read the relevant spec **before** implementing, and update the spec **in the same change** when behavior changes. If code and spec disagree, the spec wins until it is explicitly amended.

- `.specs/01-architecture.md` — $0 stack, data flow, direct browser → Supabase Storage upload pipeline.
- `.specs/02-database.md` — tables, constraints, indexes, triggers, RLS and Storage policies. Executable version: `supabase/schema.sql`.
- `.specs/03-auth-flow.md` — Supabase Auth, HttpOnly cookie sessions, `proxy.ts`, merchant role.
- `.specs/04-products-crud.md` — merchant dashboard, public storefront, Server Action contracts, forms.

## 5. Code Conventions
- All identifiers, types, DB columns, and function names in **English**.
- TypeScript strict, no `any`. DB types live in `types/database.ts` (generated with `pnpm dlx supabase gen types typescript`).
- Arrow functions with explicit return types; small single-responsibility modules.
- Commits follow **Conventional Commits** in English (`feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`, `style:`).
