import { effectScope, nextTick, reactive, shallowRef } from "vue";
import { describe, expect, it, vi } from "vitest";
import { useDashboardDragIn } from "../../src/vue/use-dashboard-drag-in";

const mock = vi.hoisted(() => ({ setup: vi.fn(), destroy: vi.fn() }));
vi.mock("../../src/gridstack/drag-in", () => ({ setupDashboardDragInSource: mock.setup }));

describe("Vue drag-in scope binding", () => {
  it("reconnects from nested reactive configuration while preserving previous snapshots", async () => {
    mock.setup.mockReset().mockReturnValue({ destroy: mock.destroy });
    mock.destroy.mockReset();
    const scope = effectScope();
    const options = reactive({ sourceId: "source", previewLayout: { w: 2, h: 2 }, dragOptions: { scroll: true },
      createWidget: () => ({ id: "a", layout: { id: "a", x: 0, y: 0, w: 2, h: 2 } }),
    });
    const element = scope.run(() => useDashboardDragIn(options))!;
    try {
      element.value = { isConnected: true } as HTMLElement;
      await nextTick();
      await vi.waitFor(() => expect(mock.setup).toHaveBeenCalledTimes(1));
      const initial = mock.setup.mock.calls[0]![1];
      options.previewLayout.w = 4;
      options.dragOptions.scroll = false;
      await nextTick();
      await vi.waitFor(() => expect(mock.setup).toHaveBeenCalledTimes(2));
      expect(mock.destroy).toHaveBeenCalledTimes(1);
      expect(initial.previewLayout.w).toBe(2);
      expect(initial.dragOptions.scroll).toBe(true);
      expect(mock.setup.mock.calls[1]![1]).toMatchObject({ previewLayout: { w: 4 }, dragOptions: { scroll: false } });
    } finally { scope.stop(); }
  });

  it("cleans up native scopes without component-hook warnings and reads the latest factory", async () => {
    mock.setup.mockReset().mockReturnValue({ destroy: mock.destroy });
    mock.destroy.mockReset();
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const scope = effectScope();
    const first = vi.fn(() => ({ id: "first", layout: { id: "first", x: 0, y: 0, w: 1, h: 1 } }));
    const latest = vi.fn(() => ({ id: "latest", layout: { id: "latest", x: 0, y: 0, w: 1, h: 1 } }));
    const options = shallowRef({ sourceId: "source", previewLayout: { w: 1, h: 1 }, createWidget: first });
    const element = scope.run(() => useDashboardDragIn(options))!;
    try {
      element.value = { isConnected: true } as HTMLElement;
      await nextTick();
      await vi.waitFor(() => expect(mock.setup).toHaveBeenCalledTimes(1));
      const sourceOptions = mock.setup.mock.calls[0]![1];
      options.value = { ...options.value, createWidget: latest };
      expect(sourceOptions.createWidget().id).toBe("latest");
      expect(first).not.toHaveBeenCalled();
      expect(latest).toHaveBeenCalledTimes(1);
      expect(warn).not.toHaveBeenCalled();
      scope.stop();
      await nextTick();
      expect(mock.destroy).toHaveBeenCalledTimes(1);
    } finally { scope.stop(); warn.mockRestore(); }
  });
});
