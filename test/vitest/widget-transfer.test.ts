import {
  createDashboardLayoutState,
  insertDashboardWidgetAtLayout,
  serializeDashboardState,
  transferDashboardWidget,
} from "../../src";
import type {
  DashboardLayoutSnapshot,
  DashboardLayoutState,
  DashboardWidget,
} from "../../src";

type MetricData = { value: number };

function createSource(
  widgetPatch: Partial<DashboardWidget<MetricData>> = {},
): DashboardLayoutState<MetricData> {
  return createDashboardLayoutState({
    columns: 12,
    widgets: [
      {
        id: "sales",
        title: "Sales",
        data: { value: 42 },
        layout: { id: "sales", x: 6, y: 1, w: 6, h: 2 },
        ...widgetPatch,
      },
    ],
    previousLayouts: {
      sales: { id: "sales", x: 0, y: 0, w: 4, h: 2 },
    },
    layoutsByColumn: {
      6: {
        widgets: [{ id: "sales", x: 3, y: 2, w: 3, h: 2 }],
        previousLayouts: {
          sales: { id: "sales", x: 0, y: 1, w: 3, h: 2 },
        },
      },
    },
  });
}

function createTarget(): DashboardLayoutState<MetricData> {
  return createDashboardLayoutState({
    columns: 6,
    widgets: [
      {
        id: "traffic",
        title: "Traffic",
        data: { value: 7 },
        layout: { id: "traffic", x: 0, y: 0, w: 3, h: 2 },
      },
    ],
    layoutsByColumn: {
      12: {
        widgets: [{ id: "traffic", x: 0, y: 0, w: 6, h: 2 }],
        previousLayouts: {},
      },
    },
  });
}

const targetLayout = { id: "sales", x: 0, y: 0, w: 3, h: 2 } as const;
const targetSnapshot: DashboardLayoutSnapshot = {
  columns: 6,
  widgets: [
    targetLayout,
    { id: "traffic", x: 3, y: 0, w: 3, h: 2 },
  ],
};

describe("dashboard widget transfer", () => {
  it("moves a widget atomically with exact target geometry and every known cache updated", () => {
    const source = createSource();
    const target = createTarget();
    const sourceBefore = serializeDashboardState(source);
    const targetBefore = serializeDashboardState(target);

    const result = transferDashboardWidget({
      source,
      target,
      widgetId: "sales",
      targetLayout,
      targetSnapshot,
      mode: "move",
    });

    expect(result.accepted).toBe(true);
    if (!result.accepted) {
      return;
    }

    expect(result.source.widgets).toEqual([]);
    expect(result.source.previousLayouts).toEqual({});
    expect(result.source.layoutsByColumn[12]?.widgets).toEqual([]);
    expect(result.source.layoutsByColumn[12]?.previousLayouts).toEqual({});
    expect(result.source.layoutsByColumn[6]?.widgets).toEqual([]);
    expect(result.source.layoutsByColumn[6]?.previousLayouts).toEqual({});
    expect(result.target.widgets).toEqual([
      expect.objectContaining({
        id: "traffic",
        layout: { id: "traffic", x: 3, y: 0, w: 3, h: 2 },
      }),
      expect.objectContaining({
        id: "sales",
        title: "Sales",
        data: { value: 42 },
        layout: targetLayout,
      }),
    ]);
    expect(result.target.layoutsByColumn[6]?.widgets).toEqual([
      { id: "traffic", x: 3, y: 0, w: 3, h: 2 },
      targetLayout,
    ]);
    expect(result.target.layoutsByColumn[12]?.widgets).toEqual([
      { id: "traffic", x: 0, y: 0, w: 6, h: 2 },
      { id: "sales", x: 6, y: 0, w: 3, h: 2 },
    ]);
    expect(serializeDashboardState(source)).toEqual(sourceBefore);
    expect(serializeDashboardState(target)).toEqual(targetBefore);
    expect(() => JSON.stringify(serializeDashboardState(result.target))).not.toThrow();
  });

  it("copies a widget without changing the source state", () => {
    const source = createSource();
    const target = createTarget();

    const result = transferDashboardWidget({
      source,
      target,
      widgetId: "sales",
      targetLayout,
      targetSnapshot,
      mode: "copy",
    });

    expect(result.accepted).toBe(true);
    if (!result.accepted) {
      return;
    }

    expect(result.source).toBe(source);
    expect(result.target.widgets.map((widget) => widget.id)).toEqual(["traffic", "sales"]);
  });

  it("rejects a duplicate target id without changing either state", () => {
    const source = createSource();
    const target = createDashboardLayoutState({
      columns: 6,
      widgets: [{ id: "sales", layout: { id: "sales", x: 0, y: 0, w: 3, h: 2 } }],
    });

    const result = transferDashboardWidget({
      source,
      target,
      widgetId: "sales",
      targetLayout,
      targetSnapshot: {
        columns: 6,
        widgets: [{ id: "sales", x: 0, y: 0, w: 3, h: 2 }],
      },
      mode: "move",
    });

    expect(result).toEqual({ accepted: false, reason: "duplicate-id", source, target });
    expect(result.source).toBe(source);
    expect(result.target).toBe(target);
  });

  it("rejects a missing source widget without changing either state", () => {
    const source = createSource();
    const target = createTarget();

    const result = transferDashboardWidget({
      source,
      target,
      widgetId: "missing",
      targetLayout: { ...targetLayout, id: "missing" },
      targetSnapshot: {
        columns: 6,
        widgets: [
          { id: "missing", x: 0, y: 0, w: 3, h: 2 },
          { id: "traffic", x: 3, y: 0, w: 3, h: 2 },
        ],
      },
      mode: "move",
    });

    expect(result).toEqual({ accepted: false, reason: "missing-widget", source, target });
  });

  it.each([
    ["locked", { locked: true }],
    ["non-movable", { movable: false }],
    ["maximized", { maximized: true }],
    ["minimized", { minimized: true }],
  ] as const)("rejects a %s source widget", (_label, patch) => {
    const source = createSource(patch);
    const target = createTarget();

    const result = transferDashboardWidget({
      source,
      target,
      widgetId: "sales",
      targetLayout,
      targetSnapshot,
      mode: "move",
    });

    expect(result).toEqual({ accepted: false, reason: "not-transferable", source, target });
  });

  it.each([
    {
      label: "mismatched target id",
      layout: { ...targetLayout, id: "other" },
      snapshot: targetSnapshot,
    },
    {
      label: "non-finite target geometry",
      layout: { ...targetLayout, x: Number.NaN },
      snapshot: targetSnapshot,
    },
    {
      label: "different snapshot columns",
      layout: targetLayout,
      snapshot: { ...targetSnapshot, columns: 12 as const },
    },
    {
      label: "incomplete target snapshot",
      layout: targetLayout,
      snapshot: { columns: 6 as const, widgets: [targetLayout] },
    },
    {
      label: "overlapping target snapshot",
      layout: targetLayout,
      snapshot: {
        columns: 6 as const,
        widgets: [
          targetLayout,
          { id: "traffic", x: 2, y: 0, w: 3, h: 2 },
        ],
      },
    },
  ])("rejects $label", ({ layout, snapshot }) => {
    const source = createSource();
    const target = createTarget();

    const result = transferDashboardWidget({
      source,
      target,
      widgetId: "sales",
      targetLayout: layout,
      targetSnapshot: snapshot,
      mode: "move",
    });

    expect(result).toEqual({ accepted: false, reason: "invalid-layout", source, target });
  });

  it("inserts a palette widget without replacing an existing id", () => {
    const target = createTarget();
    const widget: DashboardWidget<MetricData> = {
      id: "sales",
      title: "Sales",
      data: { value: 42 },
      layout: { id: "sales", x: 9, y: 9, w: 1, h: 1 },
    };

    const inserted = insertDashboardWidgetAtLayout(target, widget, targetLayout, targetSnapshot);
    expect(inserted.accepted).toBe(true);
    if (inserted.accepted) {
      expect(inserted.state.widgets[1]?.layout).toEqual(targetLayout);
    }

    const duplicate = insertDashboardWidgetAtLayout(
      inserted.accepted ? inserted.state : target,
      widget,
      targetLayout,
      targetSnapshot,
    );
    expect(duplicate.accepted).toBe(false);
    if (duplicate.accepted) {
      throw new Error("Duplicate insertion was unexpectedly accepted.");
    }
    expect(duplicate.reason).toBe("duplicate-id");
    expect(duplicate.state).toBe(inserted.state);
  });

  it("preserves responsive layout limits that exceed the current target geometry", () => {
    const target = createTarget();
    const constrainedLayout = {
      ...targetLayout,
      minW: 6,
      minH: 3,
      maxW: 12,
      maxH: 8,
    };
    const inserted = insertDashboardWidgetAtLayout(
      target,
      {
        id: "sales",
        layout: { id: "sales", x: 0, y: 0, w: 1, h: 1 },
      },
      constrainedLayout,
      {
        columns: 6,
        widgets: [
          constrainedLayout,
          { id: "traffic", x: 3, y: 0, w: 3, h: 2 },
        ],
      },
    );

    expect(inserted.accepted).toBe(true);
    if (inserted.accepted) {
      expect(inserted.state.widgets[1]?.layout).toEqual(constrainedLayout);
    }
  });
});
