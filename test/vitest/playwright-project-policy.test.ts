import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import playwrightConfig from "../../playwright.config";

import {
  DESKTOP_BROWSER_PROJECTS,
  isDesktopBrowserProject,
} from "../playwright/project-policy";

describe("Playwright project policy", () => {
  it("classifies Chromium, Firefox, and WebKit as desktop browser projects", () => {
    expect(DESKTOP_BROWSER_PROJECTS).toEqual([
      "chromium",
      "firefox",
      "webkit",
    ]);
    expect(isDesktopBrowserProject("chromium")).toBe(true);
    expect(isDesktopBrowserProject("firefox")).toBe(true);
    expect(isDesktopBrowserProject("webkit")).toBe(true);
    expect(isDesktopBrowserProject("mobile-chrome")).toBe(false);
    expect(isDesktopBrowserProject("chromium-resource")).toBe(false);
  });

  it("configures all supported browser projects and installs them in CI", () => {
    const projects = playwrightConfig.projects ?? [];
    const projectNames = projects.map((project) => project.name);
    const firefox = projects.find((project) => project.name === "firefox");
    const webkit = projects.find((project) => project.name === "webkit");
    const resource = projects.find(
      (project) => project.name === "chromium-resource",
    );
    const workflow = readFileSync(".github/workflows/verify.yml", "utf8");

    expect(projectNames).toEqual([
      "chromium",
      "firefox",
      "webkit",
      "mobile-chrome",
      "chromium-resource",
    ]);
    expect(firefox?.use).toMatchObject({ defaultBrowserType: "firefox" });
    expect(webkit?.use).toMatchObject({ defaultBrowserType: "webkit" });
    expect(resource?.dependencies).toEqual(["chromium", "mobile-chrome"]);
    expect(workflow).toContain(
      "npx playwright install --with-deps chromium firefox webkit",
    );
  });

  it("keeps publish verification on the installed Chromium projects", () => {
    const workflow = readFileSync(".github/workflows/publish.yml", "utf8");

    expect(workflow).toContain(
      "npx playwright install --with-deps chromium",
    );
    expect(workflow).not.toContain(
      "npx playwright install --with-deps chromium firefox webkit",
    );
    expect(workflow).not.toContain("npm run verify:full");
    expect(workflow).toContain("--project=chromium");
    expect(workflow).toContain("--project=mobile-chrome");
    expect(workflow).toContain("--project=chromium-resource");
  });

  it("does not limit desktop parity scenarios to Chromium", () => {
    const specs = [
      "test/playwright/specs/dashboard-grid.spec.ts",
      "test/playwright/specs/docs-playground-routing.spec.ts",
    ].map((path) => readFileSync(path, "utf8"));

    for (const spec of specs) {
      expect(spec).not.toContain('testInfo.project.name !== "chromium"');
      expect(spec).toContain("isDesktopBrowserProject");
    }
  });

  it("documents the automated engines without claiming branded Safari coverage", () => {
    const readme = readFileSync("README.md", "utf8");
    const supportBoundaries = readFileSync("docs/05-open-questions.md", "utf8");

    expect(readme).toContain("Playwright Chromium and Firefox");
    expect(readme).toContain("Playwright WebKit");
    expect(supportBoundaries).toContain("Branded Safari on macOS and iOS is not directly verified");
    expect(supportBoundaries).not.toContain("Firefox and Safari are not verified or supported");
  });
});
