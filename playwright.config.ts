import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.COMINS_GRID_LAYOUT_PORT ?? process.env.PORT ?? 6001);
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${port}`;
const isCI = Boolean(process.env.CI);
const skipWebServer = process.env.PLAYWRIGHT_SKIP_WEBSERVER === "1";
const resourceStabilityTest = /keeps 100 widgets stable through repeated column changes/;

export default defineConfig({
  outputDir: "reports/artifacts/playwright",
  reporter: [["html", { open: "never", outputFolder: "reports/artifacts/playwright-html" }], ["list"]],
  testDir: "test/playwright/specs",
  use: {
    baseURL,
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      grepInvert: resourceStabilityTest,
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "mobile-chrome",
      grepInvert: resourceStabilityTest,
      use: { ...devices["Pixel 7"] },
    },
    {
      name: "chromium-resource",
      dependencies: ["chromium", "mobile-chrome"],
      grep: resourceStabilityTest,
      workers: 1,
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: skipWebServer
    ? undefined
    : {
        command: "npm run dev",
        reuseExistingServer: !isCI,
        url: baseURL,
      },
});
