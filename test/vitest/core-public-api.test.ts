import { describe, expect, it } from "vitest";
import * as core from "../../src/core";
import * as root from "../../src";
import * as react from "../../src/react";
import inventory from "./fixtures/core-public-api.json";

describe("public entry boundaries", () => {
  it("exposes only the approved neutral Core inventory", () => {
    expect(Object.keys(core).sort()).toEqual(inventory);
    expect(core).not.toHaveProperty("useDashboardGrid");
    expect(core).not.toHaveProperty("createDashboardResizeScheduler");
    expect(core).not.toHaveProperty("dashboardGridInternalReducer");
    const state = core.createDashboardLayoutState({ columns: 6, widgets: [] });
    expect(core.serializeDashboardState(state).columns).toBe(6);
  });
  it("keeps root and explicit React exports identical", () => {
    expect(Object.keys(root).sort()).toEqual(Object.keys(react).sort());
    for (const key of Object.keys(root) as Array<keyof typeof root>) expect(root[key]).toBe(react[key]);
  });
});
