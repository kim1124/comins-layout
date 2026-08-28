import { GridStack } from "gridstack";
import type { DDDragOpt, GridItemHTMLElement, GridStackWidget } from "gridstack";
import type {
  DashboardDragInPreviewLayout,
  DashboardDragOptions,
  DashboardWidget,
} from "../core/types";
import {
  registerDashboardPaletteDragSource,
} from "./transfer-registry";

export type DashboardDragInSourceOptions<TData> = {
  sourceId: string;
  previewLayout: DashboardDragInPreviewLayout;
  createWidget: () => DashboardWidget<TData>;
  dragOptions?: DashboardDragOptions;
};

export type DashboardDragInSourceController = {
  destroy: () => void;
};

const activeSources = new WeakMap<HTMLElement, DashboardDragInSourceController>();

export function setupDashboardDragInSource<TData>(
  element: HTMLElement,
  options: DashboardDragInSourceOptions<TData>,
): DashboardDragInSourceController | undefined {
  const previousController = activeSources.get(element);
  if (previousController) {
    previousController.destroy();
  } else {
    destroyDashboardDraggable(element);
  }

  const registration = registerDashboardPaletteDragSource(element, options);
  if (!registration) {
    return undefined;
  }

  const previewWidget: GridStackWidget = { ...options.previewLayout };
  const dragInOptions: DDDragOpt = {
    handle: options.dragOptions?.handle,
    appendTo: options.dragOptions?.appendTo ?? "body",
    pause: options.dragOptions?.pause,
    scroll: options.dragOptions?.scroll,
    cancel: options.dragOptions?.cancel,
    helper: (sourceElement) => {
      const helperElement = sourceElement.cloneNode(true) as GridItemHTMLElement;
      helperElement.removeAttribute("id");
      helperElement.gridstackNode = {
        ...(sourceElement as GridItemHTMLElement).gridstackNode,
      };
      registration.attachHelper(helperElement);
      return helperElement;
    },
    start: () => {
      const candidate = registration.beginDrag();
      if (!candidate) {
        return;
      }
      const helperElement = candidate.helperElement as GridItemHTMLElement;
      helperElement.gridstackNode = {
        ...helperElement.gridstackNode,
        id: candidate.widget.id,
      };
    },
    stop: () => {
      registration.scheduleEndDrag();
    },
  };

  try {
    GridStack.setupDragIn(
      [element as GridItemHTMLElement],
      dragInOptions,
      [previewWidget],
      element.ownerDocument,
    );
  } catch {
    registration.dispose();
    destroyDashboardDraggable(element);
    return undefined;
  }

  let destroyed = false;
  const controller: DashboardDragInSourceController = {
    destroy() {
      if (destroyed) {
        return;
      }
      destroyed = true;
      registration.dispose();
      if (activeSources.get(element) === controller) {
        activeSources.delete(element);
      }
      destroyDashboardDraggable(element);
      clearPreviewNode(element, previewWidget);
    },
  };
  activeSources.set(element, controller);
  return controller;
}

function destroyDashboardDraggable(element: HTMLElement): void {
  try {
    GridStack.getDD().draggable(element as GridItemHTMLElement, "destroy");
  } catch {
    // Cleanup remains idempotent when GridStack only partially initialized the source.
  }
}

function clearPreviewNode(element: HTMLElement, previewWidget: GridStackWidget): void {
  const gridElement = element as GridItemHTMLElement;
  if (gridElement.gridstackNode === previewWidget) {
    delete gridElement.gridstackNode;
  }
}
