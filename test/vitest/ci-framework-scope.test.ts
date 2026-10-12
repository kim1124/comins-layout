import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { describe, expect, it } from "vitest";
// CLI and CI use this exact implementation; do not duplicate classifier rules.
// @ts-expect-error The dependency-free CLI is native JavaScript.
import { classifyChangedPaths } from "../../scripts/classify-change-scope.mjs";
describe("framework CI scope", () => {
  it.each(["src/core.ts", "src/core/transitions.ts", "src/browser/grid-connection.ts", "src/react/use-dashboard-grid.ts", "src/vue/DashboardGrid.vue", "src/ui/icons.ts", "src/index.ts", "src/react.ts", "src/vue.ts", "vite.config.ts", "vite.example.config.ts", "package-boundary.mjs", "package.json", "package-lock.json", "tsconfig.vue.build.json"])("covers engine and framework candidate %s", path => {
    expect(classifyChangedPaths([path])).toMatchObject({ fast: true, browser: true, cross_browser: true, resource: true });
  });
  it("retains documentation-only and policy scope", () => {
    expect(classifyChangedPaths(["docs/ko/15-core-and-vue.md"])).toEqual({ policy: false, docs: true, fast: false, browser: false, cross_browser: false, resource: false });
    expect(classifyChangedPaths(["AGENTS.md"])).toMatchObject({ policy: true, fast: false, browser: false });
    expect(classifyChangedPaths(["test/vitest/layout-state.test.ts"])).toMatchObject({ fast: true, browser: false });
    expect(classifyChangedPaths(["example/src/styles.css"])).toMatchObject({ fast: true, browser: true, cross_browser: true });
  });
  it("workflow invokes the tested CLI and resource waits for Chromium/mobile success", () => {
    const result = execFileSync(process.execPath, ["scripts/classify-change-scope.mjs"], { input: "src/vue/DashboardGrid.vue\n", encoding: "utf8" });
    expect(result).toContain("resource=true");
    const workflow = readFileSync(".github/workflows/verify.yml", "utf8");
    expect(workflow).toContain('node scripts/classify-change-scope.mjs >> "$GITHUB_OUTPUT"');
    expect(workflow).toContain("name: Isolated package consumers");
    expect(workflow).toContain("needs: [changes, fast, browser_chromium]");
  });
});
