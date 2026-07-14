import { GridStack } from "gridstack";
import type { GridItemHTMLElement, GridStackNode, GridStackWidget } from "gridstack";
import { mapDashboardGridOptions, mapDashboardWidgetOptions } from "./option-mapper";
import type { DashboardGridEngineOptions } from "./option-mapper";
import type { DashboardLayoutSnapshot, DashboardWidget, DashboardWidgetLayout } from "../core/types";

export type DashboardGridAdapterOptions<TData = unknown> = DashboardGridEngineOptions & {
  widgets: DashboardWidget<TData>[];
  onLayoutCommit?: (snapshot: DashboardLayoutSnapshot) => void;
  onWidgetLayoutChange?: (id: string, layout: DashboardWidgetLayout) => void;
  onWidgetResize?: (id: string, size: { width: number; height: number }) => void;
};

export type DashboardGridAdapter<TData = unknown> = {
  grid: GridStack;
  sync: (options: DashboardGridAdapterOptions<TData>) => void;
  refresh: () => void;
  compact: () => void;
  destroy: () => void;
};

type PointerSnapshot = {
  clientX: number;
  clientY: number;
};

export function createDashboardGridAdapter<TData>(
  element: HTMLElement,
  options: DashboardGridAdapterOptions<TData>,
): DashboardGridAdapter<TData> {
  const grid = GridStack.init(mapDashboardGridOptions(options), element);
  let currentOptions = options;
  let isInteracting = false;
  let pendingCommit = false;
  let pendingSync = false;
  let finishInteractionFrame: number | undefined;
  let deferredSyncFrame: number | undefined;
  let forceEndFrame: number | undefined;
  let lastPointer: PointerSnapshot | undefined;
  let activeInteractionItem: GridItemHTMLElement | undefined;
  let pendingForcedRevealItem: GridItemHTMLElement | undefined;
  let pendingForcedRevealId: string | undefined;
  let interactionGuardsAttached = false;

  const commitLayout = () => {
    const snapshot = readDashboardLayoutSnapshot(grid, currentOptions.columns ?? 12);
    snapshot.widgets.forEach((layout) => currentOptions.onWidgetLayoutChange?.(layout.id, layout));
    currentOptions.onLayoutCommit?.(snapshot);
  };

  const resizeHandler = (_event: Event, item: GridItemHTMLElement) => {
    const id = item.getAttribute("gs-id") ?? item.getAttribute("data-widget-id");
    if (!id) {
      return;
    }
    const rect = item.getBoundingClientRect();
    currentOptions.onWidgetResize?.(id, { width: rect.width, height: rect.height });
  };

  const runSync = (nextOptions: DashboardGridAdapterOptions<TData>) => {
    grid.updateOptions(mapDashboardGridOptions(nextOptions));
    grid.column(nextOptions.columns ?? 12, "move");
    syncGridWidgets(grid, element, nextOptions.widgets, nextOptions);
  };

  const cancelFrame = (frame: number | undefined) => {
    if (frame !== undefined) {
      window.cancelAnimationFrame(frame);
    }
  };

  const resetGridStackItemDragDrop = (item: GridItemHTMLElement) => {
    if (!item.gridstackNode) {
      return;
    }

    grid.prepareDragDrop(item, true);

    const id = item.getAttribute("data-widget-id") ?? item.getAttribute("gs-id");
    const widget = currentOptions.widgets.find((candidate) => candidate.id === id);
    const gridWidget = widget ? toGridStackWidget(widget, currentOptions) : undefined;
    grid.movable(item, !(gridWidget?.noMove ?? false));
    grid.resizable(item, !(gridWidget?.noResize ?? false));
  };

  const captureInteractionPointer = (event: MouseEvent) => {
    if (!isInteracting) {
      return;
    }
    lastPointer = { clientX: event.clientX, clientY: event.clientY };
  };

  const findActiveInteractionItem = () =>
    element.querySelector<GridItemHTMLElement>(".grid-stack-item.ui-resizable-resizing, .grid-stack-item.ui-draggable-dragging") ??
    activeInteractionItem;

  const hasActiveInteractionClass = (item: GridItemHTMLElement | undefined) =>
    Boolean(item?.classList.contains("ui-resizable-resizing") || item?.classList.contains("ui-draggable-dragging"));

  const scheduleInteractionFallback = (event?: MouseEvent) => {
    if (!isInteracting || forceEndFrame !== undefined) {
      return;
    }

    if (event) {
      captureInteractionPointer(event);
    }
    if (!lastPointer) {
      return;
    }

    const point = { ...lastPointer };

    forceEndFrame = window.requestAnimationFrame(() => {
      forceEndFrame = undefined;
      if (!isInteracting) {
        return;
      }

      const forcedInteractionItem = findActiveInteractionItem();
      if (!hasActiveInteractionClass(forcedInteractionItem)) {
        stopInteraction();
        return;
      }

      document.dispatchEvent(
        new MouseEvent("mouseup", {
          bubbles: true,
          cancelable: true,
          button: 0,
          buttons: 0,
          clientX: point.clientX,
          clientY: point.clientY,
        }),
      );
      forcedInteractionItem?.dispatchEvent(
        new MouseEvent("mouseout", {
          bubbles: true,
          cancelable: true,
          clientX: point.clientX,
          clientY: point.clientY,
          relatedTarget: null,
        }),
      );
      forcedInteractionItem?.classList.remove("ui-resizable-autohide");
      pendingForcedRevealItem = forcedInteractionItem;
      pendingForcedRevealId =
        forcedInteractionItem?.getAttribute("data-widget-id") ?? forcedInteractionItem?.getAttribute("gs-id") ?? undefined;
      if (isInteracting && finishInteractionFrame === undefined) {
        stopInteraction();
      }
    });
  };

  const handleDocumentMouseMove = (event: MouseEvent) => {
    captureInteractionPointer(event);
    if (event.buttons === 0) {
      scheduleInteractionFallback(event);
    }
  };

  const handleDocumentMouseLeave = (event: MouseEvent) => {
    captureInteractionPointer(event);
    if (event.relatedTarget !== null) {
      return;
    }
    if (event.buttons === 0) {
      scheduleInteractionFallback(event);
    }
  };

  const handleInteractionRelease = (event: MouseEvent | PointerEvent) => {
    scheduleInteractionFallback(event);
  };

  const attachInteractionGuards = () => {
    if (interactionGuardsAttached) {
      return;
    }
    interactionGuardsAttached = true;
    document.addEventListener("mousemove", handleDocumentMouseMove, true);
    document.documentElement.addEventListener("mouseleave", handleDocumentMouseLeave, true);
    window.addEventListener("mouseup", handleInteractionRelease, true);
    window.addEventListener("pointerup", handleInteractionRelease, true);
  };

  const detachInteractionGuards = () => {
    if (!interactionGuardsAttached) {
      return;
    }
    interactionGuardsAttached = false;
    document.removeEventListener("mousemove", handleDocumentMouseMove, true);
    document.documentElement.removeEventListener("mouseleave", handleDocumentMouseLeave, true);
    window.removeEventListener("mouseup", handleInteractionRelease, true);
    window.removeEventListener("pointerup", handleInteractionRelease, true);
  };

  const findPendingForcedRevealItem = () => {
    if (pendingForcedRevealItem?.isConnected && pendingForcedRevealItem.gridstackNode) {
      return pendingForcedRevealItem;
    }
    if (!pendingForcedRevealId) {
      return undefined;
    }
    return [...element.querySelectorAll<GridItemHTMLElement>(".grid-stack-item")].find(
      (item) =>
        item.gridstackNode &&
        (item.getAttribute("data-widget-id") === pendingForcedRevealId || item.getAttribute("gs-id") === pendingForcedRevealId),
    );
  };

  const revealPendingForcedItem = () => {
    const item = findPendingForcedRevealItem();
    if (item) {
      resetGridStackItemDragDrop(item);
    }
    item?.classList.remove("ui-resizable-autohide");
    window.requestAnimationFrame(() => item?.classList.remove("ui-resizable-autohide"));
    pendingForcedRevealItem = undefined;
    pendingForcedRevealId = undefined;
  };

  const scheduleDeferredSync = () => {
    cancelFrame(deferredSyncFrame);
    deferredSyncFrame = window.requestAnimationFrame(() => {
      deferredSyncFrame = undefined;
      if (isInteracting) {
        pendingSync = true;
        return;
      }
      runSync(currentOptions);
      revealPendingForcedItem();
    });
  };

  const flushInteraction = () => {
    finishInteractionFrame = undefined;
    detachInteractionGuards();
    lastPointer = undefined;
    activeInteractionItem = undefined;
    isInteracting = false;

    const shouldCommit = pendingCommit;
    const shouldSync = pendingSync;
    pendingCommit = false;
    pendingSync = false;

    if (shouldCommit) {
      commitLayout();
    }
    if (shouldSync) {
      scheduleDeferredSync();
    } else {
      revealPendingForcedItem();
    }
  };

  const startInteraction = (event?: Event, item?: GridItemHTMLElement) => {
    isInteracting = true;
    activeInteractionItem =
      item ??
      (event?.target instanceof HTMLElement
        ? (event.target.closest(".grid-stack-item") as GridItemHTMLElement | null) ?? undefined
        : undefined);
    cancelFrame(finishInteractionFrame);
    cancelFrame(forceEndFrame);
    finishInteractionFrame = undefined;
    forceEndFrame = undefined;
    if (event instanceof MouseEvent) {
      captureInteractionPointer(event);
    }
    attachInteractionGuards();
  };

  const stopInteraction = () => {
    pendingCommit = true;
    detachInteractionGuards();
    cancelFrame(forceEndFrame);
    cancelFrame(finishInteractionFrame);
    forceEndFrame = undefined;
    finishInteractionFrame = window.requestAnimationFrame(flushInteraction);
  };

  const changeHandler = () => {
    if (isInteracting) {
      pendingCommit = true;
      return;
    }
    commitLayout();
  };

  grid.on("change", changeHandler);
  grid.on("dragstart", startInteraction);
  grid.on("resizestart", startInteraction);
  grid.on("dragstop", stopInteraction);
  grid.on("resizestop", stopInteraction);
  grid.on("resize", resizeHandler);

  const adapter: DashboardGridAdapter<TData> = {
    grid,
    sync(nextOptions) {
      currentOptions = nextOptions;
      if (isInteracting) {
        pendingSync = true;
        return;
      }
      runSync(nextOptions);
    },
    refresh() {
      grid.compact("compact", true);
    },
    compact() {
      grid.compact("compact", true);
      commitLayout();
    },
    destroy() {
      detachInteractionGuards();
      pendingForcedRevealItem = undefined;
      pendingForcedRevealId = undefined;
      cancelFrame(finishInteractionFrame);
      cancelFrame(deferredSyncFrame);
      cancelFrame(forceEndFrame);
      grid.offAll();
      grid.destroy(false);
    },
  };

  adapter.sync(options);

  return adapter;
}

export function toGridStackWidget<TData>(
  widget: DashboardWidget<TData>,
  options: DashboardGridEngineOptions,
): GridStackWidget {
  const widgetOptions = mapDashboardWidgetOptions(widget, options);

  return {
    ...widget.layout,
    id: widget.id,
    ...widgetOptions,
  };
}

export function readDashboardLayoutSnapshot(grid: GridStack, columns: number): DashboardLayoutSnapshot {
  const saved = grid.save(false, false, undefined, columns) as GridStackWidget[];

  return {
    columns: mapDashboardGridOptions({ columns }).column as DashboardLayoutSnapshot["columns"],
    widgets: saved
      .filter((item): item is GridStackWidget & { id: string } => typeof item.id === "string")
      .map((item) => ({
        id: item.id,
        x: item.x ?? 0,
        y: item.y ?? 0,
        w: item.w ?? 1,
        h: item.h ?? 1,
        minW: item.minW,
        minH: item.minH,
        maxW: item.maxW,
        maxH: item.maxH,
      })),
  };
}

function syncGridWidgets<TData>(
  grid: GridStack,
  element: HTMLElement,
  widgets: DashboardWidget<TData>[],
  options: DashboardGridEngineOptions,
) {
  const nextIds = new Set(widgets.map((widget) => widget.id));
  const nodes = [...grid.engine.nodes] as GridStackNode[];

  nodes.forEach((node) => {
    if (typeof node.id === "string" && !nextIds.has(node.id) && node.el) {
      grid.removeWidget(node.el, false, false);
    }
  });

  widgets.forEach((widget) => {
    const item = element.querySelector<HTMLElement>(`[data-widget-id="${widget.id}"]`);
    if (!item) {
      return;
    }

    const gridItem = item as GridItemHTMLElement;
    const gridWidget = toGridStackWidget(widget, options);
    if (gridItem.gridstackNode) {
      grid.update(gridItem, gridWidget);
    } else {
      grid.makeWidget(gridItem, gridWidget);
    }
    grid.movable(gridItem, !(gridWidget.noMove ?? false));
    grid.resizable(gridItem, !(gridWidget.noResize ?? false));
  });
}
