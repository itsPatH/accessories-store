import { defineConfig, devices } from "@playwright/test";

// Mobile end-to-end checks for the public storefront (.specs/05-branding.md §6).
// Runs on the system's Microsoft Edge (Chromium), so no browser download is needed ($0, no extra disk).
const BASE_URL = process.env.E2E_BASE_URL ?? "http://localhost:3000";

const edgeMobile = (device: (typeof devices)[string]) => ({
  ...device,
  browserName: "chromium" as const,
  channel: "msedge",
});

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  // Pages read live Supabase data (and compile on demand under `pnpm dev`), so navigations can be slow.
  expect: { timeout: 15_000 },
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    // Small Android phone and a common iPhone size (rendered by Chromium with iPhone viewport/UA).
    { name: "android-small", use: edgeMobile(devices["Galaxy S9+"]) },
    { name: "iphone-14", use: edgeMobile(devices["iPhone 14"]) },
  ],
  // Reuses `pnpm dev` when it is already running.
  webServer: {
    command: "pnpm dev",
    url: BASE_URL,
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
