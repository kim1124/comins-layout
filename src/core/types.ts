export type DashboardColumnCount = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

export type DashboardColumnLayout = "list" | "compact" | "moveScale" | "move" | "scale" | "none";

export type DashboardResponsiveBreakpoint = {
  maxWidth: number;
  columns: DashboardColumnCount;
  layout?: DashboardColumnLayout;
};

export type DashboardResponsiveOptions = {
  columnWidth?: number;
  columnMax?: DashboardColumnCount;
  breakpoints?: ReadonlyArray<DashboardResponsiveBreakpoint>;
  breakpointForWindow?: boolean;
  layout?: DashboardColumnLayout;
};

export type DashboardExternalDropTarget = {
  id: string;
  selector: string;
};

export type DashboardGridEngineOptions = {
  cellHeight?: number | string;
  margin?: number | string;
  float?: boolean;
  animate?: boolean;
  staticGrid?: boolean;
  rtl?: boolean | "auto";
  minRow?: number;
  maxRow?: number;
  sizeToContent?: boolean;
  /**
   * @deprecated GridStack native lazy loading does not defer React-owned widget content.
   * Use DashboardGrid.lazyRenderWidget with DashboardWidget.lazyLoad instead.
   * This option remains mapped for 0.2.1 compatibility and is planned for removal in 0.3.0.
   */
  lazyLoad?: boolean;
  dragHandle?: string;
  resizeHandles?: string;
  alwaysShowResizeHandle?: boolean | "mobile";
  nonce?: string;
};

export type DashboardDragOptions = {
  handle?: string;
  appendTo?: string;
  pause?: boolean | number;
  scroll?: boolean;
  cancel?: string;
};

export type DashboardWidgetId = string;

export type DashboardWidgetLayout = {
  id: DashboardWidgetId;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
  maxW?: number;
  maxH?: number;
};

export type DashboardDragInPreviewLayout = Pick<
  DashboardWidgetLayout,
  "w" | "h" | "minW" | "minH" | "maxW" | "maxH"
>;

export type DashboardWidget<TData = unknown> = {
  id: DashboardWidgetId;
  title?: string;
  layout: DashboardWidgetLayout;
  data?: TData;
  minimized?: boolean;
  maximized?: boolean;
  locked?: boolean;
  movable?: boolean;
  resizable?: boolean;
  lazyLoad?: boolean;
  sizeToContent?: boolean | number;
  resizeToContentParent?: string;
};

export type DashboardWidgetTransferMode = "copy" | "move";

export type DashboardWidgetTransferRejection =
  | "duplicate-id"
  | "missing-widget"
  | "not-transferable"
  | "invalid-layout";

export type DashboardLayoutSnapshot = {
  columns: DashboardColumnCount;
  widgets: DashboardWidgetLayout[];
};

export type DashboardColumnLayoutSnapshot = {
  widgets: DashboardWidgetLayout[];
  previousLayouts: Record<DashboardWidgetId, DashboardWidgetLayout>;
};

export type DashboardLayoutsByColumn = Partial<
  Record<DashboardColumnCount, DashboardColumnLayoutSnapshot>
>;

export type DashboardStateSnapshot<TData = unknown> = {
  columns: DashboardColumnCount;
  widgets: DashboardWidget<TData>[];
  previousLayouts: Record<DashboardWidgetId, DashboardWidgetLayout>;
  layoutsByColumn: DashboardLayoutsByColumn;
};

export type DashboardStateSnapshotInput<TData = unknown> = {
  columns: number;
  widgets: DashboardWidget<TData>[];
  previousLayouts?: Record<DashboardWidgetId, DashboardWidgetLayout>;
  layoutsByColumn?: DashboardLayoutsByColumn;
};

export type DashboardInteractionOptions = {
  editable?: boolean;
  movable?: boolean;
  resizable?: boolean;
};

export type DashboardLayoutState<TData = unknown> = {
  columns: DashboardColumnCount;
  widgets: DashboardWidget<TData>[];
  previousLayouts: Record<DashboardWidgetId, DashboardWidgetLayout | undefined>;
  layoutsByColumn: DashboardLayoutsByColumn;
  refreshVersion: number;
};

export type DashboardWidgetInsertionResult<TData = unknown> =
  | {
      accepted: true;
      state: DashboardLayoutState<TData>;
    }
  | {
      accepted: false;
      reason: Extract<DashboardWidgetTransferRejection, "duplicate-id" | "invalid-layout">;
      state: DashboardLayoutState<TData>;
    };

export type DashboardWidgetTransferInput<TData = unknown> = {
  source: DashboardLayoutState<TData>;
  target: DashboardLayoutState<TData>;
  widgetId: DashboardWidgetId;
  targetLayout: DashboardWidgetLayout;
  targetSnapshot: DashboardLayoutSnapshot;
  mode: DashboardWidgetTransferMode;
};

export type DashboardWidgetTransferResult<TData = unknown> =
  | {
      accepted: true;
      source: DashboardLayoutState<TData>;
      target: DashboardLayoutState<TData>;
    }
  | {
      accepted: false;
      reason: DashboardWidgetTransferRejection;
      source: DashboardLayoutState<TData>;
      target: DashboardLayoutState<TData>;
    };

export type DashboardWidgetDropCandidate<TData = unknown> = {
  source:
    | { kind: "palette"; sourceId: string }
    | { kind: "grid"; gridId: string; widgetId: DashboardWidgetId };
  targetGridId: string;
  widget: DashboardWidget<TData>;
  mode: DashboardWidgetTransferMode;
};

export type DashboardWidgetDropRequest<TData = unknown> = DashboardWidgetDropCandidate<TData> & {
  operationId: string;
  targetLayout: DashboardWidgetLayout;
  targetSnapshot: DashboardLayoutSnapshot;
};

export type DashboardWidgetResizeFrameEvent = {
  id: DashboardWidgetId;
  width: number;
  height: number;
};

export type DashboardWidgetInteractionEvent = {
  id: DashboardWidgetId;
  layout: DashboardWidgetLayout;
};

export type DashboardLayoutMutationKind =
  | "widget:add"
  | "widget:update"
  | "widget:remove"
  | "widgets:clear"
  | "layout:commit"
  | "layout:reset"
  | "layout:restore"
  | "layout:arrange"
  | "layout:fill"
  | "columns:change";

export type DashboardLayoutMutationEvent<TData = unknown> = {
  kind: DashboardLayoutMutationKind;
  widgetIds: DashboardWidgetId[];
  columns: DashboardColumnCount;
  snapshot: DashboardStateSnapshot<TData>;
};

export type DashboardWidgetExternalDropEvent = {
  widgetId: DashboardWidgetId;
  targetId: string;
  columns: DashboardColumnCount;
  layout: DashboardWidgetLayout;
};

export type DashboardResizeScheduler = {
  schedule: (event: DashboardWidgetResizeFrameEvent) => void;
  cancel: () => void;
};
