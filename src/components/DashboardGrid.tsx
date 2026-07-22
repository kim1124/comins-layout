import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from "react";
import type { ForwardedRef, ReactElement, ReactNode, RefAttributes } from "react";
import { createDashboardResizeScheduler } from "../core/resize-scheduler";
import type {
  DashboardColumnCount,
  DashboardInteractionOptions,
  DashboardLayoutSnapshot,
  DashboardWidget as DashboardWidgetModel,
  DashboardWidgetResizeFrameEvent,
} from "../core/types";
import type { DashboardGridAdapter, DashboardGridHandle } from "../gridstack/adapter";
import { DashboardWidgetShell } from "./DashboardWidget";
import type { DashboardWidgetActionLabels } from "./DashboardWidget";

export type { DashboardGridHandle } from "../gridstack/adapter";

export type DashboardGridProps<TData = unknown> = DashboardInteractionOptions & {
  widgets: DashboardWidgetModel<TData>[];
  columns?: DashboardColumnCount;
  className?: string;
  refreshKey?: number;
  showControls?: boolean;
  actionLabels?: Partial<DashboardWidgetActionLabels>;
  renderWidget: (widget: DashboardWidgetModel<TData>) => ReactNode;
  onLayoutCommit?: (snapshot: DashboardLayoutSnapshot) => void;
  onWidgetLayoutChange?: (id: string, layout: DashboardWidgetModel<TData>["layout"]) => void;
  onWidgetResizeFrame?: (event: DashboardWidgetResizeFrameEvent) => void;
  onMaximizeWidget?: (id: string) => void;
  onMinimizeWidget?: (id: string) => void;
  onRestoreWidget?: (id: string) => void;
  onRemoveWidget?: (id: string) => void;
  onWidgetHeaderDoubleClick?: (id: string) => void;
};

function DashboardGridInner<TData = unknown>(
  props: DashboardGridProps<TData>,
  ref: ForwardedRef<DashboardGridHandle>,
): ReactElement {
  const {
    widgets,
    columns = 12,
    editable = true,
    movable = true,
    resizable = true,
    className,
    refreshKey,
    showControls = true,
    actionLabels,
    renderWidget,
    onLayoutCommit,
    onWidgetLayoutChange,
    onWidgetResizeFrame,
    onMaximizeWidget,
    onMinimizeWidget,
    onRestoreWidget,
    onRemoveWidget,
    onWidgetHeaderDoubleClick,
  } = props;
  const gridElementRef = useRef<HTMLDivElement>(null);
  const adapterRef = useRef<DashboardGridAdapter<TData> | undefined>(undefined);
  useImperativeHandle(
    ref,
    () => ({
      getGridStack: () => adapterRef.current?.grid ?? null,
      refresh: () => adapterRef.current?.refresh(),
      commitLayout: () => adapterRef.current?.commit() ?? null,
    }),
    [],
  );
  const resizeFrameHandlerRef = useRef(onWidgetResizeFrame);
  const resizeScheduler = useMemo(
    () =>
      createDashboardResizeScheduler((event) => {
        resizeFrameHandlerRef.current?.(event);
      }),
    [],
  );

  useEffect(() => {
    resizeFrameHandlerRef.current = onWidgetResizeFrame;
  }, [onWidgetResizeFrame]);

  const adapterOptions = useMemo(
    () => ({
      columns,
      editable,
      movable,
      resizable,
      widgets,
      onLayoutCommit,
      onWidgetLayoutChange,
      onWidgetResize: (id: string, size: { width: number; height: number }) => {
        resizeScheduler.schedule({ id, width: size.width, height: size.height });
      },
    }),
    [columns, editable, movable, onLayoutCommit, onWidgetLayoutChange, resizable, resizeScheduler, widgets],
  );
  const adapterOptionsRef = useRef(adapterOptions);

  useEffect(() => {
    const gridElement = gridElementRef.current;
    if (!gridElement) {
      return;
    }

    let mounted = true;
    let adapter: DashboardGridAdapter<TData> | undefined;

    void import("../gridstack/adapter")
      .then(({ createDashboardGridAdapter }) => {
        if (!mounted || !gridElement.isConnected) {
          return;
        }
        const nextAdapter = createDashboardGridAdapter(gridElement, adapterOptionsRef.current);
        adapter = nextAdapter;
        adapterRef.current = nextAdapter;
      })
      .catch((error: unknown) => {
        if (mounted) {
          console.error("Failed to initialize comins-grid-layout adapter.", error);
        }
      });

    return () => {
      mounted = false;
      resizeScheduler.cancel();
      if (adapterRef.current === adapter) {
        adapterRef.current = undefined;
      }
      adapter?.destroy();
    };
  }, []);

  useEffect(() => {
    adapterOptionsRef.current = adapterOptions;
    adapterRef.current?.sync(adapterOptions);
  }, [adapterOptions]);

  useEffect(() => {
    if (refreshKey !== undefined) {
      adapterRef.current?.refresh();
    }
  }, [refreshKey]);

  return (
    <section
      ref={gridElementRef}
      className={["grid-stack", "comins-grid-layout", className].filter(Boolean).join(" ")}
      data-columns={columns}
      data-testid="dashboard-grid"
    >
      {widgets.map((widget) => (
        <article
          className="grid-stack-item"
          data-layout-h={widget.layout.h}
          data-layout-w={widget.layout.w}
          data-layout-x={widget.layout.x}
          data-layout-y={widget.layout.y}
          data-maximized={String(widget.maximized ?? false)}
          data-minimized={String(widget.minimized ?? false)}
          data-testid={`dashboard-widget-${widget.id}`}
          data-widget-id={widget.id}
          gs-h={String(widget.layout.h)}
          gs-id={widget.id}
          gs-w={String(widget.layout.w)}
          gs-x={String(widget.layout.x)}
          gs-y={String(widget.layout.y)}
          key={widget.id}
        >
          <div className="grid-stack-item-content">
            <DashboardWidgetShell
              widget={widget}
              labels={{
                maximize: actionLabels?.maximize ?? "최대화",
                minimize: actionLabels?.minimize ?? "최소화",
                restore: actionLabels?.restore ?? "복원",
                remove: actionLabels?.remove ?? "삭제",
              }}
              showControls={showControls}
              onMaximize={onMaximizeWidget}
              onMinimize={onMinimizeWidget}
              onRestore={onRestoreWidget}
              onRemove={onRemoveWidget}
              onHeaderDoubleClick={onWidgetHeaderDoubleClick}
            >
              {renderWidget(widget)}
            </DashboardWidgetShell>
          </div>
        </article>
      ))}
    </section>
  );
}

const ForwardedDashboardGrid = forwardRef(DashboardGridInner);
ForwardedDashboardGrid.displayName = "DashboardGrid";

export const DashboardGrid = ForwardedDashboardGrid as <TData = unknown>(
  props: DashboardGridProps<TData> & RefAttributes<DashboardGridHandle>,
) => ReactElement | null;
