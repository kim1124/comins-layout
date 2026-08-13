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
      layoutsByColumn: {
        6: {
          previousLayouts: {},
          widgets: [
            {
              id: "sales",
              x: 1,
              y: 2,
              w: 3,
              h: 2,
            },
          ],
        },
      },
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

  describe("column layout snapshots", () => {
    const layoutsByColumn = {
      12: {
        widgets: [
          { id: "sales", x: 0, y: 0, w: 8, h: 2 },
          { id: "traffic", x: 8, y: 0, w: 4, h: 2 },
        ],
        previousLayouts: {},
      },
      6: {
        widgets: [
          { id: "sales", x: 0, y: 0, w: 3, h: 2 },
          { id: "traffic", x: 3, y: 0, w: 3, h: 2 },
        ],
        previousLayouts: {},
      },
    };

    it("migrates a legacy snapshot by creating an active-column cache entry", () => {
      const state = createDashboardLayoutState({
        columns: 6,
        widgets: [
          { id: "sales", layout: { id: "sales", x: 0, y: 0, w: 3, h: 2 } },
          { id: "traffic", layout: { id: "traffic", x: 3, y: 0, w: 3, h: 2 } },
        ],
      });

      expect(state.layoutsByColumn).toEqual({
        6: {
          widgets: [
            { id: "sales", x: 0, y: 0, w: 3, h: 2 },
            { id: "traffic", x: 3, y: 0, w: 3, h: 2 },
          ],
          previousLayouts: {},
        },
      });
    });

    it("round-trips cached column layouts without exposing shared layout references", () => {
      const state = createDashboardLayoutState({
        columns: 12,
        widgets: [
          { id: "sales", layout: { id: "sales", x: 0, y: 0, w: 8, h: 2 } },
          { id: "traffic", layout: { id: "traffic", x: 8, y: 0, w: 4, h: 2 } },
        ],
        layoutsByColumn,
      });
      const saved = serializeDashboardState(state);

      expect(saved.layoutsByColumn).toEqual(layoutsByColumn);
      expect(saved.layoutsByColumn[6]?.widgets[0]).not.toBe(state.layoutsByColumn[6]?.widgets[0]);
      expect(saved.layoutsByColumn[12]?.widgets[0]).not.toBe(state.layoutsByColumn[12]?.widgets[0]);
    });

    it("uses authoritative active widgets and restore layouts over a conflicting active cache entry", () => {
      const state = createDashboardLayoutState({
        columns: 12,
        widgets: [
          { id: "sales", layout: { id: "sales", x: 0, y: 0, w: 9, h: 2 } },
          { id: "traffic", layout: { id: "traffic", x: 9, y: 0, w: 3, h: 2 } },
        ],
        previousLayouts: {
          sales: { id: "sales", x: 1, y: 2, w: 4, h: 2 },
        },
        layoutsByColumn,
      });

      expect(state.layoutsByColumn[12]).toEqual({
        widgets: [
          { id: "sales", x: 0, y: 0, w: 9, h: 2 },
          { id: "traffic", x: 9, y: 0, w: 3, h: 2 },
        ],
        previousLayouts: {
          sales: { id: "sales", x: 1, y: 2, w: 4, h: 2 },
        },
      });
    });

    it("normalizes cached layout geometry and limits against the cached column count", () => {
      const state = createDashboardLayoutState({
        columns: 12,
        widgets: [{ id: "sales", layout: { id: "sales", x: 0, y: 0, w: 8, h: 2 } }],
        layoutsByColumn: {
          6: {
            widgets: [{ id: "sales", x: 5, y: -1, w: 5, h: 0, minW: 10, minH: 0, maxW: 20, maxH: 0 }],
            previousLayouts: {},
          },
        },
      });

      expect(state.layoutsByColumn[6]?.widgets).toEqual([
        { id: "sales", x: 1, y: 0, w: 5, h: 1, minW: 6, minH: 1, maxW: 6, maxH: 1 },
      ]);
    });

    it("discards invalid cache columns, layouts, and restore entries", () => {
      const state = createDashboardLayoutState({
        columns: 12,
        widgets: [
          { id: "sales", layout: { id: "sales", x: 0, y: 0, w: 8, h: 2 } },
          { id: "traffic", layout: { id: "traffic", x: 8, y: 0, w: 4, h: 2 } },
        ],
        layoutsByColumn: {
          0: { widgets: [{ id: "sales", x: 0, y: 0, w: 1, h: 1 }], previousLayouts: {} },
          6: {
            widgets: [
              { id: "sales", x: 0, y: 0, w: 3, h: 2 },
              { id: "unknown", x: 3, y: 0, w: 3, h: 2 },
            ],
            previousLayouts: {
              sales: { id: "traffic", x: 0, y: 0, w: 3, h: 2 },
              unknown: { id: "unknown", x: 0, y: 0, w: 3, h: 2 },
            },
          },
          13: { widgets: [{ id: "sales", x: 0, y: 0, w: 1, h: 1 }], previousLayouts: {} },
          desktop: { widgets: [{ id: "sales", x: 0, y: 0, w: 1, h: 1 }], previousLayouts: {} },
        } as unknown as DashboardStateSnapshotInput["layoutsByColumn"],
      });

      expect(state.layoutsByColumn).toEqual({
        6: {
          widgets: [{ id: "sales", x: 0, y: 0, w: 3, h: 2 }],
          previousLayouts: {},
        },
        12: {
          widgets: [
            { id: "sales", x: 0, y: 0, w: 8, h: 2 },
            { id: "traffic", x: 8, y: 0, w: 4, h: 2 },
          ],
          previousLayouts: {},
        },
      });
    });

    it("keeps the legacy layout serializer limited to active columns and widget layouts", () => {
      const state = createDashboardLayoutState({
        columns: 12,
        widgets: [
          { id: "sales", layout: { id: "sales", x: 0, y: 0, w: 8, h: 2 } },
          { id: "traffic", layout: { id: "traffic", x: 8, y: 0, w: 4, h: 2 } },
        ],
        layoutsByColumn,
      });

      expect(serializeDashboardLayout(state)).toEqual({
        columns: 12,
        widgets: [
          { id: "sales", x: 0, y: 0, w: 8, h: 2 },
          { id: "traffic", x: 8, y: 0, w: 4, h: 2 },
        ],
      });
    });

    it("restores independent cached geometry when columns change repeatedly", () => {
      const initial = createDashboardLayoutState({
        columns: 12,
        widgets: [{ id: "sales", layout: { id: "sales", x: 0, y: 0, w: 4, h: 2 } }],
      });
      const twelveColumns = updateDashboardWidgetLayout(initial, "sales", { x: 6, y: 2, w: 6, h: 3 });
      const sixColumns = updateDashboardWidgetLayout(setDashboardColumns(twelveColumns, 6), "sales", {
        x: 1,
        y: 4,
        w: 3,
        h: 2,
      });

      const restoredTwelveColumns = setDashboardColumns(sixColumns, 12);
      const restoredSixColumns = setDashboardColumns(restoredTwelveColumns, 6);

      expect(restoredTwelveColumns.widgets[0]?.layout).toEqual({ id: "sales", x: 6, y: 2, w: 6, h: 3 });
      expect(restoredSixColumns.widgets[0]?.layout).toEqual({ id: "sales", x: 1, y: 4, w: 3, h: 2 });
      expect(setDashboardColumns(restoredSixColumns, restoredSixColumns.columns)).toBe(restoredSixColumns);
    });

    it("creates deterministic geometry when transitioning to an uncached column", () => {
      const state = createDashboardLayoutState({
        columns: 12,
        widgets: [
          { id: "sales", layout: { id: "sales", x: 8, y: 0, w: 4, h: 2 } },
          { id: "traffic", layout: { id: "traffic", x: 4, y: 0, w: 4, h: 2 } },
        ],
      });

      const transitioned = setDashboardColumns(state, 6);

      expect(transitioned.widgets.map((widget) => widget.layout)).toEqual([
        { id: "sales", x: 0, y: 0, w: 4, h: 2 },
        { id: "traffic", x: 0, y: 2, w: 4, h: 2 },
      ]);
      expect(transitioned.layoutsByColumn[6]).toEqual({
        widgets: [
          { id: "sales", x: 0, y: 0, w: 4, h: 2 },
          { id: "traffic", x: 0, y: 2, w: 4, h: 2 },
        ],
        previousLayouts: {},
      });
    });

    it("places a target-cache miss around all cached target geometry", () => {
      const state = createDashboardLayoutState({
        columns: 12,
        widgets: [
          { id: "sales", layout: { id: "sales", x: 0, y: 0, w: 3, h: 2 } },
          { id: "traffic", layout: { id: "traffic", x: 6, y: 0, w: 3, h: 2 } },
        ],
        layoutsByColumn: {
          6: {
            widgets: [{ id: "traffic", x: 0, y: 0, w: 3, h: 2 }],
            previousLayouts: {},
          },
        },
      });

      const transitioned = setDashboardColumns(state, 6);

      expect(transitioned.widgets.map((widget) => widget.layout)).toEqual([
        { id: "sales", x: 3, y: 0, w: 3, h: 2 },
        { id: "traffic", x: 0, y: 0, w: 3, h: 2 },
      ]);
    });

    it("saves the source cache before a different-column layout snapshot becomes authoritative", () => {
      const state = updateDashboardWidgetLayout(
        createDashboardLayoutState({
          columns: 12,
          widgets: [{ id: "sales", layout: { id: "sales", x: 0, y: 0, w: 4, h: 2 } }],
        }),
        "sales",
        { x: 5, y: 3, w: 7, h: 4 },
      );

      const applied = applyDashboardLayoutSnapshot(state, {
        columns: 6,
        widgets: [{ id: "sales", x: 1, y: 2, w: 5, h: 3 }],
      });

      expect(applied.layoutsByColumn[12]?.widgets).toEqual([{ id: "sales", x: 5, y: 3, w: 7, h: 4 }]);
      expect(applied.layoutsByColumn[6]?.widgets).toEqual([{ id: "sales", x: 1, y: 2, w: 5, h: 3 }]);
      expect(applied.widgets[0]?.layout).toEqual({ id: "sales", x: 1, y: 2, w: 5, h: 3 });
    });

    it("synchronizes active cache geometry for layout mutations", () => {
      const createState = () =>
        createDashboardLayoutState({
          columns: 6,
          widgets: [
            { id: "sales", layout: { id: "sales", x: 0, y: 0, w: 2, h: 2 } },
            { id: "traffic", layout: { id: "traffic", x: 2, y: 0, w: 2, h: 2 } },
          ],
        });

      const updated = updateDashboardWidgetLayout(createState(), "sales", { x: 4, y: 2, w: 2, h: 3 });
      expect(updated.layoutsByColumn[6]?.widgets[0]).toEqual({ id: "sales", x: 4, y: 2, w: 2, h: 3 });

      const applied = applyDashboardLayoutSnapshot(createState(), {
        columns: 6,
        widgets: [
          { id: "sales", x: 3, y: 1, w: 3, h: 2 },
          { id: "traffic", x: 0, y: 1, w: 3, h: 2 },
        ],
      });
      expect(applied.layoutsByColumn[6]?.widgets).toEqual([
        { id: "sales", x: 3, y: 1, w: 3, h: 2 },
        { id: "traffic", x: 0, y: 1, w: 3, h: 2 },
      ]);

      const maximized = maximizeDashboardWidget(createState(), "sales");
      expect(maximized.layoutsByColumn[6]).toEqual({
        widgets: [
          { id: "sales", x: 0, y: 0, w: 6, h: 3 },
          { id: "traffic", x: 2, y: 0, w: 2, h: 2 },
        ],
        previousLayouts: { sales: { id: "sales", x: 0, y: 0, w: 2, h: 2 } },
      });

      const minimized = minimizeDashboardWidget(createState(), "sales");
      expect(minimized.layoutsByColumn[6]).toEqual({
        widgets: [
          { id: "sales", x: 0, y: 0, w: 2, h: 1 },
          { id: "traffic", x: 2, y: 0, w: 2, h: 2 },
        ],
        previousLayouts: { sales: { id: "sales", x: 0, y: 0, w: 2, h: 2 } },
      });

      const restored = restoreDashboardWidget(maximized, "sales");
      expect(restored.layoutsByColumn[6]).toEqual({
        widgets: [
          { id: "sales", x: 0, y: 0, w: 2, h: 2 },
          { id: "traffic", x: 2, y: 0, w: 2, h: 2 },
        ],
        previousLayouts: {},
      });

      const arranged = autoArrangeDashboardWidgets(
        updateDashboardWidgetLayout(createState(), "traffic", { x: 0, y: 3, w: 4 }),
      );
      expect(arranged.layoutsByColumn[6]?.widgets).toEqual([
        { id: "sales", x: 0, y: 0, w: 2, h: 2 },
        { id: "traffic", x: 2, y: 0, w: 4, h: 2 },
      ]);

      const fitted = fitDashboardWidgetsToColumns(createState());
      expect(fitted.layoutsByColumn[6]?.widgets).toEqual([
        { id: "sales", x: 0, y: 0, w: 3, h: 2 },
        { id: "traffic", x: 3, y: 0, w: 3, h: 2 },
      ]);

      const fittedOne = fitDashboardWidgetToColumns(createState(), "sales");
      expect(fittedOne.layoutsByColumn[6]?.widgets).toEqual([
        { id: "sales", x: 0, y: 0, w: 4, h: 2 },
        { id: "traffic", x: 4, y: 0, w: 2, h: 2 },
      ]);
    });

    it("preserves every cached geometry for metadata-only widget updates", () => {
      const state = createDashboardLayoutState({
        columns: 12,
        widgets: [{ id: "sales", title: "Sales", layout: { id: "sales", x: 0, y: 0, w: 8, h: 2 } }],
        layoutsByColumn: {
          6: { widgets: [{ id: "sales", x: 1, y: 2, w: 5, h: 3 }], previousLayouts: {} },
        },
      });

      const updated = updateDashboardWidget(state, "sales", {
        title: "Revenue",
        data: { value: 42 },
        locked: true,
      });

      expect(updated.widgets[0]).toMatchObject({ title: "Revenue", data: { value: 42 }, locked: true });
      expect(updated.layoutsByColumn).toEqual(state.layoutsByColumn);
    });

    it("updates only active cached geometry when a widget patch includes layout", () => {
      const state = createDashboardLayoutState({
        columns: 12,
        widgets: [{ id: "sales", layout: { id: "sales", x: 0, y: 0, w: 8, h: 2 } }],
        layoutsByColumn: {
          6: { widgets: [{ id: "sales", x: 1, y: 2, w: 5, h: 3 }], previousLayouts: {} },
        },
      });

      const updated = updateDashboardWidget(state, "sales", {
        layout: { id: "ignored", x: 10, y: 4, w: 8, h: 5 },
      });

      expect(updated.widgets[0]?.layout).toEqual({ id: "sales", x: 4, y: 4, w: 8, h: 5 });
      expect(updated.layoutsByColumn[12]?.widgets).toEqual([{ id: "sales", x: 4, y: 4, w: 8, h: 5 }]);
      expect(updated.layoutsByColumn[6]?.widgets).toEqual([{ id: "sales", x: 1, y: 2, w: 5, h: 3 }]);
    });

    it("adds new widget geometry deterministically to active and known inactive caches", () => {
      const state = createDashboardLayoutState({
        columns: 12,
        widgets: [
          { id: "sales", layout: { id: "sales", x: 0, y: 0, w: 4, h: 2 } },
          { id: "traffic", layout: { id: "traffic", x: 4, y: 0, w: 4, h: 2 } },
        ],
        layoutsByColumn: {
          6: {
            widgets: [
              { id: "sales", x: 0, y: 0, w: 3, h: 2 },
              { id: "traffic", x: 3, y: 0, w: 3, h: 2 },
            ],
            previousLayouts: {},
          },
        },
      });

      const added = addDashboardWidget(state, {
        id: "orders",
        title: "Orders",
        layout: { id: "orders", x: 0, y: 0, w: 3, h: 1 },
      });

      expect(added.widgets[2]?.layout).toEqual({ id: "orders", x: 8, y: 0, w: 3, h: 1 });
      expect(added.layoutsByColumn[12]?.widgets[2]).toEqual({ id: "orders", x: 8, y: 0, w: 3, h: 1 });
      expect(added.layoutsByColumn[6]?.widgets[2]).toEqual({ id: "orders", x: 0, y: 2, w: 3, h: 1 });
      expect(Object.keys(added.layoutsByColumn)).toEqual(["6", "12"]);
    });

    it("replaces an existing widget without duplicating cached layouts", () => {
      const state = createDashboardLayoutState({
        columns: 12,
        widgets: [{ id: "sales", title: "Sales", layout: { id: "sales", x: 0, y: 0, w: 8, h: 2 } }],
        layoutsByColumn: {
          6: { widgets: [{ id: "sales", x: 1, y: 2, w: 5, h: 3 }], previousLayouts: {} },
        },
      });

      const replaced = addDashboardWidget(state, {
        id: "sales",
        title: "Revenue",
        layout: { id: "sales", x: 9, y: 4, w: 3, h: 4 },
      });

      expect(replaced.widgets).toHaveLength(1);
      expect(replaced.widgets[0]).toMatchObject({ title: "Revenue", layout: { id: "sales", x: 9, y: 4, w: 3, h: 4 } });
      expect(replaced.layoutsByColumn[12]?.widgets).toEqual([{ id: "sales", x: 9, y: 4, w: 3, h: 4 }]);
      expect(replaced.layoutsByColumn[6]?.widgets).toEqual([{ id: "sales", x: 1, y: 2, w: 5, h: 3 }]);
    });

    it("removes widget geometry and restore state from every known cache", () => {
      const state = createDashboardLayoutState({
        columns: 12,
        widgets: [
          { id: "sales", layout: { id: "sales", x: 0, y: 0, w: 8, h: 2 } },
          { id: "traffic", layout: { id: "traffic", x: 8, y: 0, w: 4, h: 2 } },
        ],
        previousLayouts: { sales: { id: "sales", x: 1, y: 3, w: 4, h: 2 } },
        layoutsByColumn: {
          6: {
            widgets: [
              { id: "sales", x: 0, y: 0, w: 3, h: 2 },
              { id: "traffic", x: 3, y: 0, w: 3, h: 2 },
            ],
            previousLayouts: { sales: { id: "sales", x: 1, y: 2, w: 2, h: 2 } },
          },
        },
      });

      const removed = removeDashboardWidget(state, "sales");

      expect(removed.widgets.map((widget) => widget.id)).toEqual(["traffic"]);
      expect(removed.previousLayouts).toEqual({});
      expect(removed.layoutsByColumn[12]).toEqual({
        widgets: [{ id: "traffic", x: 8, y: 0, w: 4, h: 2 }],
        previousLayouts: {},
      });
      expect(removed.layoutsByColumn[6]).toEqual({
        widgets: [{ id: "traffic", x: 3, y: 0, w: 3, h: 2 }],
        previousLayouts: {},
      });
    });

    it("clears layouts and restore state while retaining every known cache key", () => {
      const state = createDashboardLayoutState({
        columns: 12,
        widgets: [{ id: "sales", layout: { id: "sales", x: 0, y: 0, w: 8, h: 2 } }],
        previousLayouts: { sales: { id: "sales", x: 1, y: 3, w: 4, h: 2 } },
        layoutsByColumn: {
          6: {
            widgets: [{ id: "sales", x: 0, y: 0, w: 3, h: 2 }],
            previousLayouts: { sales: { id: "sales", x: 1, y: 2, w: 2, h: 2 } },
          },
        },
      });

      const cleared = clearDashboardWidgets(state);

      expect(cleared.widgets).toEqual([]);
      expect(cleared.previousLayouts).toEqual({});
      expect(cleared.layoutsByColumn).toEqual({
        6: { widgets: [], previousLayouts: {} },
        12: { widgets: [], previousLayouts: {} },
      });
    });

    it("keeps restore geometry independent for each cached column", () => {
      const initial = createDashboardLayoutState({
        columns: 12,
        widgets: [{ id: "sales", layout: { id: "sales", x: 5, y: 2, w: 4, h: 3 } }],
      });

      const maximizedTwelve = maximizeDashboardWidget(initial, "sales");
      const sixColumns = setDashboardColumns(maximizedTwelve, 6);
      const minimizedSix = minimizeDashboardWidget(sixColumns, "sales");

      expect(minimizedSix.previousLayouts.sales).toEqual({ id: "sales", x: 0, y: 0, w: 6, h: 3 });
      expect(minimizedSix.layoutsByColumn[6]?.previousLayouts.sales).toEqual({
        id: "sales",
        x: 0,
        y: 0,
        w: 6,
        h: 3,
      });
      expect(minimizedSix.layoutsByColumn[12]?.previousLayouts.sales).toEqual({
        id: "sales",
        x: 5,
        y: 2,
        w: 4,
        h: 3,
      });

      const restoredSix = restoreDashboardWidget(minimizedSix, "sales");
      expect(restoredSix.widgets[0]?.layout).toEqual({ id: "sales", x: 0, y: 0, w: 6, h: 3 });
      expect(restoredSix.previousLayouts).toEqual({});
      expect(restoredSix.layoutsByColumn[6]?.previousLayouts).toEqual({});

      const returnedTwelve = setDashboardColumns(restoredSix, 12);
      expect(returnedTwelve.previousLayouts.sales).toEqual({ id: "sales", x: 5, y: 2, w: 4, h: 3 });
      const restoredTwelve = restoreDashboardWidget(returnedTwelve, "sales");
      expect(restoredTwelve.widgets[0]?.layout).toEqual({ id: "sales", x: 5, y: 2, w: 4, h: 3 });
      expect(restoredTwelve.layoutsByColumn[12]?.previousLayouts).toEqual({});
    });

    it("returns the original state for unknown maximize, minimize, and restore targets", () => {
      const state = createDashboardLayoutState({ columns: 6, widgets: [] });

      expect(maximizeDashboardWidget(state, "missing")).toBe(state);
      expect(minimizeDashboardWidget(state, "missing")).toBe(state);
      expect(restoreDashboardWidget(state, "missing")).toBe(state);
    });
  });
});
