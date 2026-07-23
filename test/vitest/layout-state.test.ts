import {
  addDashboardWidget,
  applyDashboardLayoutSnapshot,
  autoArrangeDashboardWidgets,
  clearDashboardWidgets,
  createDashboardLayoutState,
  fitDashboardWidgetToColumns,
  fitDashboardWidgetsToColumns,
  maximizeDashboardWidget,
  minimizeDashboardWidget,
  removeDashboardWidget,
  restoreDashboardWidget,
  serializeDashboardState,
  serializeDashboardLayout,
  setDashboardColumns,
  updateDashboardWidget,
  updateDashboardWidgetLayout,
} from "../../src";
import type { DashboardStateSnapshotInput } from "../../src";

describe("dashboard layout state", () => {
  it("adds, updates, removes, and serializes widgets without mutating previous state", () => {
    const state = createDashboardLayoutState({ columns: 6, widgets: [] });
    const withWidget = addDashboardWidget(state, {
      id: "sales",
      title: "Sales",
      layout: { id: "sales", x: 0, y: 0, w: 2, h: 2 },
    });
    const updated = updateDashboardWidget(withWidget, "sales", { title: "Revenue" });
    const moved = updateDashboardWidgetLayout(updated, "sales", { x: 2, w: 3 });
    const removed = removeDashboardWidget(moved, "sales");

    expect(state.widgets).toEqual([]);
    expect(serializeDashboardLayout(moved)).toEqual({
      columns: 6,
      widgets: [{ id: "sales", x: 2, y: 0, w: 3, h: 2 }],
    });
    expect(moved.widgets[0]?.title).toBe("Revenue");
    expect(serializeDashboardLayout(removed)).toEqual({ columns: 6, widgets: [] });
  });

  it("applies an engine layout snapshot atomically while preserving widget data and order", () => {
    const state = createDashboardLayoutState({
      columns: 12,
      widgets: [
        { id: "sales", title: "Sales", data: { value: 10 }, layout: { id: "sales", x: 0, y: 0, w: 4, h: 2 } },
        { id: "orders", title: "Orders", data: { value: 20 }, layout: { id: "orders", x: 4, y: 0, w: 4, h: 2 } },
      ],
    });

    const applied = applyDashboardLayoutSnapshot(state, {
      columns: 6,
      widgets: [
        { id: "orders", x: 3, y: 1, w: 3, h: 2 },
        { id: "sales", x: 0, y: 1, w: 3, h: 2 },
        { id: "unknown", x: 0, y: 5, w: 1, h: 1 },
      ],
    });

    expect(applied.columns).toBe(6);
    expect(applied.widgets.map((widget) => widget.id)).toEqual(["sales", "orders"]);
    expect(applied.widgets[0]).toMatchObject({ title: "Sales", data: { value: 10 }, layout: { x: 0, y: 1, w: 3 } });
    expect(applied.widgets[1]).toMatchObject({ title: "Orders", data: { value: 20 }, layout: { x: 3, y: 1, w: 3 } });
    expect(state.columns).toBe(12);
    expect(state.widgets[0]?.layout).toMatchObject({ x: 0, y: 0, w: 4 });
  });

  it("places a new widget in the first horizontal space that fits its requested size", () => {
    const state = createDashboardLayoutState({
      columns: 6,
      widgets: [
        { id: "sales", layout: { id: "sales", x: 0, y: 0, w: 2, h: 2 } },
        { id: "traffic", layout: { id: "traffic", x: 2, y: 0, w: 2, h: 2 } },
      ],
    });

    const added = addDashboardWidget(state, {
      id: "orders",
      title: "Orders",
      layout: { id: "orders", x: 0, y: 0, w: 2, h: 2 },
    });

    expect(serializeDashboardLayout(added)).toEqual({
      columns: 6,
      widgets: [
        { id: "sales", x: 0, y: 0, w: 2, h: 2 },
        { id: "traffic", x: 2, y: 0, w: 2, h: 2 },
        { id: "orders", x: 4, y: 0, w: 2, h: 2 },
      ],
    });
  });

  it("maximizes, minimizes, and restores a widget from the stored previous layout", () => {
    const state = createDashboardLayoutState({
      columns: 6,
      widgets: [{ id: "sales", layout: { id: "sales", x: 1, y: 2, w: 2, h: 3 } }],
    });

    const maximized = maximizeDashboardWidget(state, "sales");
    expect(maximized.widgets[0]).toMatchObject({
      maximized: true,
      minimized: false,
      layout: { id: "sales", x: 0, y: 0, w: 6, h: 3 },
    });

    const minimized = minimizeDashboardWidget(maximized, "sales");
    expect(minimized.widgets[0]).toMatchObject({
      maximized: false,
      minimized: true,
      layout: { id: "sales", x: 0, y: 0, w: 6, h: 1 },
    });

    const restored = restoreDashboardWidget(minimized, "sales");
    expect(restored.widgets[0]).toMatchObject({
      maximized: false,
      minimized: false,
      layout: { id: "sales", x: 1, y: 2, w: 2, h: 3 },
    });
  });

  it("clamps columns and arranges widgets in rows", () => {
    const state = createDashboardLayoutState({
      columns: 4,
      widgets: [
        { id: "a", layout: { id: "a", x: 0, y: 0, w: 3, h: 2 } },
        { id: "b", layout: { id: "b", x: 0, y: 2, w: 3, h: 1 } },
        { id: "c", layout: { id: "c", x: 0, y: 3, w: 2, h: 1 } },
      ],
    });

    const twelveColumns = setDashboardColumns(state, 20);
    const arranged = autoArrangeDashboardWidgets(setDashboardColumns(twelveColumns, 4));

    expect(twelveColumns.columns).toBe(12);
    expect(serializeDashboardLayout(arranged)).toEqual({
      columns: 4,
      widgets: [
        { id: "a", x: 0, y: 0, w: 3, h: 2 },
        { id: "b", x: 0, y: 2, w: 3, h: 1 },
        { id: "c", x: 0, y: 3, w: 2, h: 1 },
      ],
    });
  });

  it("serializes and restores full widget state for JSON save and restore", () => {
    const state = createDashboardLayoutState({
      columns: 6,
      widgets: [
        {
          id: "sales",
          title: "매출",
          layout: { id: "sales", x: 1, y: 2, w: 3, h: 2 },
          data: { value: "1.28억" },
        },
      ],
    });

    const saved = serializeDashboardState(state);
    const restored = createDashboardLayoutState(saved);

    expect(saved).toEqual({
      columns: 6,
      previousLayouts: {},
      widgets: [
        {
          id: "sales",
          title: "매출",
          layout: { id: "sales", x: 1, y: 2, w: 3, h: 2 },
          data: { value: "1.28억" },
        },
      ],
    });
    expect(restored.widgets[0]).toMatchObject({
      id: "sales",
      title: "매출",
      layout: { id: "sales", x: 1, y: 2, w: 3, h: 2 },
      data: { value: "1.28억" },
    });
  });

  it("restores original geometry after a maximized state snapshot is rehydrated", () => {
    const initial = createDashboardLayoutState({
      columns: 6,
      widgets: [{ id: "sales", layout: { id: "sales", x: 2, y: 1, w: 2, h: 2 } }],
    });

    const saved = serializeDashboardState(maximizeDashboardWidget(initial, "sales"));
    const restored = restoreDashboardWidget(createDashboardLayoutState(saved), "sales");

    expect(saved.previousLayouts).toEqual({ sales: { id: "sales", x: 2, y: 1, w: 2, h: 2 } });
    expect(restored.widgets[0]?.layout).toEqual({ id: "sales", x: 2, y: 1, w: 2, h: 2 });
  });

  it("restores original geometry after a minimized state snapshot is rehydrated", () => {
    const initial = createDashboardLayoutState({
      columns: 6,
      widgets: [{ id: "sales", layout: { id: "sales", x: 1, y: 2, w: 3, h: 2 } }],
    });

    const saved = serializeDashboardState(minimizeDashboardWidget(initial, "sales"));
    const restored = restoreDashboardWidget(createDashboardLayoutState(saved), "sales");

    expect(restored.widgets[0]?.layout).toEqual({ id: "sales", x: 1, y: 2, w: 3, h: 2 });
  });

  it("loads a legacy state snapshot without previous layouts", () => {
    const snapshot: DashboardStateSnapshotInput<{ value: string }> = {
      columns: 6,
      widgets: [{ id: "sales", layout: { id: "sales", x: 1, y: 2, w: 3, h: 2 }, data: { value: "1.28억" } }],
    };
    const restored = createDashboardLayoutState(snapshot);

    expect(restored.previousLayouts).toEqual({});
  });

  it("discards restore entries with a stale widget id or mismatched layout id", () => {
    const restored = createDashboardLayoutState({
      columns: 6,
      widgets: [{ id: "sales", layout: { id: "sales", x: 1, y: 2, w: 3, h: 2 } }],
      previousLayouts: {
        sales: { id: "traffic", x: 0, y: 0, w: 3, h: 2 },
        removed: { id: "removed", x: 0, y: 0, w: 3, h: 2 },
      },
    });

    expect(restored.previousLayouts).toEqual({});
  });

  it("clears all widgets and previous layout snapshots", () => {
    const state = maximizeDashboardWidget(
      createDashboardLayoutState({
        columns: 6,
        widgets: [{ id: "sales", layout: { id: "sales", x: 0, y: 0, w: 3, h: 2 } }],
      }),
      "sales",
    );

    const cleared = clearDashboardWidgets(state);

    expect(cleared.widgets).toEqual([]);
    expect(cleared.previousLayouts).toEqual({});
    expect(cleared.columns).toBe(6);
  });

  it("expands widgets in each row to fill the current column width", () => {
    const state = createDashboardLayoutState({
      columns: 12,
      widgets: [
        { id: "sales", layout: { id: "sales", x: 0, y: 0, w: 3, h: 2 } },
        { id: "traffic", layout: { id: "traffic", x: 3, y: 0, w: 3, h: 2 } },
        { id: "orders", layout: { id: "orders", x: 0, y: 2, w: 2, h: 2 } },
        { id: "alerts", layout: { id: "alerts", x: 2, y: 2, w: 4, h: 2 } },
      ],
    });

    const fitted = fitDashboardWidgetsToColumns(state);

    expect(serializeDashboardLayout(fitted)).toEqual({
      columns: 12,
      widgets: [
        { id: "sales", x: 0, y: 0, w: 6, h: 2 },
        { id: "traffic", x: 6, y: 0, w: 6, h: 2 },
        { id: "orders", x: 0, y: 2, w: 6, h: 2 },
        { id: "alerts", x: 6, y: 2, w: 6, h: 2 },
      ],
    });
  });

  it("keeps rows unchanged when they already cover all columns without empty space", () => {
    const state = createDashboardLayoutState({
      columns: 12,
      widgets: [
        { id: "sales", layout: { id: "sales", x: 0, y: 0, w: 4, h: 2 } },
        { id: "traffic", layout: { id: "traffic", x: 4, y: 0, w: 8, h: 2 } },
        { id: "orders", layout: { id: "orders", x: 0, y: 2, w: 6, h: 2 } },
        { id: "alerts", layout: { id: "alerts", x: 6, y: 2, w: 6, h: 2 } },
      ],
    });

    const fitted = fitDashboardWidgetsToColumns(state);

    expect(serializeDashboardLayout(fitted)).toEqual({
      columns: 12,
      widgets: [
        { id: "sales", x: 0, y: 0, w: 4, h: 2 },
        { id: "traffic", x: 4, y: 0, w: 8, h: 2 },
        { id: "orders", x: 0, y: 2, w: 6, h: 2 },
        { id: "alerts", x: 6, y: 2, w: 6, h: 2 },
      ],
    });
  });

  it("expands only the selected widget into row empty space", () => {
    const state = createDashboardLayoutState({
      columns: 12,
      widgets: [
        { id: "sales", layout: { id: "sales", x: 0, y: 0, w: 3, h: 2 } },
        { id: "traffic", layout: { id: "traffic", x: 3, y: 0, w: 3, h: 2 } },
        { id: "orders", layout: { id: "orders", x: 0, y: 2, w: 2, h: 2 } },
      ],
    });

    const fitted = fitDashboardWidgetToColumns(state, "sales");

    expect(serializeDashboardLayout(fitted)).toEqual({
      columns: 12,
      widgets: [
        { id: "sales", x: 0, y: 0, w: 9, h: 2 },
        { id: "traffic", x: 9, y: 0, w: 3, h: 2 },
        { id: "orders", x: 0, y: 2, w: 2, h: 2 },
      ],
    });
  });
});
