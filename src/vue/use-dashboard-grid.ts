import { computed, getCurrentScope, onScopeDispose, shallowRef, toValue, watch, type MaybeRefOrGetter } from "vue";
import { serializeDashboardLayout, serializeDashboardState } from "../core/layout-state";
import { createDashboardGridInternalState, dashboardGridInternalReducer } from "../core/transitions";
import type { DashboardGridAction, DashboardMutationIntent } from "../core/transitions";
import type { DashboardGridCommands, UseDashboardGridOptions } from "../core/controller-types";
import type { UseDashboardGridResult } from "./types";

export function useDashboardGrid<TData = unknown>(
  options: MaybeRefOrGetter<UseDashboardGridOptions<TData>> = {},
): UseDashboardGridResult<TData> {
  if (!getCurrentScope()) throw new Error("useDashboardGrid requires an active effect scope.");
  const initial = toValue(options);
  const initialSnapshot = { columns: initial.initialColumns ?? 12, widgets: initial.initialWidgets ?? [] };
  const internal = shallowRef(createDashboardGridInternalState(initialSnapshot));
  const state = computed(() => internal.value.dashboard);
  let active = true;
  let delivered = 0;
  const transition = (action: DashboardGridAction<TData>, mutation?: DashboardMutationIntent) => {
    if (!active) return;
    internal.value = dashboardGridInternalReducer(internal.value, {
      type: "transition", action,
      mutation: typeof toValue(options).onLayoutMutation === "function" ? mutation : undefined,
    });
  };
  watch(() => internal.value.mutations, queue => {
    if (!active) return;
    const batch = queue.filter(item => item.sequence > delivered);
    if (!batch.length) return;
    const through = batch[batch.length - 1]!.sequence;
    delivered = through;
    const errors: unknown[] = [];
    try {
      for (const { event } of batch) {
        if (!active) break;
        try { toValue(options).onLayoutMutation?.(event); }
        catch (error) { errors.push(error); }
      }
    } finally {
      internal.value = dashboardGridInternalReducer(internal.value, { type: "ack-mutations", through });
    }
    // Throw from the watch callback so Vue owns errorCaptured/app.errorHandler delivery.
    if (errors.length === 1) throw errors[0];
    if (errors.length > 1) throw new AggregateError(errors, "Dashboard mutation callbacks failed.");
  }, { flush: "post" });
  onScopeDispose(() => {
    active = false;
    internal.value = { ...internal.value, mutations: [] };
  });
  const commands: DashboardGridCommands<TData> = {
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
    { kind: "widgets:clear", widgetIds: state.value.widgets.map((widget) => widget.id) },
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
  serializeLayout: () => serializeDashboardLayout(state.value),
  serializeState: () => serializeDashboardState(state.value),
  };
  return {
    state,
    widgets: computed(() => state.value.widgets),
    columns: computed(() => state.value.columns),
    refreshVersion: computed(() => state.value.refreshVersion),
    commands,
  };
}
