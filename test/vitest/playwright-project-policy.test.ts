import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import playwrightConfig from "../../playwright.config";

import {
  DESKTOP_BROWSER_PROJECTS,
  isDesktopBrowserProject,
} from "../playwright/project-policy";

const CHROMIUM_E2E_COMMAND = [
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

function isE2ERunCommand(command: string) {
  return /(?:^|\s)npm run (?:test|verify):e2e(?:\s|$)/.test(command) ||
    /(?:^|\s)(?:npx\s+)?playwright test(?:\s|$)/.test(command);
}

function expectChromiumWorkflowPolicy(workflow: string) {
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
    runCommands.filter(isE2ERunCommand),
  ).toEqual([
    CHROMIUM_E2E_COMMAND,
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

  it("configures all supported browser projects for explicit local runs", () => {
    const projects = playwrightConfig.projects ?? [];
    const projectNames = projects.map((project) => project.name);
    const firefox = projects.find((project) => project.name === "firefox");
    const webkit = projects.find((project) => project.name === "webkit");
    const resource = projects.find(
      (project) => project.name === "chromium-resource",
    );
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
  });

  it("keeps pull-request verification on the installed Chromium projects", () => {
    const workflow = readFileSync(".github/workflows/verify.yml", "utf8");

    expectChromiumWorkflowPolicy(workflow);
  });

  it("keeps publish verification on the installed Chromium projects", () => {
    const workflow = readFileSync(".github/workflows/publish.yml", "utf8");

    expectChromiumWorkflowPolicy(workflow);
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
    [
      "the unfiltered E2E alias is added",
      (workflow: string) =>
        workflow.replace(
          "      - name: Install pinned Gitleaks\n",
          "      - run: npm run verify:e2e\n      - name: Install pinned Gitleaks\n",
        ),
    ],
    [
      "Playwright is invoked directly without project filters",
      (workflow: string) =>
        workflow.replace(
          "      - name: Install pinned Gitleaks\n",
          "      - run: npx playwright test --config=playwright.config.ts\n      - name: Install pinned Gitleaks\n",
        ),
    ],
  ])("rejects publish workflow when %s", (_case, mutate) => {
    const workflow = readFileSync(".github/workflows/publish.yml", "utf8");

    expect(() => expectChromiumWorkflowPolicy(mutate(workflow))).toThrow();
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

  it("documents Chromium-only required CI and optional Firefox/WebKit runs", () => {
    const readme = readFileSync("README.md", "utf8");
    const supportBoundaries = readFileSync("docs/05-open-questions.md", "utf8");
    const verificationStrategy = readFileSync(
      "docs/04-verification-strategy.md",
      "utf8",
    );
    const moduleInstructions = readFileSync("AGENTS.md", "utf8");

    expect(readme).toContain("required CI uses Playwright Chromium");
    expect(readme).toContain("Firefox remains an optional explicit Playwright project");
    expect(readme).toContain(
      "Playwright WebKit remains available for explicit engine checks but is not a required CI gate",
    );
    expect(readme).not.toContain("automated with Playwright Chromium and Firefox");
    expect(readme).not.toContain("automated with Playwright WebKit");
    expect(supportBoundaries).toContain(
      "Desktop Chromium is the required automated compatibility target",
    );
    expect(supportBoundaries).toContain(
      "Firefox and Playwright WebKit projects remain available for explicit, non-gating checks",
    );
    expect(supportBoundaries).toContain("Branded Safari on macOS and iOS is not directly verified");
    expect(verificationStrategy).toContain(CHROMIUM_E2E_COMMAND);
    expect(verificationStrategy).toContain(
      "Optional cross-engine verification",
    );
    expect(moduleInstructions).toContain(CHROMIUM_E2E_COMMAND);
    expect(moduleInstructions).toContain("optional cross-engine verification");
    expect(moduleInstructions).not.toContain(
      "run `npm run verify:full` once after focused checks",
    );
  });
});
