import { createDashboardLayoutState } from "../../src";
import {
  sanitizeDashboardLayoutSnapshot,
  sanitizeDashboardStateSnapshot,
  sanitizeExampleDashboardStateSnapshot,
} from "../../example/src/playground/state-snapshot";

const validWidget = {
  id: "sales",
  title: "Sales",
  locked: true,
  movable: false,
  resizable: true,
  minimized: false,
  maximized: false,
  layout: { id: "sales", x: 4, y: 1, w: 8, h: 2 },
  data: { privateValue: "preserved" },
};

function createValidSnapshot() {
  return {
    columns: 12,
    widgets: [{ ...validWidget, layout: { ...validWidget.layout }, data: { ...validWidget.data } }],
    previousLayouts: {
      sales: { id: "sales", x: 2, y: 0, w: 4, h: 2 },
    },
  };
}

function createValidExampleSnapshot() {
  return {
    columns: 12,
    widgets: [{
      id: "sales",
      title: "Sales",
      layout: { id: "sales", x: 0, y: 0, w: 3, h: 2 },
      data: {
        description: "Monthly recurring revenue",
        fixtureCopyKey: "sales",
        value: "128M",
      },
    }],
  };
}

describe("sanitizeDashboardStateSnapshot", () => {
  it("keeps only valid active layout geometry", () => {
    expect(sanitizeDashboardLayoutSnapshot({
      columns: 12,
      widgets: [{ id: "sales", x: 0, y: 0, w: 3, h: 2 }],
    })).toEqual({
      columns: 12,
      widgets: [{ id: "sales", x: 0, y: 0, w: 3, h: 2 }],
    });
    expect(sanitizeDashboardLayoutSnapshot({
      columns: 12,
      widgets: [{ id: "sales", x: 0, y: 0, w: 3, h: 2 }, { id: "sales", x: 3, y: 0, w: 3, h: 2 }],
    })).toBeUndefined();
  });

  it.each([
    ["negative x", { id: "sales", x: -1, y: 0, w: 3, h: 2 }],
    ["negative y", { id: "sales", x: 0, y: -1, w: 3, h: 2 }],
    ["fractional x", { id: "sales", x: 0.5, y: 0, w: 3, h: 2 }],
    ["fractional y", { id: "sales", x: 0, y: 0.5, w: 3, h: 2 }],
    ["fractional width", { id: "sales", x: 0, y: 0, w: 3.5, h: 2 }],
    ["fractional height", { id: "sales", x: 0, y: 0, w: 3, h: 2.5 }],
    ["zero width", { id: "sales", x: 0, y: 0, w: 0, h: 2 }],
    ["zero height", { id: "sales", x: 0, y: 0, w: 3, h: 0 }],
    ["column overflow", { id: "sales", x: 10, y: 0, w: 3, h: 2 }],
    ["fractional minimum width", { id: "sales", x: 0, y: 0, w: 3, h: 2, minW: 1.5 }],
    ["zero minimum height", { id: "sales", x: 0, y: 0, w: 3, h: 2, minH: 0 }],
    ["minimum width beyond columns", { id: "sales", x: 0, y: 0, w: 3, h: 2, minW: 13 }],
    ["maximum width below minimum width", { id: "sales", x: 0, y: 0, w: 3, h: 2, minW: 3, maxW: 2 }],
    ["maximum height below minimum height", { id: "sales", x: 0, y: 0, w: 3, h: 2, minH: 3, maxH: 2 }],
  ])("rejects active layout %s", (_case, layout) => {
    expect(sanitizeDashboardLayoutSnapshot({ columns: 12, widgets: [layout] })).toBeUndefined();
  });

  it("keeps authoritative top-level state and ignores only unsupported cache keys", () => {
    const sanitized = sanitizeDashboardStateSnapshot({
      ...createValidSnapshot(),
      layoutsByColumn: {
        10: {
          widgets: [{ id: "sales", x: 2, y: 0, w: 5, h: 2 }],
          previousLayouts: {},
        },
        12: {
          widgets: [{ id: "sales", x: 0, y: 0, w: 3, h: 2 }],
          previousLayouts: {},
        },
        99: "UNSUPPORTED_PRIVATE_CACHE_VALUE",
      },
    });

    expect(sanitized).toBeDefined();
    expect(Object.keys(sanitized?.layoutsByColumn ?? {})).toEqual(["10", "12"]);
    expect(sanitized?.layoutsByColumn?.[10]?.widgets).toEqual([
      { id: "sales", x: 2, y: 0, w: 5, h: 2 },
    ]);
    expect(sanitized?.widgets[0]).toEqual(validWidget);

    const restored = createDashboardLayoutState(sanitized!);
    expect(restored.widgets[0]?.layout).toEqual(validWidget.layout);
    expect(restored.previousLayouts.sales).toEqual({ id: "sales", x: 2, y: 0, w: 4, h: 2 });
    expect(restored.layoutsByColumn[10]?.widgets).toEqual([
      { id: "sales", x: 2, y: 0, w: 5, h: 2 },
    ]);
    expect(restored.layoutsByColumn[12]?.widgets).toEqual([validWidget.layout]);
    expect(restored.layoutsByColumn[12]?.previousLayouts.sales).toEqual({
      id: "sales",
      x: 2,
      y: 0,
      w: 4,
      h: 2,
    });
  });

  it.each([
    ["negative active x", { ...validWidget.layout, x: -1 }],
    ["negative active y", { ...validWidget.layout, y: -1 }],
    ["fractional active x", { ...validWidget.layout, x: 4.5 }],
    ["fractional active width", { ...validWidget.layout, w: 7.5 }],
    ["active column overflow", { ...validWidget.layout, x: 5, w: 8 }],
  ])("rejects %s before restore dispatch", (_case, layout) => {
    const snapshot = createValidSnapshot();
    snapshot.widgets[0] = { ...validWidget, data: { ...validWidget.data }, layout: { ...layout } };
    expect(sanitizeDashboardStateSnapshot(snapshot)).toBeUndefined();
  });

  it.each([
    ["malformed widget value", { id: "sales", x: "PRIVATE", y: 0, w: 3, h: 2 }, {}],
    ["negative widget x", { id: "sales", x: -1, y: 0, w: 3, h: 2 }, {}],
    ["fractional widget height", { id: "sales", x: 0, y: 0, w: 3, h: 2.5 }, {}],
    ["widget column overflow", { id: "sales", x: 4, y: 0, w: 3, h: 2 }, {}],
    ["widget invalid width limits", { id: "sales", x: 0, y: 0, w: 3, h: 2, minW: 4, maxW: 2 }, {}],
    ["negative previous y", { id: "sales", x: 0, y: 0, w: 3, h: 2 }, { sales: { id: "sales", x: 0, y: -1, w: 3, h: 2 } }],
    ["fractional previous x", { id: "sales", x: 0, y: 0, w: 3, h: 2 }, { sales: { id: "sales", x: 0.5, y: 0, w: 3, h: 2 } }],
    ["previous column overflow", { id: "sales", x: 0, y: 0, w: 3, h: 2 }, { sales: { id: "sales", x: 4, y: 0, w: 3, h: 2 } }],
    ["unknown previous id", { id: "sales", x: 0, y: 0, w: 3, h: 2 }, { unknown: { id: "unknown", x: 0, y: 0, w: 2, h: 2 } }],
  ])("rejects the whole snapshot for supported cache %s", (_case, layout, previousLayouts) => {
    expect(sanitizeDashboardStateSnapshot({
      ...createValidSnapshot(),
      layoutsByColumn: {
        6: { widgets: [layout], previousLayouts },
        99: "IGNORED_UNSUPPORTED_CACHE",
      },
    })).toBeUndefined();
  });

  it("ignores a malformed unsupported cache while preserving valid supported caches", () => {
    const sanitized = sanitizeDashboardStateSnapshot({
      ...createValidSnapshot(),
      layoutsByColumn: {
        6: {
          widgets: [{ id: "sales", x: 0, y: 0, w: 3, h: 2 }],
          previousLayouts: {},
        },
        99: { widgets: [{ id: "sales", x: -999, y: -999, w: 0, h: 0 }] },
      },
    });

    expect(sanitized).toBeDefined();
    expect(Object.keys(sanitized?.layoutsByColumn ?? {})).toEqual(["6"]);
  });

  it.each([
    ["unsupported columns", { ...createValidSnapshot(), columns: 13 }],
    ["missing widgets", { columns: 12 }],
    ["duplicate widget ids", { ...createValidSnapshot(), widgets: [validWidget, validWidget] }],
    [
      "mismatched top-level layout id",
      { ...createValidSnapshot(), widgets: [{ ...validWidget, layout: { ...validWidget.layout, id: "other" } }] },
    ],
    [
      "non-finite top-level geometry",
      { ...createValidSnapshot(), widgets: [{ ...validWidget, layout: { ...validWidget.layout, x: Number.NaN } }] },
    ],
    [
      "unknown top-level restore id",
      {
        ...createValidSnapshot(),
        previousLayouts: { unknown: { id: "unknown", x: 0, y: 0, w: 2, h: 2 } },
      },
    ],
    [
      "negative top-level restore y",
      {
        ...createValidSnapshot(),
        previousLayouts: { sales: { id: "sales", x: 0, y: -1, w: 2, h: 2 } },
      },
    ],
    [
      "fractional top-level restore x",
      {
        ...createValidSnapshot(),
        previousLayouts: { sales: { id: "sales", x: 0.5, y: 0, w: 2, h: 2 } },
      },
    ],
    [
      "top-level restore column overflow",
      {
        ...createValidSnapshot(),
        previousLayouts: { sales: { id: "sales", x: 11, y: 0, w: 2, h: 2 } },
      },
    ],
    ["non-object cache map", { ...createValidSnapshot(), layoutsByColumn: [] }],
  ])("rejects invalid top-level %s before restore dispatch", (_case, snapshot) => {
    expect(sanitizeDashboardStateSnapshot(snapshot)).toBeUndefined();
  });

  it.each([
    ["title", ["PRIVATE_TITLE"]],
    ["locked", "PRIVATE_LOCKED"],
    ["movable", "PRIVATE_MOVABLE"],
    ["resizable", "PRIVATE_RESIZABLE"],
    ["minimized", "PRIVATE_MINIMIZED"],
    ["maximized", "PRIVATE_MAXIMIZED"],
  ])("rejects an invalid %s metadata value", (key, value) => {
    const snapshot = createValidSnapshot();
    snapshot.widgets[0] = { ...snapshot.widgets[0], [key]: value } as typeof snapshot.widgets[0];

    expect(sanitizeDashboardStateSnapshot(snapshot)).toBeUndefined();
  });

  it("accepts a legacy snapshot without restore maps or column caches", () => {
    const sanitized = sanitizeDashboardStateSnapshot({
      columns: 12,
      widgets: [validWidget],
    });

    expect(sanitized).toEqual({ columns: 12, widgets: [validWidget] });
  });
});

describe("sanitizeExampleDashboardStateSnapshot", () => {
  it("normalizes legacy example data without color or revision", () => {
    const snapshot = createValidExampleSnapshot();
    const result = sanitizeExampleDashboardStateSnapshot(snapshot);
    expect(result?.widgets[0]?.data).toMatchObject({ colorKey: "mint", contentRevision: 0 });
    expect(result?.widgets[0]).not.toBe(snapshot.widgets[0]);
    expect(result?.widgets[0]?.data).not.toBe(snapshot.widgets[0]?.data);
    expect(snapshot.widgets[0]?.data).not.toHaveProperty("colorKey");
    expect(snapshot.widgets[0]?.data).not.toHaveProperty("contentRevision");
  });

  it.each([
    ["colorKey", "private-color"],
    ["contentRevision", -1],
    ["contentRevision", 1.5],
    ["fixtureIndex", 0],
  ])("rejects invalid %s before restore", (key, invalid) => {
    const snapshot = createValidExampleSnapshot();
    (snapshot.widgets[0]!.data as Record<string, unknown>)[key] = invalid;
    expect(sanitizeExampleDashboardStateSnapshot(snapshot)).toBeUndefined();
  });

  it.each(["description", "value"] as const)("rejects object %s data before restore dispatch", (key) => {
    const data: Record<string, unknown> = {
      description: "Monthly recurring revenue",
      fixtureCopyKey: "sales",
      value: "128M",
    };
    data[key] = { privateValue: "DO_NOT_RENDER" };
    const snapshot = {
      ...createValidSnapshot(),
      widgets: [{ ...validWidget, layout: { ...validWidget.layout }, data }],
    };

    expect(sanitizeExampleDashboardStateSnapshot(snapshot)).toBeUndefined();
  });

  it("normalizes string render data while preserving safe fallback for prototype-like presentation keys", () => {
    const snapshot = {
      ...createValidSnapshot(),
      widgets: [{
        ...validWidget,
        layout: { ...validWidget.layout },
        data: {
          description: "Raw description",
          fixtureCopyKey: "__proto__",
          generatedDescriptionKey: "__proto__",
          value: "Raw value",
        },
      }],
    };

    expect(sanitizeExampleDashboardStateSnapshot(snapshot)).toEqual({
      ...snapshot,
      widgets: [{
        ...snapshot.widgets[0],
        data: {
          ...snapshot.widgets[0]?.data,
          colorKey: "mint",
          contentRevision: 0,
        },
      }],
    });
  });
});
