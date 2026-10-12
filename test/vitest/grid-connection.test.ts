import { describe, expect, it, vi } from "vitest";
import { createDashboardGridConnection, type DashboardGridAdapterLoader } from "../../src/browser/grid-connection";
import type { DashboardGridAdapter, DashboardGridAdapterOptions } from "../../src/gridstack/adapter";

const options: DashboardGridAdapterOptions = { columns: 12, widgets: [] };
const element = () => ({ isConnected: true }) as HTMLElement;
const adapter = () => ({ sync: vi.fn(), destroy: vi.fn() }) as unknown as DashboardGridAdapter;

describe("framework-neutral grid connection", () => {
  it("discards old loads and initializes the latest element with pending options", async () => {
    const pending: Array<(value: Awaited<ReturnType<DashboardGridAdapterLoader>>) => void> = [];
    const instance = adapter();
    const create = vi.fn();
    const module = { createDashboardGridAdapter: <T,>(el: HTMLElement, opts: DashboardGridAdapterOptions<T>) => {
      create(el, opts);
      return instance as DashboardGridAdapter<T>;
    } };
    const connection = createDashboardGridConnection(() => new Promise(resolve => pending.push(resolve)));
    const first = element(), second = element();
    connection.connect(first, options);
    connection.disconnect();
    connection.connect(second, options);
    const latest = { ...options, columns: 6 as const };
    connection.sync(latest);
    pending[1]!(module);
    pending[0]!(module);
    await Promise.resolve();
    expect(create).toHaveBeenCalledTimes(1);
    expect(create).toHaveBeenCalledWith(second, latest);
    expect(connection.getAdapter()).toBe(instance);
    connection.sync(options);
    expect(instance.sync).toHaveBeenCalledWith(options);
    connection.disconnect();
    connection.disconnect();
    expect(instance.destroy).toHaveBeenCalledTimes(1);
    expect(connection.getAdapter()).toBeUndefined();
  });

  it("does not initialize detached DOM or report cancelled failures", async () => {
    const create = vi.fn();
    const connection = createDashboardGridConnection(async () => ({ createDashboardGridAdapter: <T,>() => {
      create();
      return adapter() as DashboardGridAdapter<T>;
    } }));
    connection.connect({ isConnected: false } as HTMLElement, options);
    await Promise.resolve();
    expect(create).not.toHaveBeenCalled();
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const failing = createDashboardGridConnection(async () => { throw new Error("private"); });
    failing.connect(element(), options);
    failing.disconnect();
    await Promise.resolve();
    await Promise.resolve();
    expect(error).not.toHaveBeenCalled();
    failing.connect(element(), options);
    await Promise.resolve();
    await Promise.resolve();
    expect(error).toHaveBeenCalledWith("Failed to initialize comins-grid-layout adapter.");
    error.mockRestore();
  });
});
