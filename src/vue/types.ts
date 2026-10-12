import type { ComputedRef } from "vue";
import type { DashboardGridCommands } from "../core/controller-types";
import type { DashboardLayoutState, DashboardWidget } from "../core/types";
import type {
  DashboardColumnCount, DashboardGridEngineOptions, DashboardResponsiveOptions,
  DashboardExternalDropTarget, DashboardWidgetDropCandidate, DashboardWidgetTransferMode,
  DashboardLayoutSnapshot, DashboardWidgetLayout, DashboardWidgetResizeFrameEvent,
  DashboardWidgetExternalDropEvent, DashboardWidgetDropRequest, DashboardWidgetInteractionEvent,
} from "../core/types";
import type { DashboardWidgetActionLabels } from "../ui/widget-actions";

export type DashboardGridProps<TData = unknown> = {
  widgets: DashboardWidget<TData>[];
  columns?: DashboardColumnCount;
  editable?: boolean;
  movable?: boolean;
  resizable?: boolean;
  engineOptions?: DashboardGridEngineOptions;
  responsive?: DashboardResponsiveOptions;
  externalDropTargets?: ReadonlyArray<DashboardExternalDropTarget>;
  gridId?: string;
  acceptExternalWidgets?: boolean | ((candidate: DashboardWidgetDropCandidate<TData>) => boolean);
  gridTransferMode?: DashboardWidgetTransferMode;
  refreshKey?: number;
  showControls?: boolean;
  lazyRenderWidget?: boolean;
  actionLabels?: Partial<DashboardWidgetActionLabels>;
};

export type DashboardGridEmits<TData = unknown> = {
  columnsChange: [columns: DashboardColumnCount];
  layoutCommit: [snapshot: DashboardLayoutSnapshot];
  widgetLayoutChange: [id: string, layout: DashboardWidgetLayout];
  widgetResizeFrame: [event: DashboardWidgetResizeFrameEvent];
  widgetExternalDrop: [event: DashboardWidgetExternalDropEvent];
  widgetDropRequest: [request: DashboardWidgetDropRequest<TData>];
  beforeMove: [event: DashboardWidgetInteractionEvent];
  move: [event: DashboardWidgetInteractionEvent];
  afterMove: [event: DashboardWidgetInteractionEvent];
  beforeResize: [event: DashboardWidgetInteractionEvent];
  resize: [event: DashboardWidgetInteractionEvent];
  afterResize: [event: DashboardWidgetInteractionEvent];
  beforeTitleDoubleClick: [event: DashboardWidgetInteractionEvent];
  titleDoubleClick: [event: DashboardWidgetInteractionEvent];
  afterTitleDoubleClick: [event: DashboardWidgetInteractionEvent];
  maximizeWidget: [id: string];
  minimizeWidget: [id: string];
  restoreWidget: [id: string];
  removeWidget: [id: string];
};

export type DashboardWidgetShellProps<TData = unknown> = {
  widget: DashboardWidget<TData>;
  showControls?: boolean;
  labels?: DashboardWidgetActionLabels;
};
export type DashboardWidgetShellEmits = {
  maximize: [id: string];
  minimize: [id: string];
  restore: [id: string];
  remove: [id: string];
  beforeTitleDoubleClick: [event: DashboardWidgetInteractionEvent];
  titleDoubleClick: [event: DashboardWidgetInteractionEvent];
  afterTitleDoubleClick: [event: DashboardWidgetInteractionEvent];
};

export type UseDashboardGridResult<TData = unknown> = {
  state: ComputedRef<DashboardLayoutState<TData>>;
  widgets: ComputedRef<DashboardWidget<TData>[]>;
  columns: ComputedRef<DashboardLayoutState<TData>["columns"]>;
  refreshVersion: ComputedRef<number>;
  commands: DashboardGridCommands<TData>;
};
