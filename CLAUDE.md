# Repository Guidelines & AI Rules

## Core Mandates & Operating Rules
- **Operational Cost:** $0 USD strictly. Never suggest or integrate paid APIs, hosted services outside free tiers, or paid infrastructure.
- **Package Manager:** Exclusively use `pnpm`. Never execute `npm` or `yarn` commands.
- **Language Standard:** ALL code identifiers, variables, type names, interface declarations, database columns, and function names MUST be written in English.
- **Git Commits:** Every commit message MUST strictly adhere to the **Conventional Commits** specification (`feat:`, `fix:`, `docs:`, `style:`, `refactor:`, `test:`, `chore:`) written in English too, be specific.
- **Source of Truth:** Before implementing any feature, consult the respective spec inside `.specs/`.

---

## Technical Stack & Architecture ($0 Tier)
- **Framework:** Next.js (App Router), React, TypeScript (Strict Mode).
- **Styling & UI:** Tailwind CSS, `clsx`, `tailwind-merge`, `lucide-react`, shadcn/ui.
- **Database & Auth:** Supabase PostgreSQL with Row Level Security (RLS) and Supabase Auth.
- **Storage:** Supabase Storage (direct client-to-bucket upload via pre-signed URLs or public buckets to bypass Next.js Serverless execution limit).
- **Deployment Target:** Vercel (Hobby Free Tier).

---

## Clean Code & Software Engineering Standards
- **Function Conventions:** Use explicit arrow function declarations with typed return signatures where applicable. Favor modular, single-responsibility functions.
- **Data Guardrails:** Every database query MUST respect multi-tenancy isolation (`user_id`). Never issue queries without Row Level Security or manual ownership checks.
- **Type Safety:** No `any` types. Strictly define TypeScript interfaces/types matching the Supabase DB schema (`types/database.ts`).
- **Server Actions & Mutations:** Validate input payloads on the server side using **Zod** schema validation before interacting with the database.
- **Error Handling:** Return structured Result objects `{ data: T | null, error: string | null }` from Server Actions rather than throwing unhandled runtime exceptions.

---

## Project Commands
- `pnpm dev`: Start local development server
- `pnpm build`: Validate TypeScript types and build project
- `pnpm lint`: Run ESLint analysis
- `pnpm type-check`: Run `tsc --noEmit` for full type validation

---

## SDD Architecture Index (`.specs/`)
- `.specs/01-architecture.md`: Architecture overview and file upload pipeline.
- `.specs/02-database.md`: Supabase SQL schema, indexes, and RLS policies.
- `.specs/03-auth-flow.md`: Middleware, session handling, and merchant role management.
- `.specs/04-products-crud.md`: Product catalog and merchant dashboard API contracts.