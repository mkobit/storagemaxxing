import { defineConfig, devices } from "@playwright/test";

const defaultPort = Number(process.env.PORT ?? 5175);
const drillFixturePort = Number(process.env.DRILL_PORT ?? defaultPort + 1);

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["html", { open: "never" }], ["list"]],
  use: {
    baseURL: `http://localhost:${defaultPort}`,
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
      use: {
        ...devices["Desktop Chrome"],
        baseURL: `http://localhost:${drillFixturePort}`,
      },
      grep: /@drill-fixture/,
    },
  ],
  webServer: [
    {
      command: `bun run dev --port ${defaultPort}`,
      url: `http://localhost:${defaultPort}`,
      reuseExistingServer: false,
      env: { PORT: String(defaultPort) },
    },
    {
      command: `bun run dev --port ${drillFixturePort}`,
      url: `http://localhost:${drillFixturePort}`,
      reuseExistingServer: false,
      env: { E2E_DRILL_FIXTURE: "true", PORT: String(drillFixturePort) },
    },
  ],
});
