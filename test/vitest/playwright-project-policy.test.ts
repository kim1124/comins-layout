import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import playwrightConfig from "../../playwright.config";

import {
  DESKTOP_BROWSER_PROJECTS,
  isDesktopBrowserProject,
} from "../playwright/project-policy";

const PUBLISH_E2E_COMMAND = [
  "npm run test:e2e --",
  "--project=chromium",
  "--project=mobile-chrome",
  "--project=chromium-resource",
].join(" ");

function extractWorkflowRunCommands(workflow: string) {
  const lines = workflow.split("\n");
  const commands: string[] = [];

  for (let index = 0; index < lines.length; index += 1) {
    const match = lines[index]?.match(/^(\s*)(?:- )?run:\s*(.*)$/);

    if (!match) {
      continue;
    }

    const [, indentation = "", rawCommand = ""] = match;
    const blockStyle = rawCommand === ">-" || rawCommand === ">" ||
      rawCommand === "|-" || rawCommand === "|";
    const commandParts: string[] = [];

    if (blockStyle) {
      for (index += 1; index < lines.length; index += 1) {
        const line = lines[index] ?? "";
        const lineIndentation = line.match(/^\s*/)?.[0].length ?? 0;

        if (line.trim() !== "" && lineIndentation <= indentation.length) {
          index -= 1;
          break;
        }

        commandParts.push(line.trim());
      }
    } else {
      commandParts.push(rawCommand);
    }

    commands.push(commandParts.join(" ").replace(/\s+/g, " ").trim());
  }

  return commands;
}

function expectVerifyWorkflowPolicy(workflow: string) {
  const runCommands = extractWorkflowRunCommands(workflow);

  expect(
    runCommands.filter((command) =>
      command.includes("playwright install --with-deps")
    ),
  ).toEqual([
    "npx playwright install --with-deps chromium firefox webkit",
  ]);
  expect(runCommands).toContain("npm run verify:full");
}

function expectPublishWorkflowPolicy(workflow: string) {
  const runCommands = extractWorkflowRunCommands(workflow);

  expect(
    runCommands.filter((command) =>
      command.includes("playwright install --with-deps")
    ),
  ).toEqual([
    "npx playwright install --with-deps chromium",
  ]);
  expect(runCommands).toContain("npm run verify");
  expect(runCommands).not.toContain("npm run verify:full");
  expect(
    runCommands.filter((command) => command.includes("npm run test:e2e")),
  ).toEqual([
    PUBLISH_E2E_COMMAND,
  ]);
}

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
    expectVerifyWorkflowPolicy(workflow);
  });

  it("keeps publish verification on the installed Chromium projects", () => {
    const workflow = readFileSync(".github/workflows/publish.yml", "utf8");

    expectPublishWorkflowPolicy(workflow);
  });

  it.each([
    [
      "the package baseline command is missing",
      (workflow: string) => workflow.replace("      - run: npm run verify\n", ""),
    ],
    [
      "the explicit Chromium project is missing",
      (workflow: string) => workflow.replace("          --project=chromium\n", ""),
    ],
    [
      "Firefox is added to the publish E2E command",
      (workflow: string) =>
        workflow.replace(
          "          --project=chromium-resource\n",
          "          --project=chromium-resource\n          --project=firefox\n",
        ),
    ],
    [
      "an unfiltered E2E command is added",
      (workflow: string) =>
        workflow.replace(
          "      - name: Install pinned Gitleaks\n",
          "      - run: npm run test:e2e\n      - name: Install pinned Gitleaks\n",
        ),
    ],
  ])("rejects publish workflow when %s", (_case, mutate) => {
    const workflow = readFileSync(".github/workflows/publish.yml", "utf8");

    expect(() => expectPublishWorkflowPolicy(mutate(workflow))).toThrow();
  });

  it("rejects PR verification without the full browser gate", () => {
    const workflow = readFileSync(".github/workflows/verify.yml", "utf8");
    const withoutFullVerification = workflow.replace(
      "      - run: npm run verify:full\n",
      "",
    );

    expect(() =>
      expectVerifyWorkflowPolicy(withoutFullVerification),
    ).toThrow();
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
