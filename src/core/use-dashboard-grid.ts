import { useEffect, useMemo, useReducer, useRef } from "react";
import {
  addDashboardWidget,
  applyDashboardLayoutSnapshot,
  autoArrangeDashboardWidgets,
  clearDashboardWidgets,
  createDashboardLayoutState,
  fitDashboardWidgetToColumns,
  fitDashboardWidgetsToColumns,
  insertDashboardWidgetAtLayout,
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
  DashboardLayoutMutationEvent,
  DashboardLayoutMutationKind,
  DashboardLayoutState,
  DashboardStateSnapshot,
  DashboardStateSnapshotInput,
  DashboardWidget,
  DashboardWidgetId,
  DashboardWidgetLayout,
} from "./types";

type DashboardGridAction<TData> =
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
  | { type: "restore"; id: DashboardWidgetId }
  | { type: "arrange" }
  | { type: "columns"; columns: number }
  | { type: "fit-columns" }
  | { type: "fit-widget-columns"; id: DashboardWidgetId }
  | { type: "refresh" }
  | { type: "apply-layout-snapshot"; snapshot: DashboardLayoutSnapshot }
  | { type: "reset"; snapshot: DashboardLayoutSnapshot | DashboardStateSnapshotInput<TData> };

type DashboardMutationIntent = {
  kind: DashboardLayoutMutationKind;
  widgetIds?: DashboardWidgetId[];
};

type DashboardGridInternalState<TData> = {
  dashboard: DashboardLayoutState<TData>;
  mutations: Array<{ sequence: number; event: DashboardLayoutMutationEvent<TData> }>;
  nextMutationSequence: number;
};

type DashboardGridInternalAction<TData> =
  | {
      type: "transition";
      action: DashboardGridAction<TData>;
      mutation?: DashboardMutationIntent;
    }
  | { type: "ack-mutations"; through: number };

export type UseDashboardGridOptions<TData = unknown> = {
  initialColumns?: number;
  initialWidgets?: DashboardWidget<TData>[];
  onLayoutMutation?: (event: DashboardLayoutMutationEvent<TData>) => void;
};

export type DashboardGridCommands<TData = unknown> = {
  addWidget: (widget: DashboardWidget<TData>) => void;
  insertWidgetAt: (
    widget: DashboardWidget<TData>,
    targetLayout: DashboardWidgetLayout,
    targetSnapshot: DashboardLayoutSnapshot,
  ) => void;
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
  applyLayoutSnapshot: (snapshot: DashboardLayoutSnapshot) => void;
  resetLayout: (snapshot?: DashboardLayoutSnapshot | DashboardStateSnapshotInput<TData>) => void;
  restoreLayout: (snapshot: DashboardStateSnapshotInput<TData>) => void;
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
  const [internalState, dispatch] = useReducer(
    dashboardGridInternalReducer<TData>,
    initialSnapshot,
    (snapshot): DashboardGridInternalState<TData> => ({
      dashboard: createDashboardLayoutState(snapshot),
      mutations: [],
      nextMutationSequence: 1,
    }),
  );
  const state = internalState.dashboard;
  const mutationHandlerRef = useRef(options.onLayoutMutation);
  const deliveredMutationSequenceRef = useRef(0);
  const observeMutations = typeof options.onLayoutMutation === "function";

  useEffect(() => {
    mutationHandlerRef.current = options.onLayoutMutation;
  }, [options.onLayoutMutation]);

  useEffect(() => {
    const pending = internalState.mutations.filter(
      ({ sequence }) => sequence > deliveredMutationSequenceRef.current,
    );
    if (pending.length === 0) {
      return;
    }
    deliveredMutationSequenceRef.current = pending[pending.length - 1]!.sequence;
    pending.forEach(({ event }) => mutationHandlerRef.current?.(event));
    dispatch({ type: "ack-mutations", through: deliveredMutationSequenceRef.current });
  }, [internalState.mutations]);

  const transition = (
    action: DashboardGridAction<TData>,
    mutation?: DashboardMutationIntent,
  ) => dispatch({
    type: "transition",
    action,
    mutation: observeMutations ? mutation : undefined,
  });

  const commands = useMemo<DashboardGridCommands<TData>>(
    () => ({
      addWidget: (widget) => transition(
        { type: "add", widget },
        { kind: "widget:add", widgetIds: [widget.id] },
      ),
      insertWidgetAt: (widget, targetLayout, targetSnapshot) =>
        transition(
          { type: "insert-at", widget, targetLayout, targetSnapshot },
          { kind: "widget:add", widgetIds: [widget.id] },
        ),
      updateWidget: (id, patch) => transition(
        { type: "update", id, patch },
        { kind: "widget:update", widgetIds: [id] },
      ),
      updateWidgetLayout: (id, patch) => transition(
        { type: "update-layout", id, patch },
        { kind: "widget:update", widgetIds: [id] },
      ),
      removeWidget: (id) => transition(
        { type: "remove", id },
        { kind: "widget:remove", widgetIds: [id] },
      ),
      clearWidgets: () => transition(
        { type: "clear" },
        { kind: "widgets:clear", widgetIds: state.widgets.map((widget) => widget.id) },
      ),
      maximizeWidget: (id) => transition(
        { type: "maximize", id },
        { kind: "widget:update", widgetIds: [id] },
      ),
      minimizeWidget: (id) => transition(
        { type: "minimize", id },
        { kind: "widget:update", widgetIds: [id] },
      ),
      restoreWidget: (id) => transition(
        { type: "restore", id },
        { kind: "widget:update", widgetIds: [id] },
      ),
      autoArrangeWidgets: () => transition(
        { type: "arrange" },
        { kind: "layout:arrange" },
      ),
      fitWidgetsToColumns: () => transition(
        { type: "fit-columns" },
        { kind: "layout:fill" },
      ),
      fitWidgetToColumns: (id) => transition(
        { type: "fit-widget-columns", id },
        { kind: "layout:fill", widgetIds: [id] },
      ),
      setColumns: (columns) => transition(
        { type: "columns", columns },
        { kind: "columns:change" },
      ),
      applyLayoutSnapshot: (snapshot) => transition(
        { type: "apply-layout-snapshot", snapshot },
        { kind: "layout:commit", widgetIds: snapshot.widgets.map((widget) => widget.id) },
      ),
      resetLayout: (snapshot) => transition(
        { type: "reset", snapshot: snapshot ?? initialSnapshot },
        { kind: "layout:reset" },
      ),
      restoreLayout: (snapshot) => transition(
        { type: "reset", snapshot },
        { kind: "layout:restore" },
      ),
      refreshLayout: () => transition({ type: "refresh" }),
      serializeLayout: () => serializeDashboardLayout(state),
      serializeState: () => serializeDashboardState(state),
    }),
    [initialSnapshot, observeMutations, state],
  );

  return {
    state,
    widgets: state.widgets,
    columns: state.columns,
    refreshVersion: state.refreshVersion,
    commands,
  };
}

function dashboardGridInternalReducer<TData>(
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
