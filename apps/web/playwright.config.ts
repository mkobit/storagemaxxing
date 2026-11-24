import { execFileSync } from "node:child_process";
import { defineConfig, devices } from "@playwright/test";

function resolveEphemeralPorts(): readonly [number, number] {
  const script =
    'const net=require("node:net");const open=()=>new Promise((r,j)=>{const s=net.createServer();s.on("error",j);s.listen(0,"127.0.0.1",()=>r(s));});Promise.all([open(),open()]).then(([a,b])=>{const p=[a.address().port,b.address().port];a.close(()=>b.close(()=>process.stdout.write(JSON.stringify(p))));});';
  const raw = execFileSync(process.execPath, ["-e", script], {
    encoding: "utf8",
  });
  return JSON.parse(raw) as [number, number];
}

// Allocate distinct free ports once in the coordinator when PORT is unset and
// pin them in process.env so worker processes inherit identical baseURLs.
if (!process.env.PORT) {
  const [portA, portB] = resolveEphemeralPorts();
  process.env.PORT = String(portA);
  process.env.DRILL_PORT ??= String(portB);
}

const defaultPort = Number(process.env.PORT);
const drillFixturePort = Number(process.env.DRILL_PORT ?? defaultPort + 1);

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [["html", { open: "never" }], ["list"]],
  use: {
    baseURL: `http://127.0.0.1:${defaultPort}`,
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
        baseURL: `http://127.0.0.1:${drillFixturePort}`,
      },
      grep: /@drill-fixture/,
    },
  ],
  webServer: [
    {
      command: `bunx vite build --outDir dist/e2e-default && bunx vite preview --outDir dist/e2e-default --host 127.0.0.1 --port ${defaultPort} --strictPort`,
      url: `http://127.0.0.1:${defaultPort}`,
      reuseExistingServer: false,
      env: { PORT: String(defaultPort) },
    },
    {
      command: `bunx vite build --outDir dist/e2e-drill && bunx vite preview --outDir dist/e2e-drill --host 127.0.0.1 --port ${drillFixturePort} --strictPort`,
      url: `http://127.0.0.1:${drillFixturePort}`,
      reuseExistingServer: false,
      env: { E2E_DRILL_FIXTURE: "true", PORT: String(drillFixturePort) },
    },
  ],
});
