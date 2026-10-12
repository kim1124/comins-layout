import { useEffect, useMemo, useReducer, useRef } from "react";
import { serializeDashboardLayout, serializeDashboardState } from "../core/layout-state";
import { createDashboardGridInternalState, dashboardGridInternalReducer } from "../core/transitions";
import type { DashboardGridAction, DashboardMutationIntent } from "../core/transitions";
import type { DashboardLayoutState, DashboardWidget } from "../core/types";
import type { DashboardGridCommands, UseDashboardGridOptions } from "../core/controller-types";
export type { DashboardGridCommands, UseDashboardGridOptions } from "../core/controller-types";

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
    createDashboardGridInternalState<TData>,
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
      resizeWidget: (id, size) => transition(
        { type: "resize", id, size },
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
