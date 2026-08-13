import { createDashboardLayoutState } from "../../src";
import { sanitizeDashboardStateSnapshot } from "../../example/src/playground/state-snapshot";

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

describe("sanitizeDashboardStateSnapshot", () => {
  it("keeps authoritative top-level state while discarding malformed supported and unsupported caches", () => {
    const sanitized = sanitizeDashboardStateSnapshot({
      ...createValidSnapshot(),
      layoutsByColumn: {
        6: {
          widgets: [{ id: "sales", x: "PRIVATE_CACHE_VALUE", y: 0, w: 3, h: 2 }],
          previousLayouts: {},
        },
        8: {
          widgets: [{ id: "sales", x: 1, y: 0, w: 4, h: 2 }],
          previousLayouts: {
            unknown: { id: "unknown", x: 0, y: 0, w: 4, h: 2 },
          },
        },
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
