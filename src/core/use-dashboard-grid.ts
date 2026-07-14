import { useMemo, useReducer } from "react";
import {
  addDashboardWidget,
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
} from "./layout-state";
import type {
  DashboardLayoutSnapshot,
  DashboardLayoutState,
  DashboardStateSnapshot,
  DashboardWidget,
  DashboardWidgetId,
  DashboardWidgetLayout,
} from "./types";

type DashboardGridAction<TData> =
  | { type: "add"; widget: DashboardWidget<TData> }
  | { type: "update"; id: DashboardWidgetId; patch: Partial<DashboardWidget<TData>> }
  | { type: "update-layout"; id: DashboardWidgetId; patch: Partial<Omit<DashboardWidgetLayout, "id">> }
  | { type: "remove"; id: DashboardWidgetId }
  | { type: "clear" }
  | { type: "maximize"; id: DashboardWidgetId }
  | { type: "minimize"; id: DashboardWidgetId }
  | { type: "restore"; id: DashboardWidgetId }
  | { type: "arrange" }
  | { type: "columns"; columns: number }
  | { type: "fit-columns" }
  | { type: "fit-widget-columns"; id: DashboardWidgetId }
  | { type: "refresh" }
  | { type: "reset"; snapshot: DashboardLayoutSnapshot | DashboardStateSnapshot<TData> | { columns: number; widgets: DashboardWidget<TData>[] } };

export type UseDashboardGridOptions<TData = unknown> = {
  initialColumns?: number;
  initialWidgets?: DashboardWidget<TData>[];
};

export type DashboardGridCommands<TData = unknown> = {
  addWidget: (widget: DashboardWidget<TData>) => void;
  updateWidget: (id: DashboardWidgetId, patch: Partial<DashboardWidget<TData>>) => void;
  updateWidgetLayout: (id: DashboardWidgetId, patch: Partial<Omit<DashboardWidgetLayout, "id">>) => void;
  removeWidget: (id: DashboardWidgetId) => void;
  clearWidgets: () => void;
  maximizeWidget: (id: DashboardWidgetId) => void;
  minimizeWidget: (id: DashboardWidgetId) => void;
  restoreWidget: (id: DashboardWidgetId) => void;
  autoArrangeWidgets: () => void;
  fitWidgetsToColumns: () => void;
  fitWidgetToColumns: (id: DashboardWidgetId) => void;
  setColumns: (columns: number) => void;
  resetLayout: (snapshot?: DashboardLayoutSnapshot) => void;
  restoreLayout: (snapshot: DashboardStateSnapshot<TData>) => void;
  refreshLayout: () => void;
  serializeLayout: () => DashboardLayoutSnapshot;
  serializeState: () => DashboardStateSnapshot<TData>;
};

export type UseDashboardGridResult<TData = unknown> = {
  state: DashboardLayoutState<TData>;
  widgets: DashboardWidget<TData>[];
  columns: DashboardLayoutState<TData>["columns"];
  refreshVersion: number;
  commands: DashboardGridCommands<TData>;
};

export function useDashboardGrid<TData = unknown>(
  options: UseDashboardGridOptions<TData> = {},
): UseDashboardGridResult<TData> {
  const initialSnapshot = useMemo(
    () => ({
      columns: options.initialColumns ?? 12,
      widgets: options.initialWidgets ?? [],
    }),
    [],
  );
  const [state, dispatch] = useReducer(dashboardGridReducer<TData>, initialSnapshot, createDashboardLayoutState);

  const commands = useMemo<DashboardGridCommands<TData>>(
    () => ({
      addWidget: (widget) => dispatch({ type: "add", widget }),
      updateWidget: (id, patch) => dispatch({ type: "update", id, patch }),
      updateWidgetLayout: (id, patch) => dispatch({ type: "update-layout", id, patch }),
      removeWidget: (id) => dispatch({ type: "remove", id }),
      clearWidgets: () => dispatch({ type: "clear" }),
      maximizeWidget: (id) => dispatch({ type: "maximize", id }),
      minimizeWidget: (id) => dispatch({ type: "minimize", id }),
      restoreWidget: (id) => dispatch({ type: "restore", id }),
      autoArrangeWidgets: () => dispatch({ type: "arrange" }),
      fitWidgetsToColumns: () => dispatch({ type: "fit-columns" }),
      fitWidgetToColumns: (id) => dispatch({ type: "fit-widget-columns", id }),
      setColumns: (columns) => dispatch({ type: "columns", columns }),
      resetLayout: (snapshot) => dispatch({ type: "reset", snapshot: snapshot ?? initialSnapshot }),
      restoreLayout: (snapshot) => dispatch({ type: "reset", snapshot }),
      refreshLayout: () => dispatch({ type: "refresh" }),
      serializeLayout: () => serializeDashboardLayout(state),
      serializeState: () => serializeDashboardState(state),
    }),
    [initialSnapshot, state],
  );

  return {
    state,
    widgets: state.widgets,
    columns: state.columns,
    refreshVersion: state.refreshVersion,
    commands,
  };
}

function dashboardGridReducer<TData>(
  state: DashboardLayoutState<TData>,
  action: DashboardGridAction<TData>,
): DashboardLayoutState<TData> {
  switch (action.type) {
    case "add":
      return addDashboardWidget(state, action.widget);
    case "update":
      return updateDashboardWidget(state, action.id, action.patch);
    case "update-layout":
      return updateDashboardWidgetLayout(state, action.id, action.patch);
    case "remove":
      return removeDashboardWidget(state, action.id);
    case "clear":
      return clearDashboardWidgets(state);
    case "maximize":
      return maximizeDashboardWidget(state, action.id);
    case "minimize":
      return minimizeDashboardWidget(state, action.id);
    case "restore":
      return restoreDashboardWidget(state, action.id);
    case "arrange":
      return autoArrangeDashboardWidgets(state);
    case "fit-columns":
      return fitDashboardWidgetsToColumns(state);
    case "fit-widget-columns":
      return fitDashboardWidgetToColumns(state, action.id);
    case "columns":
      return setDashboardColumns(state, action.columns);
    case "refresh":
      return { ...state, refreshVersion: state.refreshVersion + 1 };
    case "reset":
      return createDashboardLayoutState(action.snapshot);
    default:
      return state;
  }
}
