import { clampDashboardColumnCount } from "./columns";
import type {
  DashboardLayoutSnapshot,
  DashboardLayoutState,
  DashboardStateSnapshot,
  DashboardWidget,
  DashboardWidgetId,
  DashboardWidgetLayout,
} from "./types";

type DashboardLayoutStateInput<TData> =
  | DashboardLayoutSnapshot
  | DashboardStateSnapshot<TData>
  | { columns: number; widgets: DashboardWidget<TData>[] };

export function createDashboardLayoutState<TData = unknown>(
  snapshot: DashboardLayoutStateInput<TData>,
): DashboardLayoutState<TData> {
  return {
    columns: clampDashboardColumnCount(snapshot.columns),
    widgets: snapshot.widgets.map((widget) => ("layout" in widget ? normalizeWidget(widget) : normalizeWidget({ id: widget.id, layout: widget }))),
    previousLayouts: {},
    refreshVersion: 0,
  };
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
  };
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
