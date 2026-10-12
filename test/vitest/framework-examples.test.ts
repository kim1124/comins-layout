import { describe, expect, it } from "vitest";
import { exampleCatalog, resolveExample } from "../../example/src/shared/example-catalog";
import { vueExamples } from "../../example/src/vue/examples/registry";
import { playgroundPaths } from "../../example/src/playground/routes";
import { getLiveExampleUrl } from "../../example/src/docs/live-examples";

describe("framework example catalog", () => {
  it("covers all 23 canonical routes with real Vue implementations", () => {
    expect(exampleCatalog).toHaveLength(23);
    expect(exampleCatalog.map(item => item.path).sort()).toEqual([...playgroundPaths].sort());
    expect(Object.keys(vueExamples).sort()).toEqual(exampleCatalog.map(item => item.id).sort());
    for (const entry of Object.values(vueExamples)) {
      expect(entry.component).toBeTruthy();
      expect(entry.source).toContain("<template>");
      expect(entry.source).not.toMatch(/from ["']react|ParityFixture|__test__/);
    }
  });
  it("only resolves registered IDs and forwards explicit locale", () => {
    for (const id of ["../src/main.tsx", "__proto__", "constructor", "__test__/parity", "https://evil.test", "widget/basic?embed=0"]) {
      expect(resolveExample(id)).toBeUndefined();
      expect(() => getLiveExampleUrl(id, "vue", "ko")).toThrow();
    }
    expect(getLiveExampleUrl("widget/basic", "react", "en")).toBe("/examples/widget/basic?embed=1&locale=en");
    const url = new URL(getLiveExampleUrl("widget/basic", "vue", "ko"), "https://example.test");
    expect(url.pathname).toBe("/vue.html");
    expect(Object.fromEntries(url.searchParams)).toEqual({ example: "widget/basic", embed: "1", locale: "ko" });
  });
});
