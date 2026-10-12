import type { DashboardWidgetResizeFrameEvent } from "../core/types";
import type { DashboardDragInPreviewLayout, DashboardDragOptions, DashboardWidget } from "../core/types";

export type UseDashboardDragInOptions<TData> = {
  sourceId: string;
  previewLayout: DashboardDragInPreviewLayout;
  createWidget: () => DashboardWidget<TData>;
  dragOptions?: DashboardDragOptions;
  disabled?: boolean;
};

export type DashboardResizeScheduler = {
  schedule: (event: DashboardWidgetResizeFrameEvent) => void;
  cancel: () => void;
};
