import type {
  DashboardDragInSourceController,
  DashboardDragInSourceOptions,
} from "../gridstack/drag-in";

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
