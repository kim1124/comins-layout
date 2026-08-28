import type {
  DashboardDragInPreviewLayout,
  DashboardWidget,
  DashboardWidgetDropCandidate,
  DashboardWidgetTransferMode,
} from "../core/types";

export type DashboardPaletteDragSourceOptions<TData> = {
  sourceId: string;
  previewLayout: DashboardDragInPreviewLayout;
  createWidget: () => DashboardWidget<TData>;
};

export type DashboardPaletteDragCandidate<TData = unknown> = {
  sourceId: string;
  sourceElement: HTMLElement;
  helperElement: HTMLElement;
  widget: DashboardWidget<TData>;
};

export type DashboardPaletteDragRegistration<TData> = {
  attachHelper: (helperElement: HTMLElement) => void;
  beginDrag: () => DashboardPaletteDragCandidate<TData> | undefined;
  scheduleEndDrag: () => void;
  dispose: () => void;
};

export type DashboardGridDragSourceOptions<TData> = {
  gridId: string;
  widget: DashboardWidget<TData>;
  mode: DashboardWidgetTransferMode;
  restoreSource: (element: HTMLElement) => void;
};

export type DashboardResolvedDropSource<TData = unknown> = {
  candidate: DashboardWidgetDropCandidate<TData>;
  sourceElement: HTMLElement;
  restoreSource?: (element: HTMLElement) => void;
};

type DashboardPaletteDragEntry<TData = unknown> = {
  sourceId: string;
  sourceElement: HTMLElement;
  helperElement?: HTMLElement;
  createWidget: () => DashboardWidget<TData>;
  candidate?: DashboardPaletteDragCandidate<TData>;
  generation: number;
  disposed: boolean;
};

const paletteDragEntries = new WeakMap<Element, DashboardPaletteDragEntry>();
const gridDragEntries = new WeakMap<Element, DashboardGridDragSourceOptions<unknown>>();

export function registerDashboardPaletteDragSource<TData>(
  sourceElement: HTMLElement,
  options: DashboardPaletteDragSourceOptions<TData>,
): DashboardPaletteDragRegistration<TData> | undefined {
  const sourceId = options.sourceId.trim();
  if (!sourceId || !isValidPreviewLayout(options.previewLayout)) {
    return undefined;
  }

  const entry: DashboardPaletteDragEntry<TData> = {
    sourceId,
    sourceElement,
    createWidget: options.createWidget,
    generation: 0,
    disposed: false,
  };
  paletteDragEntries.set(sourceElement, entry as DashboardPaletteDragEntry);

  const clearHelper = () => {
    if (entry.helperElement && paletteDragEntries.get(entry.helperElement) === entry) {
      paletteDragEntries.delete(entry.helperElement);
    }
    entry.helperElement = undefined;
  };

  return {
    attachHelper(helperElement) {
      if (entry.disposed) {
        return;
      }
      clearHelper();
      entry.candidate = undefined;
      entry.helperElement = helperElement;
      paletteDragEntries.set(helperElement, entry as DashboardPaletteDragEntry);
    },
    beginDrag() {
      entry.generation += 1;
      entry.candidate = undefined;
      const helperElement = entry.helperElement;
      if (entry.disposed || !helperElement) {
        return undefined;
      }

      let widget: DashboardWidget<TData>;
      try {
        widget = entry.createWidget();
        if (!isValidDashboardWidget(widget)) {
          return undefined;
        }
      } catch {
        return undefined;
      }

      const candidate: DashboardPaletteDragCandidate<TData> = {
        sourceId: entry.sourceId,
        sourceElement: entry.sourceElement,
        helperElement,
        widget,
      };
      entry.candidate = candidate;
      return candidate;
    },
    scheduleEndDrag() {
      const generation = entry.generation;
      queueMicrotask(() => {
        if (!entry.disposed && entry.generation === generation) {
          entry.candidate = undefined;
          clearHelper();
        }
      });
    },
    dispose() {
      if (entry.disposed) {
        return;
      }
      entry.disposed = true;
      entry.generation += 1;
      entry.candidate = undefined;
      clearHelper();
      if (paletteDragEntries.get(sourceElement) === entry) {
        paletteDragEntries.delete(sourceElement);
      }
    },
  };
}

export function resolveDashboardPaletteDragCandidate(
  element: Element | null | undefined,
): DashboardPaletteDragCandidate | undefined {
  if (!element) {
    return undefined;
  }
  return paletteDragEntries.get(element)?.candidate;
}

export function registerDashboardGridDragSource<TData>(
  element: HTMLElement,
  options: DashboardGridDragSourceOptions<TData>,
): () => void {
  const gridId = options.gridId.trim();
  if (!gridId || !isValidDashboardWidget(options.widget)) {
    return () => undefined;
  }
  const entry: DashboardGridDragSourceOptions<TData> = {
    ...options,
    gridId,
  };
  gridDragEntries.set(element, entry as DashboardGridDragSourceOptions<unknown>);

  let disposed = false;
  return () => {
    if (disposed) {
      return;
    }
    disposed = true;
    if (gridDragEntries.get(element) === entry) {
      gridDragEntries.delete(element);
    }
  };
}

export function resolveDashboardDropSource<TData>(
  element: Element | null | undefined,
  targetGridId: string,
): DashboardResolvedDropSource<TData> | undefined {
  if (!element) {
    return undefined;
  }
  const normalizedTargetGridId = targetGridId.trim();
  if (!normalizedTargetGridId) {
    return undefined;
  }

  const paletteCandidate = paletteDragEntries.get(element)?.candidate;
  if (paletteCandidate) {
    return {
      candidate: {
        source: { kind: "palette", sourceId: paletteCandidate.sourceId },
        targetGridId: normalizedTargetGridId,
        widget: paletteCandidate.widget as DashboardWidget<TData>,
        mode: "copy",
      },
      sourceElement: paletteCandidate.sourceElement,
    };
  }

  const gridSource = gridDragEntries.get(element);
  if (
    !gridSource
    || gridSource.gridId === normalizedTargetGridId
    || !isTransferableDashboardWidget(gridSource.widget)
  ) {
    return undefined;
  }

  return {
    candidate: {
      source: {
        kind: "grid",
        gridId: gridSource.gridId,
        widgetId: gridSource.widget.id,
      },
      targetGridId: normalizedTargetGridId,
      widget: gridSource.widget as DashboardWidget<TData>,
      mode: gridSource.mode,
    },
    sourceElement: element as HTMLElement,
    restoreSource: gridSource.restoreSource,
  };
}

function isValidPreviewLayout(layout: DashboardDragInPreviewLayout): boolean {
  return isValidGeometry({ x: 0, y: 0, ...layout });
}

function isValidDashboardWidget(value: unknown): value is DashboardWidget {
  if (!value || typeof value !== "object") {
    return false;
  }
  const widget = value as Partial<DashboardWidget>;
  return typeof widget.id === "string"
    && widget.id.trim().length > 0
    && Boolean(widget.layout)
    && widget.layout?.id === widget.id
    && isValidGeometry(widget.layout);
}

function isTransferableDashboardWidget(widget: DashboardWidget): boolean {
  return !widget.locked
    && widget.movable !== false
    && !widget.minimized
    && !widget.maximized;
}

function isValidGeometry(layout: Omit<DashboardDragInPreviewLayout, never> & { x: number; y: number }): boolean {
  const dimensions = [layout.x, layout.y, layout.w, layout.h];
  if (
    dimensions.some((value) => !Number.isFinite(value) || !Number.isInteger(value))
    || layout.x < 0
    || layout.y < 0
    || layout.w < 1
    || layout.w > 12
    || layout.h < 1
    || layout.x + layout.w > 12
  ) {
    return false;
  }

  const limits = [layout.minW, layout.minH, layout.maxW, layout.maxH];
  if (limits.some((value) => value !== undefined && (
    !Number.isFinite(value)
    || !Number.isInteger(value)
    || value < 1
  ))) {
    return false;
  }

  return !(
    (layout.minW !== undefined && layout.minW > 12)
    || (layout.maxW !== undefined && layout.maxW > 12)
    || (layout.minW !== undefined && layout.maxW !== undefined && layout.minW > layout.maxW)
    || (layout.minH !== undefined && layout.maxH !== undefined && layout.minH > layout.maxH)
    || (layout.minW !== undefined && layout.w < layout.minW)
    || (layout.maxW !== undefined && layout.w > layout.maxW)
    || (layout.minH !== undefined && layout.h < layout.minH)
    || (layout.maxH !== undefined && layout.h > layout.maxH)
  );
}
