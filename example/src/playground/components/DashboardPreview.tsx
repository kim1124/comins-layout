import { useId, useMemo } from "react";
import type { DashboardGridProps } from "../../../../src";
import { DashboardGrid } from "../../../../src";

import { usePlaygroundLocale } from "../../i18n/playground-locale";
import { createPresentedWidgets, resolveDashboardActionLabels, sharedPlaygroundCopy, widgetPlaygroundCopy } from "../copy";
import { pastelColor } from "../palette";
import type { DashboardRuntime, ExampleWidgetData } from "../types";

type DashboardPreviewProps = {
  dashboard: DashboardRuntime;
  externalDropTargets?: DashboardGridProps<ExampleWidgetData>["externalDropTargets"];
  movable?: boolean;
  onWidgetExternalDrop?: DashboardGridProps<ExampleWidgetData>["onWidgetExternalDrop"];
  onLayoutCommit?: DashboardGridProps<ExampleWidgetData>["onLayoutCommit"];
  onWidgetRemove?: DashboardGridProps<ExampleWidgetData>["onRemoveWidget"];
  onWidgetSelect?: (id: string) => void;
  isWidgetRefreshing?: (id: string) => boolean;
  indexedFixturePresentation?: boolean;
  renderWidgetActions?: NonNullable<DashboardGridProps<ExampleWidgetData>["renderWidgetActions"]>;
  resizable?: boolean;
  selectedWidgetId?: string;
  showControls?: boolean;
  showWidgetCount?: boolean;
};

export function DashboardPreview({
  dashboard,
  externalDropTargets,
  movable = true,
  onLayoutCommit,
  onWidgetExternalDrop,
  onWidgetRemove,
  onWidgetSelect,
  isWidgetRefreshing,
  indexedFixturePresentation = false,
  renderWidgetActions,
  resizable = true,
  selectedWidgetId,
  showControls = true,
  showWidgetCount = true,
}: DashboardPreviewProps) {
  const { locale, text } = usePlaygroundLocale();
  const widgets = useMemo(
    () => createPresentedWidgets(dashboard.widgets, locale, indexedFixturePresentation),
    [dashboard.widgets, indexedFixturePresentation, locale],
  );

  return (
    <>
      {showWidgetCount ? (
        <p className="example-widget-count">{text(sharedPlaygroundCopy.widgetCount).replace("{count}", String(dashboard.widgets.length))}</p>
      ) : null}
      <DashboardGrid
        actionLabels={resolveDashboardActionLabels(locale)}
        columns={dashboard.columns}
        externalDropTargets={externalDropTargets}
        movable={movable}
        refreshKey={dashboard.refreshVersion}
        resizable={resizable}
        renderWidgetActions={renderWidgetActions}
        showControls={showControls}
        widgets={widgets}
        onMaximizeWidget={dashboard.commands.maximizeWidget}
        onMinimizeWidget={dashboard.commands.minimizeWidget}
        onRemoveWidget={onWidgetRemove ?? dashboard.commands.removeWidget}
        onRestoreWidget={dashboard.commands.restoreWidget}
        onLayoutCommit={onLayoutCommit}
        onWidgetExternalDrop={onWidgetExternalDrop}
        onWidgetHeaderDoubleClick={dashboard.commands.fitWidgetToColumns}
        onWidgetLayoutChange={onLayoutCommit ? undefined : dashboard.commands.updateWidgetLayout}
        renderWidget={(widget) => {
          const refreshing = isWidgetRefreshing?.(widget.id) ?? false;
          const colors = pastelColor(widget.data?.colorKey ?? "mint");
          const content = (
            refreshing ? (
              <span
                aria-label={widgetPlaygroundCopy.refreshStatus[locale](widget.title ?? widget.id)}
                className="dashboard-widget-loader"
                role="status"
              >
                <span aria-hidden="true" className="dashboard-widget-loader__spinner" />
                {widgetPlaygroundCopy.refreshStatus[locale](widget.title ?? widget.id)}
              </span>
            ) : (
              <>
                <span>{widget.data?.description}</span>
                <strong>
                  {widget.data?.value}
                  {widget.data?.contentRevision ? ` · ${widget.data.contentRevision}` : ""}
                </strong>
              </>
            )
          );

          return onWidgetSelect ? (
            <button
              aria-label={`${widget.title ?? widget.id} ${text(sharedPlaygroundCopy.widgetSelect)}`}
              aria-pressed={selectedWidgetId === widget.id}
              className="dashboard-widget-body"
              data-selected={selectedWidgetId === widget.id ? "true" : "false"}
              style={{ background: colors.background, color: colors.foreground }}
              type="button"
              onClick={() => onWidgetSelect(widget.id)}
            >
              {content}
            </button>
          ) : (
            <div className="dashboard-widget-body" style={{ background: colors.background, color: colors.foreground }}>{content}</div>
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
