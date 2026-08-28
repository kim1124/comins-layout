import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import type { ForwardedRef, ReactElement, ReactNode, RefAttributes } from "react";
import { clampDashboardColumnCount } from "../core/columns";
import { validateDashboardGridConfiguration } from "../core/configuration";
import { createDashboardResizeScheduler } from "../core/resize-scheduler";
import type {
  DashboardColumnCount,
  DashboardExternalDropTarget,
  DashboardGridEngineOptions,
  DashboardInteractionOptions,
  DashboardLayoutSnapshot,
  DashboardResponsiveOptions,
  DashboardWidget as DashboardWidgetModel,
  DashboardWidgetExternalDropEvent,
  DashboardWidgetDropCandidate,
  DashboardWidgetDropRequest,
  DashboardWidgetInteractionEvent,
  DashboardWidgetResizeFrameEvent,
  DashboardWidgetTransferMode,
} from "../core/types";
import type { DashboardGridAdapter, DashboardGridHandle } from "../gridstack/adapter";
import { validateDashboardExternalDropTargetSelectors } from "../gridstack/external-drop-target";
import { DashboardWidgetShell } from "./DashboardWidget";
import type { DashboardWidgetActionLabels } from "./DashboardWidget";

export type { DashboardGridHandle } from "../gridstack/adapter";

export type DashboardGridProps<TData = unknown> = DashboardInteractionOptions & {
  widgets: DashboardWidgetModel<TData>[];
  columns?: DashboardColumnCount;
  engineOptions?: DashboardGridEngineOptions;
  responsive?: DashboardResponsiveOptions;
  externalDropTargets?: ReadonlyArray<DashboardExternalDropTarget>;
  gridId?: string;
  acceptExternalWidgets?: boolean | ((candidate: DashboardWidgetDropCandidate<TData>) => boolean);
  gridTransferMode?: DashboardWidgetTransferMode;
  className?: string;
  refreshKey?: number;
  showControls?: boolean;
  lazyRenderWidget?: boolean;
  actionLabels?: Partial<DashboardWidgetActionLabels>;
  renderWidget: (widget: DashboardWidgetModel<TData>) => ReactNode;
  renderWidgetActions?: (widget: DashboardWidgetModel<TData>) => ReactNode;
  onColumnsChange?: (columns: DashboardColumnCount) => void;
  onLayoutCommit?: (snapshot: DashboardLayoutSnapshot) => void;
  onWidgetLayoutChange?: (id: string, layout: DashboardWidgetModel<TData>["layout"]) => void;
  onWidgetResizeFrame?: (event: DashboardWidgetResizeFrameEvent) => void;
  onWidgetExternalDrop?: (event: DashboardWidgetExternalDropEvent) => void;
  onWidgetDropRequest?: (request: DashboardWidgetDropRequest<TData>) => void;
  onWidgetDragStart?: (event: DashboardWidgetInteractionEvent) => void;
  onWidgetDragStop?: (event: DashboardWidgetInteractionEvent) => void;
  onWidgetResizeStart?: (event: DashboardWidgetInteractionEvent) => void;
  onWidgetResizeStop?: (event: DashboardWidgetInteractionEvent) => void;
  onBeforeMove?: (event: DashboardWidgetInteractionEvent) => void;
  onMove?: (event: DashboardWidgetInteractionEvent) => void;
  onAfterMove?: (event: DashboardWidgetInteractionEvent) => void;
  onBeforeResize?: (event: DashboardWidgetInteractionEvent) => void;
  onResize?: (event: DashboardWidgetInteractionEvent) => void;
  onAfterResize?: (event: DashboardWidgetInteractionEvent) => void;
  onBeforeTitleDoubleClick?: (event: DashboardWidgetInteractionEvent) => void;
  onTitleDoubleClick?: (event: DashboardWidgetInteractionEvent) => void;
  onAfterTitleDoubleClick?: (event: DashboardWidgetInteractionEvent) => void;
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
    engineOptions,
    responsive,
    externalDropTargets,
    gridId,
    acceptExternalWidgets = false,
    gridTransferMode,
    editable = true,
    movable = true,
    resizable = true,
    className,
    refreshKey,
    showControls = true,
    lazyRenderWidget = false,
    actionLabels,
    renderWidget,
    renderWidgetActions,
    onColumnsChange,
    onLayoutCommit,
    onWidgetLayoutChange,
    onWidgetResizeFrame,
    onWidgetExternalDrop,
    onWidgetDropRequest,
    onWidgetDragStart,
    onWidgetDragStop,
    onWidgetResizeStart,
    onWidgetResizeStop,
    onBeforeMove,
    onMove,
    onAfterMove,
    onBeforeResize,
    onResize,
    onAfterResize,
    onBeforeTitleDoubleClick,
    onTitleDoubleClick,
    onAfterTitleDoubleClick,
    onMaximizeWidget,
    onMinimizeWidget,
    onRestoreWidget,
    onRemoveWidget,
    onWidgetHeaderDoubleClick,
  } = props;
  validateDashboardGridConfiguration({
    engineOptions,
    responsive,
    externalDropTargets,
    gridId,
    acceptExternalWidgets,
    gridTransferMode,
  });
  if (typeof document !== "undefined") {
    validateDashboardExternalDropTargetSelectors(document, externalDropTargets);
  }
  const gridElementRef = useRef<HTMLDivElement>(null);
  const adapterRef = useRef<DashboardGridAdapter<TData> | undefined>(undefined);
  const [activeColumns, setActiveColumns] = useState(() => clampDashboardColumnCount(columns));
  const handleColumnsChange = useCallback((nextColumns: DashboardColumnCount) => {
    setActiveColumns(nextColumns);
    onColumnsChange?.(nextColumns);
  }, [onColumnsChange]);
  const handleLayoutCommit = useCallback((snapshot: DashboardLayoutSnapshot) => {
    const controlledColumns = clampDashboardColumnCount(columns);
    if (!responsive && snapshot.columns !== controlledColumns) {
      return;
    }
    onLayoutCommit?.(snapshot);
  }, [columns, onLayoutCommit, responsive]);
  useImperativeHandle(
    ref,
    () => ({
      getGridStack: () => adapterRef.current?.grid ?? null,
      getColumnCount: () => adapterRef.current?.grid.getColumn() ?? null,
      getRowCount: () => adapterRef.current?.grid.getRow() ?? null,
      getFloat: () => adapterRef.current?.grid.getFloat() ?? null,
      isAreaEmpty: (layout) => adapterRef.current?.grid.isAreaEmpty(layout.x, layout.y, layout.w, layout.h) ?? null,
      willItFit: (layout) => adapterRef.current?.grid.willItFit(layout) ?? null,
      refresh: () => adapterRef.current?.refresh(),
      compact: (layout, doSort) => adapterRef.current?.compact(layout, doSort) ?? null,
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

  useEffect(() => {
    if (!responsive) {
      setActiveColumns(clampDashboardColumnCount(columns));
    }
  }, [columns, responsive]);

  const adapterOptions = useMemo(
    () => ({
      columns,
      engineOptions,
      responsive,
      editable,
      movable,
      resizable,
      widgets,
      externalDropTargets,
      gridId,
      acceptExternalWidgets,
      gridTransferMode,
      onColumnsChange: handleColumnsChange,
      onLayoutCommit: handleLayoutCommit,
      onWidgetLayoutChange,
      onWidgetExternalDrop,
      onWidgetDropRequest,
      onWidgetDragStart,
      onWidgetDragStop,
      onWidgetResizeStart,
      onWidgetResizeStop,
      onBeforeMove,
      onMove,
      onAfterMove,
      onBeforeResize,
      onResize,
      onAfterResize,
      onWidgetResize: (id: string, size: { width: number; height: number }) => {
        resizeScheduler.schedule({ id, width: size.width, height: size.height });
      },
    }),
    [
      columns,
      editable,
      engineOptions,
      externalDropTargets,
      gridId,
      acceptExternalWidgets,
      gridTransferMode,
      handleColumnsChange,
      handleLayoutCommit,
      movable,
      onWidgetExternalDrop,
      onWidgetDropRequest,
      onWidgetDragStart,
      onWidgetDragStop,
      onWidgetLayoutChange,
      onWidgetResizeStart,
      onWidgetResizeStop,
      onBeforeMove,
      onMove,
      onAfterMove,
      onBeforeResize,
      onResize,
      onAfterResize,
      responsive,
      resizable,
      resizeScheduler,
      widgets,
    ],
  );
  const adapterOptionsRef = useRef(adapterOptions);
  const adapterReinitializeKey = useMemo(
    () => JSON.stringify([engineOptions?.rtl ?? null, engineOptions?.sizeToContent ?? null]),
    [engineOptions?.rtl, engineOptions?.sizeToContent],
  );

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
        if (!nextAdapter) {
          console.error("Failed to initialize comins-grid-layout adapter.");
          return;
        }
        adapter = nextAdapter;
        adapterRef.current = nextAdapter;
      })
      .catch(() => {
        if (mounted) {
          console.error("Failed to initialize comins-grid-layout adapter.");
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
  }, [adapterReinitializeKey]);

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
      data-columns={activeColumns}
      data-grid-id={gridId?.trim() || undefined}
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
              onBeforeTitleDoubleClick={onBeforeTitleDoubleClick}
              onTitleDoubleClick={onTitleDoubleClick}
              onAfterTitleDoubleClick={onAfterTitleDoubleClick}
              renderActions={renderWidgetActions}
            >
              <DashboardWidgetContent
                enabled={lazyRenderWidget && (widget.lazyLoad ?? true)}
                renderWidget={renderWidget}
                widget={widget}
              />
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

function DashboardWidgetContent<TData>({
  enabled,
  renderWidget,
  widget,
}: {
  enabled: boolean;
  renderWidget: (widget: DashboardWidgetModel<TData>) => ReactNode;
  widget: DashboardWidgetModel<TData>;
}) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(!enabled);

  useEffect(() => {
    if (!enabled) {
      setVisible(true);
      return;
    }
    const element = contentRef.current;
    if (!element || typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const grid = element.closest<HTMLElement>(".grid-stack");
    const item = element.closest<HTMLElement>(".grid-stack-item") as (HTMLElement & { gridstackNode?: unknown }) | null;
    let frame: number | undefined;
    let observer: IntersectionObserver | undefined;
    let cancelled = false;
    const observePositionedItem = () => {
      if (cancelled) {
        return;
      }
      const initializedGrid = grid as (HTMLElement & { gridstack?: unknown }) | null;
      if (!initializedGrid?.gridstack || !item?.gridstackNode) {
        frame = window.requestAnimationFrame(observePositionedItem);
        return;
      }
      observer = new IntersectionObserver((entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          observer?.disconnect();
        }
      }, { root: element.closest("[data-dashboard-lazy-scroll]") });
      observer.observe(element);
    };
    observePositionedItem();
    return () => {
      cancelled = true;
      if (frame !== undefined) {
        window.cancelAnimationFrame(frame);
      }
      observer?.disconnect();
    };
  }, [enabled]);

  return (
    <div
      ref={contentRef}
      className="comins-grid-layout-widget__render-boundary"
      data-lazy-rendered={String(visible)}
    >
      {visible ? renderWidget(widget) : null}
    </div>
  );
}
