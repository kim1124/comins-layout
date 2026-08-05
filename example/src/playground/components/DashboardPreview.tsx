import { useId } from "react";
import type { DashboardGridProps } from "../../../../src";
import { DashboardGrid } from "../../../../src";

import type { DashboardRuntime, ExampleWidgetData } from "../types";

type DashboardPreviewProps = {
  dashboard: DashboardRuntime;
  externalDropTargets?: DashboardGridProps<ExampleWidgetData>["externalDropTargets"];
  movable?: boolean;
  onWidgetExternalDrop?: DashboardGridProps<ExampleWidgetData>["onWidgetExternalDrop"];
  onLayoutCommit?: DashboardGridProps<ExampleWidgetData>["onLayoutCommit"];
  onWidgetRemove?: DashboardGridProps<ExampleWidgetData>["onRemoveWidget"];
  onWidgetSelect?: (id: string) => void;
  resizable?: boolean;
  selectedWidgetId?: string;
  showControls?: boolean;
};

export function DashboardPreview({
  dashboard,
  externalDropTargets,
  movable = true,
  onLayoutCommit,
  onWidgetExternalDrop,
  onWidgetRemove,
  onWidgetSelect,
  resizable = true,
  selectedWidgetId,
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
        onRemoveWidget={onWidgetRemove ?? dashboard.commands.removeWidget}
        onRestoreWidget={dashboard.commands.restoreWidget}
        onLayoutCommit={onLayoutCommit}
        onWidgetExternalDrop={onWidgetExternalDrop}
        onWidgetHeaderDoubleClick={dashboard.commands.fitWidgetToColumns}
        onWidgetLayoutChange={onLayoutCommit ? undefined : dashboard.commands.updateWidgetLayout}
        renderWidget={(widget) => {
          const content = (
            <>
              <span>{widget.data?.description}</span>
              <strong>{widget.data?.value}</strong>
            </>
          );

          return onWidgetSelect ? (
            <button
              aria-label={`${widget.title ?? widget.id} 위젯 선택`}
              aria-pressed={selectedWidgetId === widget.id}
              className="dashboard-widget-body"
              data-selected={selectedWidgetId === widget.id ? "true" : "false"}
              type="button"
              onClick={() => onWidgetSelect(widget.id)}
            >
              {content}
            </button>
          ) : (
            <div className="dashboard-widget-body">{content}</div>
          );
        }}
      />
    </>
  );
}

export function PlaygroundHeader({
  description,
  kicker,
  title,
}: {
  description: string;
  kicker: string;
  title: string;
}) {
  const generatedId = useId();
  const titleId = `playground-title-${generatedId.replace(/:/g, "")}`;

  return (
    <header aria-labelledby={titleId} className="playground-header">
      <p className="example-kicker">{kicker}</p>
      <h1 id={titleId}>{title}</h1>
      <p className="playground-description">{description}</p>
    </header>
  );
}

export function toggleStateProps(active: boolean) {
  return {
    "aria-pressed": active,
    "data-active": active ? "true" : "false",
  } as const;
}
