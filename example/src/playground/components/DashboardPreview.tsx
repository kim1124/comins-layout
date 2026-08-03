import type { DashboardGridProps } from "../../../../src";
import { DashboardGrid } from "../../../../src";

import type { DashboardRuntime, ExampleWidgetData } from "../types";

type DashboardPreviewProps = {
  dashboard: DashboardRuntime;
  externalDropTargets?: DashboardGridProps<ExampleWidgetData>["externalDropTargets"];
  movable?: boolean;
  onWidgetExternalDrop?: DashboardGridProps<ExampleWidgetData>["onWidgetExternalDrop"];
  resizable?: boolean;
  showControls?: boolean;
};

export function DashboardPreview({
  dashboard,
  externalDropTargets,
  movable = true,
  onWidgetExternalDrop,
  resizable = true,
  showControls = true,
}: DashboardPreviewProps) {
  return (
    <>
      <p className="example-widget-count">위젯 {dashboard.widgets.length}개</p>
      <DashboardGrid
        columns={dashboard.columns}
        externalDropTargets={externalDropTargets}
        movable={movable}
        refreshKey={dashboard.refreshVersion}
        resizable={resizable}
        showControls={showControls}
        widgets={dashboard.widgets}
        onMaximizeWidget={dashboard.commands.maximizeWidget}
        onMinimizeWidget={dashboard.commands.minimizeWidget}
        onRemoveWidget={dashboard.commands.removeWidget}
        onRestoreWidget={dashboard.commands.restoreWidget}
        onWidgetExternalDrop={onWidgetExternalDrop}
        onWidgetHeaderDoubleClick={dashboard.commands.fitWidgetToColumns}
        onWidgetLayoutChange={dashboard.commands.updateWidgetLayout}
        renderWidget={(widget) => (
          <div className="dashboard-widget-body">
            <span>{widget.data?.description}</span>
            <strong>{widget.data?.value}</strong>
          </div>
        )}
      />
    </>
  );
}

export function PlaygroundHeader({ kicker, title }: { kicker: string; title: string }) {
  const titleId = `playground-title-${title}`;

  return (
    <header aria-labelledby={titleId} className="playground-header">
      <p className="example-kicker">{kicker}</p>
      <h1 id={titleId}>{title}</h1>
    </header>
  );
}

export function toggleStateProps(active: boolean) {
  return {
    "aria-pressed": active,
    "data-active": active ? "true" : "false",
  } as const;
}
