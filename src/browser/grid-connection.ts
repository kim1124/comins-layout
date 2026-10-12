import type { DashboardGridAdapter, DashboardGridAdapterOptions } from "../gridstack/adapter";

export type DashboardGridAdapterLoader = () => Promise<{
  createDashboardGridAdapter: typeof import("../gridstack/adapter").createDashboardGridAdapter;
}>;

export type DashboardGridConnection<TData> = {
  connect(element: HTMLElement, options: DashboardGridAdapterOptions<TData>): void;
  sync(options: DashboardGridAdapterOptions<TData>): void;
  getAdapter(): DashboardGridAdapter<TData> | undefined;
  disconnect(): void;
};

export function createDashboardGridConnection<TData>(
  loadAdapter: DashboardGridAdapterLoader = () => import("../gridstack/adapter"),
): DashboardGridConnection<TData> {
  let generation = 0;
  let adapter: DashboardGridAdapter<TData> | undefined;
  let latestOptions: DashboardGridAdapterOptions<TData> | undefined;
  const disconnect = () => {
    generation += 1;
    const previous = adapter;
    adapter = undefined;
    latestOptions = undefined;
    previous?.destroy();
  };
  return {
    connect(element, options) {
      disconnect();
      latestOptions = options;
      const activeGeneration = generation;
      void (async () => {
        const { createDashboardGridAdapter } = await loadAdapter();
        if (generation !== activeGeneration || !element.isConnected || !latestOptions) return;
        adapter = createDashboardGridAdapter(element, latestOptions);
        if (!adapter) console.error("Failed to initialize comins-grid-layout adapter.");
      })().catch(() => {
        if (generation === activeGeneration) console.error("Failed to initialize comins-grid-layout adapter.");
      });
    },
    sync(options) {
      latestOptions = options;
      adapter?.sync(options);
    },
    getAdapter: () => adapter,
    disconnect,
  };
}
