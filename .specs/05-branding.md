# 05 — Branding & Storefront Design (Guaro Cell)

Status: **Draft for review** · Related: [01-architecture](./01-architecture.md), [04-products-crud](./04-products-crud.md)

## 1. Identity

| Item | Value |
| --- | --- |
| Store name | Guaro Cell |
| Tagline | Accesorios para tu celular, tecnología y más. |
| Location | Barquisimeto · Lara |
| Currency | USD, `en-US` format (`$8.99`), 2 decimals (`lib/format.ts`) |
| Font | Plus Jakarta Sans (`next/font/google`, free) |

Store details live in `lib/site-config.ts`. Contact values (`whatsappNumber`, `instagramUrl`, `tiktokUrl`) are `null` until the client provides them; every element that needs one is hidden while it is `null`.

## 2. Palette

Defined once as CSS variables in `app/globals.css` and exposed to Tailwind as `brand`, `brand-strong`, `navy` plus the shadcn tokens.

| Color | Hex | Token | Use |
| --- | --- | --- | --- |
| Azul principal | `#00B4FF` | `--brand`, `--ring` | Details, icons, gradient start, focus ring |
| Azul oscuro | `#0066FF` | `--brand-strong`, `--primary` | Hover, actions, prices, text links |
| Azul petróleo | `#0A1F3D` | `--navy` | Header, footer, hero, auth background |
| Gris claro | `#E5E7EB` | `--border`, `--input` | Borders, separators |
| Gris oscuro | `#1F2937` | `--foreground` | Body text |
| Fondo | `#F8FAFC` | `--background` | Page background |
| Blanco | `#FFFFFF` | `--card` | Cards, surfaces |

Accessibility: white on `#00B4FF` is below WCAG AA (≈2.4:1), so solid surfaces with white text and small text links use `#0066FF`. Primary buttons are a `#00B4FF → #0066FF` gradient and turn solid `#0066FF` on hover.

## 3. Assets

| File | Source | Use |
| --- | --- | --- |
| `public/images/logo.jpg`, `public/images/favicon.png` | Client originals | Not served directly (too large) |
| `public/images/logo-mark.png` (192 px, round, transparent corners) | `favicon.png` | Header/footer mark, hero |
| `public/images/logo-badge.webp` (480 px) | `logo.jpg` | Login/register page |
| `app/icon.png` (64 px), `app/apple-icon.png` (180 px) | `favicon.png` | Browser and iOS icons (Next.js file conventions) |

## 4. Storefront layout

- **Header** (navy, sticky): logo, nav `Inicio` · `Catálogo` · `Contacto` (scrolls to the footer), search icon → `/catalogo`. A dashboard icon appears only for signed-in users; there is **no public sign-in link** (single-seller store, 03-auth-flow §3.5).
- **Home `/`**: hero (headline, CTA "Explorar catálogo", "Compra segura"), category tiles, "Productos destacados".
- **Product card**: image, category chip, title, price, order button.
- **Product detail**: photo carousel (arrows, swipe, keyboard, thumbnails), no merchant link, WhatsApp button only (no "Ver producto" self-link).
- **Footer** (`#contacto`): logo + tagline, location, social icons (when configured), "Delivery", "Compra segura", "Atención personalizada", copyright.

## 5. Ordering (v1)

There is no cart. The order button opens WhatsApp with a prefilled message (product title, price, link). Until `whatsappNumber` is set it reads "Ver producto" and links to the detail page. The mockup's cart icon, "Agregar al carrito" and favorites (heart) are out of scope until a cart/orders spec exists.

## 6. Mobile QA

`tests/e2e/mobile.spec.ts` (Playwright, `pnpm test:e2e`) runs on two phone profiles (Galaxy S9+ 320 px, iPhone 14 390 px) using the system Microsoft Edge, so no browser download is needed. It checks: no horizontal scroll on home, catalog, product and login; mobile nav and active state; no public sign-in links; Contacto scrolls to the footer; category tiles filter the catalog; search empty state; two-column product grid; product detail without store link or self-link; gallery arrows, wrap-around, thumbnails and swipe; 404 for unknown products.

Tests read live catalog data: checks that need products, or a product with 2+ photos, are skipped when that data does not exist. `E2E_BASE_URL` points them at another server (e.g. `next start`).
