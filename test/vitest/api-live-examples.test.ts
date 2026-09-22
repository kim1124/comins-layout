import { describe, expect, it } from "vitest";
import { apiFeatures } from "../../example/src/docs/content";
import { examplesForApi, liveExamples } from "../../example/src/docs/live-examples";
import { playgroundPaths } from "../../example/src/playground/routes";

describe("API live examples", () => {
  it("reuses only supported Playground routes, never internal fixtures", () => {
    for (const example of Object.values(liveExamples)) {
      expect(playgroundPaths.has(example.path), example.label).toBe(true);
      expect(example.instruction.length).toBeGreaterThan(0);
    }
  });

  it("gives every section and API entry related runnable examples", () => {
    for (const section of apiFeatures) {
      for (const name of [undefined, ...[...section.props, ...section.methods ?? [], ...section.events ?? []].map(entry => entry.name)]) {
        const examples = examplesForApi(section.id, name);
        expect(examples.length, `${section.id}: ${name ?? "overview"}`).toBeGreaterThan(0);
        for (const id of examples) expect(liveExamples[id]).toBeDefined();
      }
    }
  });

  it("selects the specific scenario for easily confused options", () => {
    expect(examplesForApi("api-dashboard-rendering", "engineOptions.staticGrid")).toEqual(["lock"]);
    expect(examplesForApi("api-dashboard-rendering", "engineOptions.sizeToContent")).toEqual(["size"]);
    expect(examplesForApi("api-dashboard-rendering", "responsive.layout / DashboardColumnLayout")).toEqual(["responsive"]);
  });
});
