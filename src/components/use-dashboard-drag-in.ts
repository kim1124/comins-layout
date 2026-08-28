import { useCallback, useRef } from "react";
import type { RefCallback } from "react";
import type {
  DashboardDragInPreviewLayout,
  DashboardDragOptions,
  DashboardWidget,
} from "../core/types";
import type {
  DashboardDragInSourceController,
  DashboardDragInSourceOptions,
} from "../gridstack/drag-in";

export type UseDashboardDragInOptions<TData> = {
  sourceId: string;
  previewLayout: DashboardDragInPreviewLayout;
  createWidget: () => DashboardWidget<TData>;
  dragOptions?: DashboardDragOptions;
  disabled?: boolean;
};

type DashboardDragInAdapterModule = {
  setupDashboardDragInSource: <TData>(
    element: HTMLElement,
    options: DashboardDragInSourceOptions<TData>,
  ) => DashboardDragInSourceController | undefined;
};

type DashboardDragInAdapterLoader = () => Promise<DashboardDragInAdapterModule>;

export type DashboardDragInConnection = {
  connect: <TData>(element: HTMLElement, options: DashboardDragInSourceOptions<TData>) => void;
  disconnect: () => void;
};

const loadDashboardDragInAdapter: DashboardDragInAdapterLoader = () => import("../gridstack/drag-in");

export function createDashboardDragInConnection(
  loadAdapter: DashboardDragInAdapterLoader = loadDashboardDragInAdapter,
): DashboardDragInConnection {
  let generation = 0;
  let controller: DashboardDragInSourceController | undefined;

  const disconnect = () => {
    generation += 1;
    controller?.destroy();
    controller = undefined;
  };

  return {
    connect(element, options) {
      disconnect();
      const activeGeneration = generation;
      void loadAdapter()
        .then(({ setupDashboardDragInSource }) => {
          if (generation !== activeGeneration || !element.isConnected) {
            return;
          }
          controller = setupDashboardDragInSource(element, options);
        })
        .catch(() => {
          if (generation === activeGeneration) {
            console.error("Failed to initialize comins-grid-layout drag-in source.");
          }
        });
    },
    disconnect,
  };
}

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
