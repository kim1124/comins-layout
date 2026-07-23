import { GridStack } from "gridstack";
import type { CompactOptions, GridItemHTMLElement, GridStackOptions, GridStackWidget } from "gridstack";
import { mapDashboardGridOptions, mapDashboardWidgetOptions } from "./option-mapper";
import type { DashboardGridOptionInput } from "./option-mapper";
import { clampDashboardColumnCount } from "../core/columns";
import type {
  DashboardLayoutSnapshot,
  DashboardWidget,
  DashboardWidgetInteractionEvent,
  DashboardWidgetLayout,
} from "../core/types";

export type DashboardGridAdapterOptions<TData = unknown> = DashboardGridOptionInput & {
  widgets: DashboardWidget<TData>[];
  onColumnsChange?: (columns: DashboardLayoutSnapshot["columns"]) => void;
  onLayoutCommit?: (snapshot: DashboardLayoutSnapshot) => void;
  onWidgetLayoutChange?: (id: string, layout: DashboardWidgetLayout) => void;
  onWidgetResize?: (id: string, size: { width: number; height: number }) => void;
  onWidgetDragStart?: (event: DashboardWidgetInteractionEvent) => void;
  onWidgetDragStop?: (event: DashboardWidgetInteractionEvent) => void;
  onWidgetResizeStart?: (event: DashboardWidgetInteractionEvent) => void;
  onWidgetResizeStop?: (event: DashboardWidgetInteractionEvent) => void;
};

export type DashboardGridAdapter<TData = unknown> = {
  grid: GridStack;
  sync: (options: DashboardGridAdapterOptions<TData>) => void;
  refresh: () => void;
  compact: (layout?: CompactOptions, doSort?: boolean) => DashboardLayoutSnapshot;
  commit: () => DashboardLayoutSnapshot;
  destroy: () => void;
};

export interface DashboardGridHandle {
  getGridStack(): GridStack | null;
  refresh(): void;
  compact(layout?: CompactOptions, doSort?: boolean): DashboardLayoutSnapshot | null;
  commitLayout(): DashboardLayoutSnapshot | null;
}

type PointerSnapshot = {
  clientX: number;
  clientY: number;
};

const layoutFields = ["id", "x", "y", "w", "h", "minW", "minH", "maxW", "maxH"] as const;

export function sameDashboardLayoutSnapshot(
  left: DashboardLayoutSnapshot | undefined,
  right: DashboardLayoutSnapshot | undefined,
) {
  if (!left || !right || left.columns !== right.columns || left.widgets.length !== right.widgets.length) {
    return false;
  }

  const rightById = new Map(right.widgets.map((widget) => [widget.id, widget]));
  return left.widgets.every((widget) => {
    const candidate = rightById.get(widget.id);
    return Boolean(candidate && layoutFields.every((field) => widget[field] === candidate[field]));
  });
}

export function createDashboardGridAdapter<TData>(
  element: HTMLElement,
  options: DashboardGridAdapterOptions<TData>,
): DashboardGridAdapter<TData> | undefined {
  const initializationOptions = options.engineOptions?.rtl === "auto"
    ? {
        ...options,
        engineOptions: {
          ...options.engineOptions,
          rtl: window.getComputedStyle(element).direction === "rtl",
        },
      }
    : options;
  const resolvedRtl = initializationOptions.engineOptions?.rtl === true;
  element.classList.toggle("grid-stack-rtl", resolvedRtl);
  element.querySelectorAll<HTMLElement>(".grid-stack-item").forEach((item) => {
    item.style.removeProperty("left");
    item.style.removeProperty("right");
  });
  const grid = GridStack.init(mapDashboardGridOptions(initializationOptions), element);
  if (!grid) {
    return undefined;
  }
  const registeredItems = new Map<string, GridItemHTMLElement>();
  let currentOptions = options;
  let appliedOptions = options;
  let isInteracting = false;
  let pendingCommit = false;
  let pendingSync = false;
  let finishInteractionFrame: number | undefined;
  let deferredSyncFrame: number | undefined;
  let forceEndFrame: number | undefined;
  let refreshFrame: number | undefined;
  let columnsFrame: number | undefined;
  let lastPointer: PointerSnapshot | undefined;
  let activeInteractionItem: GridItemHTMLElement | undefined;
  let activeInteractionKind: "drag" | "resize" | undefined;
  let pendingForcedRevealItem: GridItemHTMLElement | undefined;
  let pendingForcedRevealId: string | undefined;
  let interactionGuardsAttached = false;
  let lastObservedColumns = clampDashboardColumnCount(options.columns ?? grid.getColumn());

  let lastCommittedLayout: DashboardLayoutSnapshot | undefined;

  const commitLayout = () => {
    const snapshot = readDashboardLayoutSnapshot(grid, grid.getColumn());
    if (sameDashboardLayoutSnapshot(lastCommittedLayout, snapshot)) {
      return snapshot;
    }

    lastCommittedLayout = snapshot;
    snapshot.widgets.forEach((layout) => currentOptions.onWidgetLayoutChange?.(layout.id, layout));
    currentOptions.onLayoutCommit?.(snapshot);
    return snapshot;
  };

  const readInteractionEvent = (item: GridItemHTMLElement | undefined): DashboardWidgetInteractionEvent | undefined => {
    const node = item?.gridstackNode;
    const id = item?.getAttribute("gs-id") ?? item?.getAttribute("data-widget-id") ?? node?.id;
    if (!node || typeof id !== "string") {
      return undefined;
    }

    return {
      id,
      layout: {
        id,
        x: node.x ?? 0,
        y: node.y ?? 0,
        w: node.w ?? 1,
        h: node.h ?? 1,
        minW: node.minW,
        minH: node.minH,
        maxW: node.maxW,
        maxH: node.maxH,
      },
    };
  };

  const resizeHandler = (_event: Event, item: GridItemHTMLElement) => {
    const id = item.getAttribute("gs-id") ?? item.getAttribute("data-widget-id");
    if (!id) {
      return;
    }
    const rect = item.getBoundingClientRect();
    currentOptions.onWidgetResize?.(id, { width: rect.width, height: rect.height });
  };

  const sameMappedValue = (left: unknown, right: unknown) => JSON.stringify(left) === JSON.stringify(right);

  const resolveMobileResizeHandle = (value: boolean | "mobile" | undefined) => {
    if (typeof value === "boolean") {
      return value;
    }
    return window.matchMedia?.("(pointer: coarse)").matches ?? false;
  };

  const applyRuntimeEngineOptions = (
    previousOptions: DashboardGridAdapterOptions<TData>,
    nextOptions: DashboardGridAdapterOptions<TData>,
  ) => {
    const previous = mapDashboardGridOptions(previousOptions);
    const next = mapDashboardGridOptions(nextOptions);
    const update: GridStackOptions = {};

    if (previous.staticGrid !== next.staticGrid) {
      grid.setStatic(next.staticGrid ?? false);
    }

    if (!sameMappedValue(previous.columnOpts, next.columnOpts)) {
      update.columnOpts = (next.columnOpts ?? null) as GridStackOptions["columnOpts"];
    }
    if (previous.disableDrag !== next.disableDrag) {
      update.disableDrag = next.disableDrag;
    }
    if (previous.disableResize !== next.disableResize) {
      update.disableResize = next.disableResize;
    }
    if (previous.minRow !== next.minRow) {
      update.minRow = next.minRow ?? 0;
    }
    if (previous.maxRow !== next.maxRow) {
      update.maxRow = next.maxRow ?? 0;
    }
    if (Object.keys(update).length > 0) {
      grid.updateOptions(update);
    }

    if (previous.animate !== next.animate) {
      grid.setAnimation(next.animate ?? true);
    }
    if (previous.cellHeight !== next.cellHeight && next.cellHeight !== undefined) {
      grid.cellHeight(next.cellHeight);
    }
    if (previous.margin !== next.margin && next.margin !== undefined) {
      grid.margin(next.margin);
    }
    if (previous.float !== next.float) {
      grid.float(next.float ?? false);
    }
    const previousEngine = previousOptions.engineOptions ?? {};
    const nextEngine = nextOptions.engineOptions ?? {};
    const dragDropConfigurationChanged =
      previousEngine.dragHandle !== nextEngine.dragHandle
      || previousEngine.resizeHandles !== nextEngine.resizeHandles
      || previousEngine.alwaysShowResizeHandle !== nextEngine.alwaysShowResizeHandle;

    if (dragDropConfigurationChanged) {
      const draggable = typeof grid.opts.draggable === "object" ? grid.opts.draggable : {};
      const resizableOptions = typeof grid.opts.resizable === "object" ? grid.opts.resizable : {};
      grid.opts.draggable = { ...draggable, handle: nextEngine.dragHandle ?? ".grid-stack-item-content" };
      grid.opts.resizable = { ...resizableOptions, handles: nextEngine.resizeHandles ?? "se" };
      grid.opts.alwaysShowResizeHandle = resolveMobileResizeHandle(nextEngine.alwaysShowResizeHandle);
      grid.getGridItems().forEach((item) => grid.prepareDragDrop(item, true).refreshDragHandles(item));
    }

    if (!nextOptions.responsive && grid.getColumn() !== clampDashboardColumnCount(nextOptions.columns ?? 12)) {
      grid.column(clampDashboardColumnCount(nextOptions.columns ?? 12), "move");
    }
  };

  const scheduleColumnsChange = () => {
    cancelFrame(columnsFrame);
    columnsFrame = window.requestAnimationFrame(() => {
      columnsFrame = undefined;
      const columns = clampDashboardColumnCount(grid.getColumn());
      element.dataset.columns = String(columns);
      if (columns === lastObservedColumns) {
        return;
      }
      lastObservedColumns = columns;
      currentOptions.onColumnsChange?.(columns);
      commitLayout();
    });
  };

  const runSync = (
    previousOptions: DashboardGridAdapterOptions<TData>,
    nextOptions: DashboardGridAdapterOptions<TData>,
  ) => {
    applyRuntimeEngineOptions(previousOptions, nextOptions);
    syncGridWidgets(grid, element, registeredItems, nextOptions.widgets, nextOptions);
    scheduleColumnsChange();
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
      runSync(appliedOptions, currentOptions);
      appliedOptions = currentOptions;
      revealPendingForcedItem();
    });
  };

  const flushInteraction = () => {
    finishInteractionFrame = undefined;
    detachInteractionGuards();
    const stoppedKind = activeInteractionKind;
    const stoppedId = readInteractionEvent(activeInteractionItem)?.id;
    lastPointer = undefined;
    activeInteractionItem = undefined;
    activeInteractionKind = undefined;
    isInteracting = false;

    const shouldCommit = pendingCommit;
    const shouldSync = pendingSync;
    pendingCommit = false;
    pendingSync = false;

    const snapshot = shouldCommit ? commitLayout() : undefined;
    const stoppedLayout = snapshot?.widgets.find((layout) => layout.id === stoppedId);
    if (stoppedLayout) {
      const interactionEvent = { id: stoppedLayout.id, layout: stoppedLayout };
      if (stoppedKind === "drag") {
        currentOptions.onWidgetDragStop?.(interactionEvent);
      } else if (stoppedKind === "resize") {
        currentOptions.onWidgetResizeStop?.(interactionEvent);
      }
    }
    if (shouldSync) {
      scheduleDeferredSync();
    } else {
      revealPendingForcedItem();
    }
  };

  const startInteraction = (
    kind: "drag" | "resize",
    event?: Event,
    item?: GridItemHTMLElement,
  ) => {
    isInteracting = true;
    activeInteractionKind = kind;
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
    const interactionEvent = readInteractionEvent(activeInteractionItem);
    if (interactionEvent) {
      if (kind === "drag") {
        currentOptions.onWidgetDragStart?.(interactionEvent);
      } else {
        currentOptions.onWidgetResizeStart?.(interactionEvent);
      }
    }
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
    scheduleColumnsChange();
    if (isInteracting) {
      pendingCommit = true;
      return;
    }
    commitLayout();
  };

  grid.on("change", changeHandler);
  grid.on("dragstart", (event, item) => startInteraction("drag", event, item));
  grid.on("resizestart", (event, item) => startInteraction("resize", event, item));
  grid.on("dragstop", stopInteraction);
  grid.on("resizestop", stopInteraction);
  grid.on("resize", resizeHandler);

  const columnsObserver = typeof ResizeObserver === "undefined"
    ? undefined
    : new ResizeObserver((entries) => {
        grid.onResize(entries[0]?.contentRect.width);
        scheduleColumnsChange();
      });
  columnsObserver?.observe(element);

  const notifyWidgetSizes = () => {
    grid.getGridItems().forEach((item) => resizeHandler(new Event("resize"), item));
  };

  const adapter: DashboardGridAdapter<TData> = {
    grid,
    sync(nextOptions) {
      currentOptions = nextOptions;
      if (isInteracting) {
        pendingSync = true;
        return;
      }
      runSync(appliedOptions, nextOptions);
      appliedOptions = nextOptions;
    },
    refresh() {
      grid.onResize();
      grid.getGridItems().forEach((item) => grid.refreshDragHandles(item));
      cancelFrame(refreshFrame);
      refreshFrame = window.requestAnimationFrame(() => {
        refreshFrame = undefined;
        grid.onResize();
        if (currentOptions.engineOptions?.sizeToContent) {
          grid.getGridItems().forEach((item) => grid.resizeToContent(item));
        }
        notifyWidgetSizes();
        scheduleColumnsChange();
      });
    },
    compact(layout = "compact", doSort = true) {
      grid.compact(layout, doSort);
      return commitLayout();
    },
    commit: commitLayout,
    destroy() {
      detachInteractionGuards();
      columnsObserver?.disconnect();
      pendingForcedRevealItem = undefined;
      pendingForcedRevealId = undefined;
      cancelFrame(finishInteractionFrame);
      cancelFrame(deferredSyncFrame);
      cancelFrame(forceEndFrame);
      cancelFrame(refreshFrame);
      cancelFrame(columnsFrame);
      registeredItems.clear();
      grid.offAll();
      grid.destroy(false);
    },
  };

  adapter.sync(options);

  return adapter;
}

export function toGridStackWidget<TData>(
  widget: DashboardWidget<TData>,
  options: DashboardGridOptionInput,
): GridStackWidget {
  const widgetOptions = mapDashboardWidgetOptions(widget, options);

  return {
    ...widget.layout,
    id: widget.id,
    ...widgetOptions,
  };
}

export function readDashboardLayoutSnapshot(grid: GridStack, columns: number): DashboardLayoutSnapshot {
  const activeColumns = clampDashboardColumnCount(columns);
  const saved = grid.save(false, false, undefined, activeColumns) as GridStackWidget[];

  return {
    columns: activeColumns,
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

export function findWidgetElementById(element: HTMLElement, widgetId: string) {
  return element.querySelector<HTMLElement>(`[data-widget-id="${CSS.escape(widgetId)}"]`);
}

function syncGridWidgets<TData>(
  grid: GridStack,
  element: HTMLElement,
  registeredItems: Map<string, GridItemHTMLElement>,
  widgets: DashboardWidget<TData>[],
  options: DashboardGridOptionInput,
) {
  const nextIds = new Set(widgets.map((widget) => widget.id));
  registeredItems.forEach((item, id) => {
    if (!nextIds.has(id)) {
      grid.removeWidget(item, false, false);
      registeredItems.delete(id);
    }
  });

  widgets.forEach((widget) => {
    const item = findWidgetElementById(element, widget.id);
    if (!item) {
      return;
    }

    const gridItem = item as GridItemHTMLElement;
    const registeredItem = registeredItems.get(widget.id);
    if (registeredItem && registeredItem !== gridItem) {
      grid.removeWidget(registeredItem, false, false);
    }
    const gridWidget = toGridStackWidget(widget, options);
    if (gridItem.gridstackNode) {
      grid.update(gridItem, gridWidget);
    } else {
      grid.makeWidget(gridItem, gridWidget);
    }
    registeredItems.set(widget.id, gridItem);
    grid.movable(gridItem, !(gridWidget.noMove ?? false));
    grid.resizable(gridItem, !(gridWidget.noResize ?? false));
  });
}
