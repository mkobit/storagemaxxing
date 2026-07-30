import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["html", { open: "never" }], ["list"]],
  use: {
    baseURL: "http://localhost:5173",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      grepInvert: /@drill-fixture/,
    },
    {
      name: "chromium-e2e-fixtures",
      use: { ...devices["Desktop Chrome"], baseURL: "http://localhost:5174" },
      grep: /@drill-fixture/,
    },
  ],
  webServer: [
    {
      command: "bun run dev",
      url: "http://localhost:5173",
      reuseExistingServer: !process.env.CI,
    },
    {
      command: "bun run dev",
      url: "http://localhost:5174",
      reuseExistingServer: !process.env.CI,
      env: { E2E_DRILL_FIXTURE: "true", PORT: "5174" },
    },
  ],
});
