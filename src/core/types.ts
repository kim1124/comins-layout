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
  dragHandle?: string;
  resizeHandles?: string;
  alwaysShowResizeHandle?: boolean | "mobile";
  nonce?: string;
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
};

export type DashboardLayoutSnapshot = {
  columns: DashboardColumnCount;
  widgets: DashboardWidgetLayout[];
};

export type DashboardStateSnapshot<TData = unknown> = {
  columns: DashboardColumnCount;
  widgets: DashboardWidget<TData>[];
  previousLayouts: Record<DashboardWidgetId, DashboardWidgetLayout>;
};

export type DashboardStateSnapshotInput<TData = unknown> = {
  columns: number;
  widgets: DashboardWidget<TData>[];
  previousLayouts?: Record<DashboardWidgetId, DashboardWidgetLayout>;
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
  refreshVersion: number;
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

export type DashboardResizeScheduler = {
  schedule: (event: DashboardWidgetResizeFrameEvent) => void;
  cancel: () => void;
};
