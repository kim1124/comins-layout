import { useCallback, useRef } from "react";
import type { RefCallback } from "react";
import { createDashboardDragInConnection } from "../browser/drag-in-connection";
import type { DashboardDragInConnection } from "../browser/drag-in-connection";
import type { UseDashboardDragInOptions } from "../browser/types";
export type { UseDashboardDragInOptions } from "../browser/types";

export function useDashboardDragIn<TData>(
  options: UseDashboardDragInOptions<TData>,
): RefCallback<HTMLElement> {
  const createWidgetRef = useRef(options.createWidget);
  createWidgetRef.current = options.createWidget;
  const connectionRef = useRef<DashboardDragInConnection | undefined>(undefined);
  connectionRef.current ??= createDashboardDragInConnection();

  const {
    sourceId,
    previewLayout,
    dragOptions,
    disabled = false,
  } = options;

  return useCallback((element) => {
    const connection = connectionRef.current;
    if (!connection) {
      return;
    }
    if (!element || disabled) {
      connection.disconnect();
      return;
    }
    connection.connect(element, {
      sourceId,
      previewLayout,
      createWidget: () => createWidgetRef.current(),
      dragOptions,
    });
  }, [
    disabled,
    dragOptions?.appendTo,
    dragOptions?.cancel,
    dragOptions?.handle,
    dragOptions?.pause,
    dragOptions?.scroll,
    previewLayout.h,
    previewLayout.maxH,
    previewLayout.maxW,
    previewLayout.minH,
    previewLayout.minW,
    previewLayout.w,
    sourceId,
  ]);
}
