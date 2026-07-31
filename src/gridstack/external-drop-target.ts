import { DashboardGridConfigurationError } from "../core/configuration";
import type { DashboardExternalDropTarget } from "../core/types";

export type DashboardClientPoint = {
  clientX: number;
  clientY: number;
};

type PointLike = {
  clientX?: unknown;
  clientY?: unknown;
};

type PointEventLike = PointLike & {
  changedTouches?: ArrayLike<PointLike>;
};

function toClientPoint(value: PointLike | undefined): DashboardClientPoint | undefined {
  if (
    typeof value?.clientX !== "number"
    || typeof value.clientY !== "number"
    || !Number.isFinite(value.clientX)
    || !Number.isFinite(value.clientY)
  ) {
    return undefined;
  }
  return { clientX: value.clientX, clientY: value.clientY };
}

export function readDashboardClientPoint(event: Event): DashboardClientPoint | undefined {
  const candidate = event as Event & PointEventLike;
  const touches = candidate.changedTouches;
  if (touches?.length) {
    return toClientPoint(touches[touches.length - 1]);
  }
  return toClientPoint(candidate);
}

export function validateDashboardExternalDropTargetSelectors(
  document: Document,
  targets: ReadonlyArray<DashboardExternalDropTarget> | undefined,
): void {
  try {
    for (const target of targets ?? []) {
      document.querySelectorAll(target.selector);
    }
  } catch {
    throw new DashboardGridConfigurationError();
  }
}

function isRenderedTarget(document: Document, element: HTMLElement): boolean {
  if (!element.isConnected || element.getClientRects().length === 0) {
    return false;
  }
  const style = document.defaultView?.getComputedStyle(element);
  return style?.display !== "none" && style?.visibility !== "hidden";
}

export function resolveDashboardExternalDropTarget(
  document: Document,
  gridElement: HTMLElement,
  targets: ReadonlyArray<DashboardExternalDropTarget> | undefined,
  point: DashboardClientPoint | undefined,
): DashboardExternalDropTarget | undefined {
  if (!point) {
    return undefined;
  }
  const hitElements = document.elementsFromPoint(point.clientX, point.clientY);
  for (const target of targets ?? []) {
    let matches: NodeListOf<HTMLElement>;
    try {
      matches = document.querySelectorAll<HTMLElement>(target.selector);
    } catch {
      throw new DashboardGridConfigurationError();
    }
    for (const element of matches) {
      if (
        gridElement.contains(element)
        || !isRenderedTarget(document, element)
      ) {
        continue;
      }
      if (hitElements.some((hit) => hit === element || element.contains(hit))) {
        return target;
      }
    }
  }
  return undefined;
}
