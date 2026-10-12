import { createRenderer, effectScope, h, isProxy, nextTick, shallowRef } from "vue";
import { describe, expect, it, vi } from "vitest";
import { useDashboardGrid } from "../../src/vue/use-dashboard-grid";
import type { DashboardLayoutMutationEvent, DashboardWidget } from "../../src/core";
import { createDashboardGridInternalState, dashboardGridInternalReducer } from "../../src/core/transitions";

const widget = (id: string): DashboardWidget<{ value: number }> => ({ id, layout: { id, x: 0, y: 0, w: 2, h: 2 }, data: { value: 1 } });
describe("Vue dashboard state", () => {
  it("rejects use outside an active scope", () => {
    expect(() => useDashboardGrid()).toThrow("active effect scope");
  });

  it("preserves synchronous commands, ordered events and shallow data", async () => {
    const scope = effectScope();
    const events: DashboardLayoutMutationEvent<{ value: number }>[] = [];
    const grid = scope.run(() => useDashboardGrid<{ value: number }>({ onLayoutMutation: event => events.push(event) }))!;
    const commands = grid.commands;
    const a = widget("a"), b = widget("b");
    commands.addWidget(a); commands.addWidget(b); commands.updateWidget("a", { title: "updated" });
    expect(events).toEqual([]);
    expect(grid.widgets.value.map(item => item.id)).toEqual(["a", "b"]);
    expect(grid.widgets.value[0]?.data).toBe(a.data);
    expect(isProxy(grid.widgets.value[0]?.data)).toBe(false);
    await nextTick();
    expect(grid.commands).toBe(commands);
    expect(events.map(event => event.kind)).toEqual(["widget:add", "widget:add", "widget:update"]);
    let expected = createDashboardGridInternalState<{ value: number }>({ columns: 12, widgets: [] });
    expected = dashboardGridInternalReducer(expected, { type: "transition", action: { type: "add", widget: a }, mutation: { kind: "widget:add", widgetIds: ["a"] } });
    expected = dashboardGridInternalReducer(expected, { type: "transition", action: { type: "add", widget: b }, mutation: { kind: "widget:add", widgetIds: ["b"] } });
    expected = dashboardGridInternalReducer(expected, { type: "transition", action: { type: "update", id: "a", patch: { title: "updated" } }, mutation: { kind: "widget:update", widgetIds: ["a"] } });
    expect(grid.state.value).toEqual(expected.dashboard);
    expect(events).toEqual(expected.mutations.map(item => item.event));
    commands.maximizeWidget("missing"); commands.refreshLayout();
    await nextTick();
    expect(events).toHaveLength(3);
    scope.stop();
  });

  it("uses initial options once but the latest callback, and restores snapshots", async () => {
    const first = vi.fn(), latest = vi.fn(), scope = effectScope();
    const options = shallowRef({ initialColumns: 6, initialWidgets: [widget("a")], onLayoutMutation: first });
    const grid = scope.run(() => useDashboardGrid(options))!;
    options.value = { initialColumns: 3, initialWidgets: [widget("b")], onLayoutMutation: latest };
    grid.commands.setColumns(12);
    grid.commands.resetLayout();
    await nextTick();
    expect(grid.columns.value).toBe(6);
    expect(grid.widgets.value[0]?.id).toBe("a");
    expect(first).not.toHaveBeenCalled();
    expect(latest).toHaveBeenCalledTimes(2);
    grid.commands.restoreLayout({ columns: 4, widgets: [widget("restored")] });
    expect(grid.columns.value).toBe(4);
    expect(grid.widgets.value[0]?.id).toBe("restored");
    scope.stop();
    await nextTick();
    expect(latest).toHaveBeenCalledTimes(2);
  });

  it("queues reentrant commands after the fixed delivery batch", async () => {
    const scope = effectScope(), ids: string[] = [];
    const grid = scope.run(() => useDashboardGrid<{ value: number }>({ onLayoutMutation(event) {
      ids.push(event.widgetIds[0]!);
      if (event.widgetIds[0] === "a") grid.commands.addWidget(widget("c"));
    } }))!;
    grid.commands.addWidget(widget("a")); grid.commands.addWidget(widget("b"));
    await nextTick();
    expect(ids).toEqual(["a", "b", "c"]);
    scope.stop();
    grid.commands.addWidget(widget("stopped"));
    await nextTick();
    expect(ids).toEqual(["a", "b", "c"]);
  });

  it("acknowledges a throwing callback through Vue's watcher error path", async () => {
    const callback = vi.fn<() => void>(() => { throw new Error("consumer failure"); });
    const errorHandler = vi.fn();
    // A tiny native Vue host exercises app.errorHandler without adding a DOM emulator.
    const renderer = createRenderer<object, object>({
      patchProp() {}, insert() {}, remove() {}, createElement: () => ({}),
      createText: () => ({}), createComment: () => ({}), setText() {}, setElementText() {},
      parentNode: () => null, nextSibling: () => null,
    });
    let grid!: ReturnType<typeof useDashboardGrid>;
    const app = renderer.createApp({ setup() {
      grid = useDashboardGrid({ onLayoutMutation: callback });
      return () => h("div");
    } });
    app.config.errorHandler = errorHandler;
    app.mount({});
    try {
      grid.commands.addWidget(widget("a"));
      await nextTick();
      expect(errorHandler).toHaveBeenCalledTimes(1);
      expect(errorHandler.mock.calls[0]?.[0]).toEqual(new Error("consumer failure"));
      callback.mockImplementation(() => {});
      grid.commands.addWidget(widget("b"));
      await nextTick();
      expect(callback).toHaveBeenCalledTimes(2);
    } finally { app.unmount(); }
  });
});
