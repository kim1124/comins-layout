import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import playwrightConfig from "../../playwright.config";

describe("Playwright project policy", () => {
  it("scopes supported browser projects to affected scenarios without retries", () => {
    const projects = playwrightConfig.projects ?? [];
    const projectNames = projects.map((project) => project.name);
    const chromium = projects.find((project) => project.name === "chromium");
    const firefox = projects.find((project) => project.name === "firefox");
    const mobileChrome = projects.find((project) => project.name === "mobile-chrome");
    const resource = projects.find(
      (project) => project.name === "chromium-resource",
    );
    const workflow = readFileSync(".github/workflows/verify.yml", "utf8");
    const configSource = readFileSync("playwright.config.ts", "utf8");

    expect(projectNames).toEqual([
      "chromium",
      "firefox",
      "mobile-chrome",
      "chromium-resource",
    ]);
    expect(firefox?.use).toMatchObject({ defaultBrowserType: "firefox" });
    expect(firefox?.grep).toEqual(/@desktop-browser/);
    expect(mobileChrome?.grep).toEqual(/@mobile-touch/);
    expect(chromium?.grepInvert).toEqual([
      /@resource-stability/,
      /@mobile-touch/,
    ]);
    expect(resource?.dependencies).toEqual(["chromium", "mobile-chrome"]);
    expect(workflow).toContain("name: Chromium E2E");
    expect(workflow).toContain("name: Firefox E2E");
    expect(workflow).toContain("name: 100-widget resource");
    expect(workflow).toContain("npx playwright install --with-deps chromium");
    expect(workflow).toContain("npx playwright install --with-deps firefox");
    expect(workflow).toContain("--project=chromium --project=mobile-chrome");
    expect(workflow).toContain("--project=firefox");
    expect(workflow).not.toContain("webkit");
    expect(workflow).toContain("--project=chromium-resource --no-deps");
    expect(workflow).not.toContain("npm run verify:full");
    expect(workflow).toContain("required-verification: failed");
    expect(configSource).toContain('? [["github"]');
    expect(playwrightConfig.retries).toBe(0);
    expect(configSource).toContain("retries: 0");
    expect(configSource).toContain('trace: "retain-on-failure"');
  });

});
