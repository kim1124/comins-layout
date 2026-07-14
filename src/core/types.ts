export type DashboardColumnCount = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

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

export type DashboardResizeScheduler = {
  schedule: (event: DashboardWidgetResizeFrameEvent) => void;
  cancel: () => void;
};
