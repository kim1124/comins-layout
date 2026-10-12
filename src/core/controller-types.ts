import type {
  DashboardLayoutSnapshot,
  DashboardLayoutMutationEvent,
  DashboardStateSnapshot,
  DashboardStateSnapshotInput,
  DashboardWidget,
  DashboardWidgetId,
  DashboardWidgetLayout,
} from "./types";
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
  /** @deprecated Use resizeWidget(id, { w, h }). Retains the legacy full-width behavior. */
  maximizeWidget: (id: DashboardWidgetId) => void;
  /** @deprecated Use resizeWidget(id, { w, h }). Retains the legacy one-row behavior. */
  minimizeWidget: (id: DashboardWidgetId) => void;
  resizeWidget: (id: DashboardWidgetId, size: Pick<DashboardWidgetLayout, "w" | "h">) => void;
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
