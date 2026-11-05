import { expect, test, type Page } from "@playwright/test";

// Mobile storefront checks (.specs/05-branding.md §6). They read live catalog data, so
// checks that need products (or a product with several photos) skip when none exist.

const expectNoHorizontalScroll = async (page: Page): Promise<void> => {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow, "page is wider than the screen").toBeLessThanOrEqual(1);
};

const openFirstProduct = async (page: Page): Promise<boolean> => {
  await page.goto("/catalogo");
  const firstTitle = page.locator("article").getByRole("link").filter({ hasText: /\S/ }).first();
  if ((await firstTitle.count()) === 0) return false;
  await firstTitle.click();
  await page.waitForURL(/\/products\/[0-9a-f-]{36}$/);
  return true;
};

test.describe("home", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("shows the hero, the brand header and fits the screen", async ({ page }) => {
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Todo para tu celular.");
    await expect(page.getByRole("banner").getByRole("link", { name: "Guaro Cell, inicio" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Explorar catálogo" })).toBeVisible();
    await expectNoHorizontalScroll(page);
  });

  test("mobile nav is visible and the current page is marked", async ({ page }) => {
    const nav = page.getByRole("navigation", { name: "Principal" }).filter({ visible: true });
    await expect(nav).toHaveCount(1);
    await expect(nav.getByRole("link", { name: "Inicio" })).toHaveAttribute("aria-current", "page");
    await expect(nav.getByRole("link", { name: "Catálogo" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Contacto" })).toBeVisible();
  });

  test("has no public sign-in or sign-up link", async ({ page }) => {
    await expect(page.locator('a[href="/login"], a[href="/register"]')).toHaveCount(0);
  });

  test("Contacto scrolls to the footer", async ({ page }) => {
    await page.getByRole("navigation", { name: "Principal" }).filter({ visible: true }).getByRole("link", { name: "Contacto" }).click();
    await expect(page.locator("#contacto")).toBeInViewport();
    await expect(page.locator("#contacto")).toContainText("Barquisimeto · Lara");
  });

  test("category tile opens the filtered catalog", async ({ page }) => {
    await page.getByRole("link", { name: "Cables", exact: true }).click();
    await expect(page).toHaveURL(/\/catalogo\?category=cable$/);
    await expect(page.getByRole("navigation", { name: "Categorías" }).getByRole("link", { name: "Cables" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await expectNoHorizontalScroll(page);
  });
});

test.describe("catalog", () => {
  test("search keeps the query and shows the empty state", async ({ page }) => {
    await page.goto("/catalogo");
    const search = page.getByRole("search").getByRole("textbox");
    await search.fill("zzz-producto-inexistente");
    await search.press("Enter");
    await expect(page).toHaveURL(/q=zzz-producto-inexistente/);
    await expect(page.getByText("No encontramos productos con esos filtros.")).toBeVisible();
    await expectNoHorizontalScroll(page);
  });

  test("product cards fit the screen in two columns", async ({ page }) => {
    await page.goto("/catalogo");
    const cards = page.locator("article");
    test.skip((await cards.count()) === 0, "No active products to check");
    const box = await cards.first().boundingBox();
    const viewport = page.viewportSize();
    expect(box && viewport && box.width < viewport.width / 2).toBeTruthy();
    await expectNoHorizontalScroll(page);
  });
});

test.describe("product detail", () => {
  test("shows the product without a store link or a self-referencing button", async ({ page }) => {
    test.skip(!(await openFirstProduct(page)), "No active products to open");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByText(/^\$\d/).first()).toBeVisible();
    await expect(page.locator('a[href^="/stores/"]')).toHaveCount(0);
    await expect(page.getByRole("main").getByRole("link", { name: "Ver producto" })).toHaveCount(0);
    await expectNoHorizontalScroll(page);
  });

  test("gallery arrows, thumbnails and swipe change the photo", async ({ page }) => {
    test.skip(!(await openFirstProduct(page)), "No active products to open");
    const next = page.getByRole("button", { name: "Foto siguiente" });
    test.skip((await next.count()) === 0, "First product has a single photo");

    const counter = page.getByRole("region", { name: /^Fotos de/ }).locator("[aria-live]");
    const total = Number((await counter.textContent())?.split("/")[1]);

    await next.click();
    await expect(counter).toHaveText(`2 / ${total}`);
    await page.getByRole("button", { name: "Foto anterior" }).click();
    await expect(counter).toHaveText(`1 / ${total}`);
    // Wraps around from the first photo to the last.
    await page.getByRole("button", { name: "Foto anterior" }).click();
    await expect(counter).toHaveText(`${total} / ${total}`);

    await page.getByRole("button", { name: "Ver foto 1" }).click();
    await expect(counter).toHaveText(`1 / ${total}`);

    // Swipe left = next photo.
    const gallery = await page.getByRole("region", { name: /^Fotos de/ }).boundingBox();
    if (!gallery) throw new Error("Gallery not rendered");
    const y = gallery.y + gallery.height * 0.75;
    await page.mouse.move(gallery.x + gallery.width * 0.8, y);
    await page.mouse.down();
    await page.mouse.move(gallery.x + gallery.width * 0.2, y, { steps: 5 });
    await page.mouse.up();
    await expect(counter).toHaveText(`2 / ${total}`);
  });

  test("unknown product shows not found", async ({ page }) => {
    await page.goto("/products/00000000-0000-4000-8000-000000000000");
    await expect(page.getByRole("heading", { name: "404" })).toBeVisible();
    await expect(page.locator("article")).toHaveCount(0);
  });
});

test.describe("auth pages", () => {
  test("login fits the screen and shows the brand", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("img", { name: "Guaro Cell" })).toBeVisible();
    await expectNoHorizontalScroll(page);
  });
});
