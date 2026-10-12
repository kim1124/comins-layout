import {
  addDashboardWidget,
  applyDashboardLayoutSnapshot,
  autoArrangeDashboardWidgets,
  clearDashboardWidgets,
  createDashboardLayoutState,
  fitDashboardWidgetToColumns,
  fitDashboardWidgetsToColumns,
  insertDashboardWidgetAtLayout,
  resizeDashboardWidget,
  maximizeDashboardWidget,
  minimizeDashboardWidget,
  removeDashboardWidget,
  restoreDashboardWidget,
  serializeDashboardState,
  setDashboardColumns,
  updateDashboardWidget,
  updateDashboardWidgetLayout,
} from "./layout-state";
import type {
  DashboardLayoutSnapshot,
  DashboardLayoutMutationEvent,
  DashboardLayoutMutationKind,
  DashboardLayoutState,
  DashboardStateSnapshotInput,
  DashboardWidget,
  DashboardWidgetId,
  DashboardWidgetLayout,
} from "./types";

export type DashboardGridAction<TData> =
  | { type: "add"; widget: DashboardWidget<TData> }
  | {
      type: "insert-at";
      widget: DashboardWidget<TData>;
      targetLayout: DashboardWidgetLayout;
      targetSnapshot: DashboardLayoutSnapshot;
    }
  | { type: "update"; id: DashboardWidgetId; patch: Partial<DashboardWidget<TData>> }
  | { type: "update-layout"; id: DashboardWidgetId; patch: Partial<Omit<DashboardWidgetLayout, "id">> }
  | { type: "remove"; id: DashboardWidgetId }
  | { type: "clear" }
  | { type: "maximize"; id: DashboardWidgetId }
  | { type: "minimize"; id: DashboardWidgetId }
  | { type: "resize"; id: DashboardWidgetId; size: Pick<DashboardWidgetLayout, "w" | "h"> }
  | { type: "restore"; id: DashboardWidgetId }
  | { type: "arrange" }
  | { type: "columns"; columns: number }
  | { type: "fit-columns" }
  | { type: "fit-widget-columns"; id: DashboardWidgetId }
  | { type: "refresh" }
  | { type: "apply-layout-snapshot"; snapshot: DashboardLayoutSnapshot }
  | { type: "reset"; snapshot: DashboardLayoutSnapshot | DashboardStateSnapshotInput<TData> };

export type DashboardMutationIntent = {
  kind: DashboardLayoutMutationKind;
  widgetIds?: DashboardWidgetId[];
};

export type DashboardGridInternalState<TData> = {
  dashboard: DashboardLayoutState<TData>;
  mutations: Array<{ sequence: number; event: DashboardLayoutMutationEvent<TData> }>;
  nextMutationSequence: number;
};

export type DashboardGridInternalAction<TData> =
  | {
      type: "transition";
      action: DashboardGridAction<TData>;
      mutation?: DashboardMutationIntent;
    }
  | { type: "ack-mutations"; through: number };

export function createDashboardGridInternalState<TData>(
  snapshot: DashboardStateSnapshotInput<TData>,
): DashboardGridInternalState<TData> {
  return { dashboard: createDashboardLayoutState(snapshot), mutations: [], nextMutationSequence: 1 };
}

export function dashboardGridInternalReducer<TData>(
  state: DashboardGridInternalState<TData>,
  action: DashboardGridInternalAction<TData>,
): DashboardGridInternalState<TData> {
  if (action.type === "ack-mutations") {
    const mutations = state.mutations.filter(({ sequence }) => sequence > action.through);
    return mutations.length === state.mutations.length ? state : { ...state, mutations };
  }

  const dashboard = dashboardGridReducer(state.dashboard, action.action);
  if (dashboard === state.dashboard) {
    return state;
  }
  if (!action.mutation) {
    return { ...state, dashboard };
  }

  const sequence = state.nextMutationSequence;
  const widgetIds = action.mutation.widgetIds ?? dashboard.widgets.map((widget) => widget.id);
  return {
    dashboard,
    mutations: [
      ...state.mutations,
      {
        sequence,
        event: {
          kind: action.mutation.kind,
          widgetIds: [...widgetIds],
          columns: dashboard.columns,
          snapshot: serializeDashboardState(dashboard),
        },
      },
    ],
    nextMutationSequence: sequence + 1,
  };
}

function dashboardGridReducer<TData>(
  state: DashboardLayoutState<TData>,
  action: DashboardGridAction<TData>,
): DashboardLayoutState<TData> {
  switch (action.type) {
    case "add":
      return addDashboardWidget(state, action.widget);
    case "insert-at":
      return insertDashboardWidgetAtLayout(
        state,
        action.widget,
        action.targetLayout,
        action.targetSnapshot,
      ).state;
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
    case "resize":
      return resizeDashboardWidget(state, action.id, action.size);
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
    case "apply-layout-snapshot":
      return applyDashboardLayoutSnapshot(state, action.snapshot);
    case "reset":
      return createDashboardLayoutState(action.snapshot);
    default:
      return state;
  }
}
