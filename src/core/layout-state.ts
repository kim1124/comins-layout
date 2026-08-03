import { clampDashboardColumnCount, DASHBOARD_COLUMN_COUNTS } from "./columns";
import type {
  DashboardColumnCount,
  DashboardColumnLayoutSnapshot,
  DashboardLayoutSnapshot,
  DashboardLayoutState,
  DashboardLayoutsByColumn,
  DashboardStateSnapshot,
  DashboardStateSnapshotInput,
  DashboardWidget,
  DashboardWidgetId,
  DashboardWidgetLayout,
} from "./types";

type DashboardLayoutStateInput<TData> =
  | DashboardLayoutSnapshot
  | DashboardStateSnapshotInput<TData>;

export function createDashboardLayoutState<TData = unknown>(
  snapshot: DashboardLayoutStateInput<TData>,
): DashboardLayoutState<TData> {
  const columns = clampDashboardColumnCount(snapshot.columns);
  const widgets: DashboardWidget<TData>[] = snapshot.widgets.map((widget): DashboardWidget<TData> =>
    "layout" in widget
      ? normalizeWidget<TData>(widget, columns)
      : normalizeWidget<TData>({ id: widget.id, layout: widget }, columns),
  );
  const previousLayouts = restorePreviousLayouts(snapshot, widgets, columns);

  return withActiveColumnSnapshot({
    columns,
    widgets,
    previousLayouts,
    layoutsByColumn: normalizeLayoutsByColumn(snapshot, widgets, previousLayouts, columns),
    refreshVersion: 0,
  });
}

export function addDashboardWidget<TData>(
  state: DashboardLayoutState<TData>,
  widget: DashboardWidget<TData>,
): DashboardLayoutState<TData> {
  const nextWidget = normalizeWidget(widget, state.columns);
  const exists = state.widgets.some((item) => item.id === nextWidget.id);

  return {
    ...state,
    widgets: exists
      ? state.widgets.map((item) => (item.id === nextWidget.id ? nextWidget : item))
      : [...state.widgets, placeWidgetInFirstAvailableSpace(state, nextWidget)],
  };
}

export function updateDashboardWidget<TData>(
  state: DashboardLayoutState<TData>,
  id: DashboardWidgetId,
  patch: Partial<DashboardWidget<TData>>,
): DashboardLayoutState<TData> {
  return {
    ...state,
    widgets: state.widgets.map((widget) =>
      widget.id === id
        ? normalizeWidget({
            ...widget,
            ...patch,
            id: widget.id,
            layout: patch.layout ? { ...patch.layout, id: widget.id } : widget.layout,
          })
        : widget,
    ),
  };
}

export function updateDashboardWidgetLayout<TData>(
  state: DashboardLayoutState<TData>,
  id: DashboardWidgetId,
  patch: Partial<Omit<DashboardWidgetLayout, "id">>,
): DashboardLayoutState<TData> {
  return {
    ...state,
    widgets: state.widgets.map((widget) =>
      widget.id === id
        ? {
            ...widget,
            layout: normalizeLayout({ ...widget.layout, ...patch, id: widget.id }, state.columns),
          }
        : widget,
    ),
  };
}

export function removeDashboardWidget<TData>(
  state: DashboardLayoutState<TData>,
  id: DashboardWidgetId,
): DashboardLayoutState<TData> {
  const { [id]: _removed, ...previousLayouts } = state.previousLayouts;

  return {
    ...state,
    previousLayouts,
    widgets: state.widgets.filter((widget) => widget.id !== id),
  };
}

export function clearDashboardWidgets<TData>(state: DashboardLayoutState<TData>): DashboardLayoutState<TData> {
  return {
    ...state,
    previousLayouts: {},
    widgets: [],
  };
}

export function maximizeDashboardWidget<TData>(
  state: DashboardLayoutState<TData>,
  id: DashboardWidgetId,
): DashboardLayoutState<TData> {
  const widget = state.widgets.find((item) => item.id === id);
  if (!widget) {
    return state;
  }

  const previousLayouts = rememberPreviousLayout(state, widget);

  return {
    ...state,
    previousLayouts,
    widgets: state.widgets.map((item) =>
      item.id === id
        ? {
            ...item,
            maximized: true,
            minimized: false,
            layout: normalizeLayout({ ...item.layout, x: 0, y: 0, w: state.columns, h: Math.max(item.layout.h, 3) }, state.columns),
          }
        : item,
    ),
  };
}

export function minimizeDashboardWidget<TData>(
  state: DashboardLayoutState<TData>,
  id: DashboardWidgetId,
): DashboardLayoutState<TData> {
  const widget = state.widgets.find((item) => item.id === id);
  if (!widget) {
    return state;
  }

  const previousLayouts = rememberPreviousLayout(state, widget);

  return {
    ...state,
    previousLayouts,
    widgets: state.widgets.map((item) =>
      item.id === id
        ? {
            ...item,
            maximized: false,
            minimized: true,
            layout: normalizeLayout({ ...item.layout, h: 1 }, state.columns),
          }
        : item,
    ),
  };
}

export function restoreDashboardWidget<TData>(
  state: DashboardLayoutState<TData>,
  id: DashboardWidgetId,
): DashboardLayoutState<TData> {
  const previous = state.previousLayouts[id];
  const { [id]: _restored, ...previousLayouts } = state.previousLayouts;

  return {
    ...state,
    previousLayouts,
    widgets: state.widgets.map((widget) =>
      widget.id === id
        ? {
            ...widget,
            maximized: false,
            minimized: false,
            layout: previous ? normalizeLayout(previous, state.columns) : widget.layout,
          }
        : widget,
    ),
  };
}

export function setDashboardColumns<TData>(
  state: DashboardLayoutState<TData>,
  columns: number,
): DashboardLayoutState<TData> {
  const nextColumns = clampDashboardColumnCount(columns);

  return {
    ...state,
    columns: nextColumns,
    widgets: state.widgets.map((widget) => ({
      ...widget,
      layout: normalizeLayout(widget.layout, nextColumns),
    })),
  };
}

export function applyDashboardLayoutSnapshot<TData>(
  state: DashboardLayoutState<TData>,
  snapshot: DashboardLayoutSnapshot,
): DashboardLayoutState<TData> {
  const columns = clampDashboardColumnCount(snapshot.columns);
  const layouts = new Map(snapshot.widgets.map((layout) => [layout.id, layout]));

  return {
    ...state,
    columns,
    widgets: state.widgets.map((widget) => ({
      ...widget,
      layout: normalizeLayout(layouts.get(widget.id) ?? widget.layout, columns),
    })),
  };
}

export function autoArrangeDashboardWidgets<TData>(state: DashboardLayoutState<TData>): DashboardLayoutState<TData> {
  let cursorX = 0;
  let cursorY = 0;
  let rowHeight = 0;

  return {
    ...state,
    widgets: state.widgets.map((widget) => {
      const width = Math.min(widget.layout.w, state.columns);
      if (cursorX > 0 && cursorX + width > state.columns) {
        cursorX = 0;
        cursorY += rowHeight;
        rowHeight = 0;
      }

      const layout = normalizeLayout(
        {
          ...widget.layout,
          x: cursorX,
          y: cursorY,
          w: width,
        },
        state.columns,
      );

      cursorX += width;
      rowHeight = Math.max(rowHeight, layout.h);

      return { ...widget, layout };
    }),
  };
}

export function fitDashboardWidgetsToColumns<TData>(state: DashboardLayoutState<TData>): DashboardLayoutState<TData> {
  const rows = new Map<number, DashboardWidget<TData>[]>();
  state.widgets.forEach((widget) => {
    const row = rows.get(widget.layout.y) ?? [];
    row.push(widget);
    rows.set(widget.layout.y, row);
  });

  const nextLayouts = new Map<DashboardWidgetId, DashboardWidgetLayout>();
  rows.forEach((rowWidgets) => {
    const sorted = [...rowWidgets].sort((a, b) => a.layout.x - b.layout.x || a.id.localeCompare(b.id));
    if (!hasEmptyColumnSpace(sorted, state.columns)) {
      sorted.forEach((widget) => {
        nextLayouts.set(widget.id, widget.layout);
      });
      return;
    }

    const baseWidth = sorted.length > 0 ? Math.floor(state.columns / sorted.length) : state.columns;
    let remainder = sorted.length > 0 ? state.columns % sorted.length : 0;
    let cursorX = 0;

    sorted.forEach((widget, index) => {
      const width = index === sorted.length - 1 ? state.columns - cursorX : baseWidth + (remainder > 0 ? 1 : 0);
      remainder = Math.max(0, remainder - 1);

      nextLayouts.set(widget.id, normalizeLayout({ ...widget.layout, x: cursorX, w: width }, state.columns));
      cursorX += width;
    });
  });

  return {
    ...state,
    widgets: state.widgets.map((widget) => ({
      ...widget,
      layout: nextLayouts.get(widget.id) ?? widget.layout,
    })),
  };
}

export function fitDashboardWidgetToColumns<TData>(
  state: DashboardLayoutState<TData>,
  id: DashboardWidgetId,
): DashboardLayoutState<TData> {
  const target = state.widgets.find((widget) => widget.id === id);
  if (!target) {
    return state;
  }

  const rowWidgets = state.widgets
    .filter((widget) => widget.layout.y === target.layout.y)
    .sort((a, b) => a.layout.x - b.layout.x || a.id.localeCompare(b.id));
  const totalWidth = rowWidgets.reduce((sum, widget) => sum + widget.layout.w, 0);
  const emptyWidth = state.columns - totalWidth;
  if (emptyWidth <= 0) {
    return state;
  }

  let cursorX = 0;
  const nextLayouts = new Map<DashboardWidgetId, DashboardWidgetLayout>();
  rowWidgets.forEach((widget) => {
    const width = widget.id === id ? widget.layout.w + emptyWidth : widget.layout.w;
    nextLayouts.set(widget.id, normalizeLayout({ ...widget.layout, x: cursorX, w: width }, state.columns));
    cursorX += width;
  });

  return {
    ...state,
    widgets: state.widgets.map((widget) => ({
      ...widget,
      layout: nextLayouts.get(widget.id) ?? widget.layout,
    })),
  };
}

function hasEmptyColumnSpace<TData>(widgets: DashboardWidget<TData>[], columns: number): boolean {
  let cursorX = 0;

  for (const widget of widgets) {
    if (widget.layout.x > cursorX) {
      return true;
    }
    cursorX = Math.max(cursorX, widget.layout.x + widget.layout.w);
  }

  return cursorX < columns;
}

export function serializeDashboardLayout<TData>(state: DashboardLayoutState<TData>): DashboardLayoutSnapshot {
  return {
    columns: state.columns,
    widgets: state.widgets.map((widget) => ({ ...widget.layout })),
  };
}

export function serializeDashboardState<TData>(state: DashboardLayoutState<TData>): DashboardStateSnapshot<TData> {
  return {
    columns: state.columns,
    widgets: state.widgets.map((widget) => ({
      ...widget,
      layout: { ...widget.layout },
    })),
    previousLayouts: Object.fromEntries(
      Object.entries(state.previousLayouts)
        .filter((entry): entry is [DashboardWidgetId, DashboardWidgetLayout] => entry[1] !== undefined)
        .map(([id, layout]) => [id, { ...layout, id }]),
    ),
    layoutsByColumn: DASHBOARD_COLUMN_COUNTS.reduce<DashboardLayoutsByColumn>((layoutsByColumn, columns) => {
      const snapshot = state.layoutsByColumn[columns];
      if (!snapshot) {
        return layoutsByColumn;
      }

      layoutsByColumn[columns] = createColumnLayoutSnapshot(
        snapshot.widgets.map((layout) => ({ id: layout.id, layout })),
        snapshot.previousLayouts,
        columns,
      );
      return layoutsByColumn;
    }, {}),
  };
}

function createColumnLayoutSnapshot<TData>(
  widgets: DashboardWidget<TData>[],
  previousLayouts: DashboardLayoutState<TData>["previousLayouts"],
  columns: DashboardColumnCount,
): DashboardColumnLayoutSnapshot {
  const widgetIds = new Set(widgets.map((widget) => widget.id));

  return {
    widgets: widgets.map((widget) => normalizeColumnLayout({ ...widget.layout, id: widget.id }, columns)),
    previousLayouts: Object.fromEntries(
      Object.entries(previousLayouts)
        .filter(
          (entry): entry is [DashboardWidgetId, DashboardWidgetLayout] =>
            entry[1] !== undefined && widgetIds.has(entry[0]) && entry[1].id === entry[0],
        )
        .map(([id, layout]) => [id, normalizeColumnLayout({ ...layout, id }, columns)]),
    ),
  };
}

function normalizeLayoutsByColumn<TData>(
  snapshot: DashboardLayoutStateInput<TData>,
  widgets: DashboardWidget<TData>[],
  activePreviousLayouts: DashboardLayoutState<TData>["previousLayouts"],
  activeColumns: DashboardColumnCount,
): DashboardLayoutsByColumn {
  if (!("layoutsByColumn" in snapshot) || !snapshot.layoutsByColumn) {
    return {};
  }

  const widgetIds = new Set(widgets.map((widget) => widget.id));
  const layoutsByColumn: DashboardLayoutsByColumn = {};

  DASHBOARD_COLUMN_COUNTS.forEach((columns) => {
    const cachedSnapshot = snapshot.layoutsByColumn?.[columns];
    if (!cachedSnapshot || !Array.isArray(cachedSnapshot.widgets)) {
      return;
    }

    const cachedWidgets = cachedSnapshot.widgets
      .filter((layout): layout is DashboardWidgetLayout => Boolean(layout) && widgetIds.has(layout.id))
      .map((layout) => ({ id: layout.id, layout: { ...layout, id: layout.id } }));
    const cachedPreviousLayouts = cachedSnapshot.previousLayouts ?? {};

    layoutsByColumn[columns] = createColumnLayoutSnapshot(cachedWidgets, cachedPreviousLayouts, columns);
  });

  layoutsByColumn[activeColumns] = createColumnLayoutSnapshot(widgets, activePreviousLayouts, activeColumns);
  return layoutsByColumn;
}

function withActiveColumnSnapshot<TData>(state: DashboardLayoutState<TData>): DashboardLayoutState<TData> {
  return {
    ...state,
    layoutsByColumn: {
      ...state.layoutsByColumn,
      [state.columns]: createColumnLayoutSnapshot(state.widgets, state.previousLayouts, state.columns),
    },
  };
}

function restorePreviousLayouts<TData>(
  snapshot: DashboardLayoutStateInput<TData>,
  widgets: DashboardWidget<TData>[],
  columns: number,
): Record<DashboardWidgetId, DashboardWidgetLayout | undefined> {
  if (!("previousLayouts" in snapshot) || !snapshot.previousLayouts) {
    return {};
  }

  const widgetIds = new Set(widgets.map((widget) => widget.id));

  return Object.fromEntries(
    Object.entries(snapshot.previousLayouts)
      .filter(([id, layout]) => widgetIds.has(id) && layout?.id === id)
      .map(([id, layout]) => [id, normalizeLayout({ ...layout, id }, columns)]),
  );
}

function placeWidgetInFirstAvailableSpace<TData>(
  state: DashboardLayoutState<TData>,
  widget: DashboardWidget<TData>,
): DashboardWidget<TData> {
  const { w, h } = widget.layout;

  for (let y = 0; ; y += 1) {
    for (let x = 0; x <= state.columns - w; x += 1) {
      const candidate = { ...widget.layout, x, y, w, h };
      const overlaps = state.widgets.some((item) => layoutsOverlap(candidate, item.layout));
      if (!overlaps) {
        return { ...widget, layout: candidate };
      }
    }
  }
}

function layoutsOverlap(left: DashboardWidgetLayout, right: DashboardWidgetLayout): boolean {
  return left.x < right.x + right.w && left.x + left.w > right.x && left.y < right.y + right.h && left.y + left.h > right.y;
}

function normalizeWidget<TData>(widget: DashboardWidget<TData>, columns = 12): DashboardWidget<TData> {
  return {
    ...widget,
    layout: normalizeLayout({ ...widget.layout, id: widget.id }, columns),
  };
}

function normalizeLayout(layout: DashboardWidgetLayout, columns: number): DashboardWidgetLayout {
  const w = Math.max(1, Math.min(Math.round(layout.w), columns));
  const x = Math.max(0, Math.min(Math.round(layout.x), columns - w));

  return {
    ...layout,
    x,
    y: Math.max(0, Math.round(layout.y)),
    w,
    h: Math.max(1, Math.round(layout.h)),
  };
}

function normalizeColumnLayout(layout: DashboardWidgetLayout, columns: DashboardColumnCount): DashboardWidgetLayout {
  const { minW: _minW, minH: _minH, maxW: _maxW, maxH: _maxH, ...normalized } = normalizeLayout(layout, columns);
  const minW = normalizeLayoutLimit(layout.minW, 1, columns);
  const minH = normalizeLayoutLimit(layout.minH, 1);
  const maxW = normalizeLayoutLimit(layout.maxW, minW ?? 1, columns);
  const maxH = normalizeLayoutLimit(layout.maxH, minH ?? 1);

  return {
    ...normalized,
    ...(minW === undefined ? {} : { minW }),
    ...(minH === undefined ? {} : { minH }),
    ...(maxW === undefined ? {} : { maxW }),
    ...(maxH === undefined ? {} : { maxH }),
  };
}

function normalizeLayoutLimit(value: number | undefined, minimum: number, maximum?: number): number | undefined {
  if (value === undefined || !Number.isFinite(value)) {
    return undefined;
  }

  const rounded = Math.round(value);
  return maximum === undefined ? Math.max(minimum, rounded) : Math.max(minimum, Math.min(rounded, maximum));
}

function rememberPreviousLayout<TData>(
  state: DashboardLayoutState<TData>,
  widget: DashboardWidget<TData>,
): Record<DashboardWidgetId, DashboardWidgetLayout | undefined> {
  if (state.previousLayouts[widget.id]) {
    return state.previousLayouts;
  }

  return {
    ...state.previousLayouts,
    [widget.id]: { ...widget.layout },
  };
}
