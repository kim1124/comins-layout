import { Move, MoveDiagonal2, Trash2 } from "lucide-react";

import { DashboardGrid } from "../../../../src";
import type {
  DashboardGridProps,
  DashboardWidget,
} from "../../../../src";
import { usePlaygroundLocale } from "../locale";
import type { DashboardRuntime, ExampleWidgetData } from "../types";
import { WidgetSettingsTable } from "./WidgetSettingsTable";

type ExampleDashboardProps = Pick<
  DashboardGridProps<ExampleWidgetData>,
  | "className"
  | "engineOptions"
  | "movable"
  | "resizable"
  | "responsive"
  | "showControls"
  | "lazyRenderWidget"
  | "onBeforeMove"
  | "onMove"
  | "onAfterMove"
  | "onBeforeResize"
  | "onResize"
  | "onAfterResize"
  | "onBeforeTitleDoubleClick"
  | "onTitleDoubleClick"
  | "onAfterTitleDoubleClick"
> & {
  dashboard: DashboardRuntime;
};

export function ExampleDashboard({
  dashboard,
  engineOptions,
  movable = true,
  resizable = true,
  ...callbacks
}: ExampleDashboardProps) {
  const { locale, text } = usePlaygroundLocale();
  const className = ["playground-grid--numbered", callbacks.className].filter(Boolean).join(" ");
  const renderActions = (widget: DashboardWidget<ExampleWidgetData>) => {
    const resizeLocked = widget.locked === true || widget.resizable === false;
    const moveLocked = widget.locked === true || widget.movable === false;
    const title = widget.title ?? widget.id;
    return (
      <>
        <button
          aria-label={locale === "ko"
            ? `${title} 리사이즈 ${resizeLocked ? "잠금 해제" : "잠금"}`
            : `${title} ${resizeLocked ? "Unlock resizing" : "Lock resizing"}`}
          aria-pressed={resizeLocked}
          data-widget-action="resize-lock"
          title={text(resizeLocked ? "리사이즈 잠금 해제" : "리사이즈 잠금", resizeLocked ? "Unlock resizing" : "Lock resizing")}
          type="button"
          onClick={() => dashboard.commands.updateWidget(widget.id, { resizable: resizeLocked })}
        >
          <MoveDiagonal2 aria-hidden="true" size={15} />
        </button>
        <button
          aria-label={locale === "ko"
            ? `${title} 이동 ${moveLocked ? "잠금 해제" : "잠금"}`
            : `${title} ${moveLocked ? "Unlock movement" : "Lock movement"}`}
          aria-pressed={moveLocked}
          data-widget-action="move-lock"
          title={text(moveLocked ? "이동 잠금 해제" : "이동 잠금", moveLocked ? "Unlock movement" : "Lock movement")}
          type="button"
          onClick={() => dashboard.commands.updateWidget(widget.id, { movable: moveLocked })}
        >
          <Move aria-hidden="true" size={15} />
        </button>
        <button
          aria-label={text(`${title} 삭제`, `Remove ${title}`)}
          className="comins-grid-layout-widget__action--danger"
          data-widget-action="remove"
          title={text("삭제", "Remove")}
          type="button"
          onClick={() => dashboard.commands.removeWidget(widget.id)}
        >
          <Trash2 aria-hidden="true" size={15} />
        </button>
      </>
    );
  };

  return (
    <DashboardGrid
      {...callbacks}
      className={className}
      columns={dashboard.columns}
      engineOptions={{ animate: false, ...engineOptions }}
      movable={movable}
      refreshKey={dashboard.refreshVersion}
      renderWidgetActions={renderActions}
      resizable={resizable}
      responsive={callbacks.responsive}
      widgets={dashboard.widgets}
      onColumnsChange={dashboard.commands.setColumns}
      onLayoutCommit={dashboard.commands.applyLayoutSnapshot}
      renderWidget={(widget) => (
        <div className="playground-numbered-widget-content">
          <WidgetSettingsTable movable={movable} resizable={resizable} widget={widget} />
        </div>
      )}
    />
  );
}
