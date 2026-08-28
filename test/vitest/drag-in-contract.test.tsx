import { renderToStaticMarkup } from "react-dom/server";
import type {
  DDDragOpt,
  GridItemHTMLElement,
  GridStackWidget,
} from "gridstack";
import { describe, expect, it, vi } from "vitest";
import {
  useDashboardDragIn,
  type DashboardWidget,
} from "../../src";
import { createDashboardDragInConnection } from "../../src/components/use-dashboard-drag-in";
import {
  registerDashboardGridDragSource,
  resolveDashboardDropSource,
  resolveDashboardPaletteDragCandidate,
} from "../../src/gridstack/transfer-registry";

const gridstackMocks = vi.hoisted(() => ({
  evaluated: 0,
  draggable: vi.fn(),
  setupDragIn: vi.fn(),
}));

vi.mock("gridstack", () => {
  gridstackMocks.evaluated += 1;
  return {
    GridStack: {
      getDD: () => ({ draggable: gridstackMocks.draggable }),
      setupDragIn: gridstackMocks.setupDragIn,
    },
  };
});

type TestGridElement = GridItemHTMLElement & {
  clone?: TestGridElement;
  removedAttributes: string[];
};

function createTestElement(ownerDocument = {} as Document): TestGridElement {
  const element = {
    isConnected: true,
    ownerDocument,
    removedAttributes: [],
    removeAttribute(this: TestGridElement, name: string) {
      this.removedAttributes.push(name);
    },
    cloneNode(this: TestGridElement) {
      const clone = createTestElement(ownerDocument);
      this.clone = clone;
      return clone;
    },
  } as unknown as TestGridElement;
  return element;
}

function createWidget(id: string): DashboardWidget<{ metric: number }> {
  return {
    id,
    title: "Metric",
    layout: { id, x: 0, y: 0, w: 2, h: 2 },
    data: { metric: 42 },
  };
}

function setupGridStackMock() {
  gridstackMocks.draggable.mockReset();
  gridstackMocks.setupDragIn.mockReset();
  gridstackMocks.setupDragIn.mockImplementation((
    elements: GridItemHTMLElement[],
    _options: DDDragOpt,
    widgets?: GridStackWidget[],
  ) => {
    elements.forEach((element, index) => {
      element.gridstackNode = widgets?.[index];
    });
  });
}

function readLatestDragOptions(): DDDragOpt {
  const call = gridstackMocks.setupDragIn.mock.calls.at(-1);
  if (!call) {
    throw new Error("missing setupDragIn call");
  }
  return call[1] as DDDragOpt;
}

function createDragHelper(options: DDDragOpt, source: HTMLElement): TestGridElement {
  if (typeof options.helper !== "function") {
    throw new Error("missing package-owned helper");
  }
  return options.helper(source) as TestGridElement;
}

describe("useDashboardDragIn SSR contract", () => {
  it("renders without evaluating the GridStack adapter", () => {
    function PaletteItem() {
      const dragRef = useDashboardDragIn({
        sourceId: "metric-source",
        previewLayout: { w: 2, h: 2 },
        createWidget: () => createWidget("metric-1"),
      });
      return <button ref={dragRef}>Metric</button>;
    }

    expect(renderToStaticMarkup(<PaletteItem />)).toContain("Metric");
    expect(gridstackMocks.evaluated).toBe(0);
    expect(gridstackMocks.setupDragIn).not.toHaveBeenCalled();
  });
});

describe("palette drag-in adapter", () => {
  it("owns helper/start/stop and creates one candidate for each drag", async () => {
    setupGridStackMock();
    const source = createTestElement();
    const factory = vi.fn(() => createWidget("metric-1"));
    const consumerStart = vi.fn();
    const { setupDashboardDragInSource } = await import("../../src/gridstack/drag-in");

    const controller = setupDashboardDragInSource(source, {
      sourceId: "metric-source",
      previewLayout: { w: 2, h: 2, minW: 1, maxW: 4 },
      createWidget: factory,
      dragOptions: {
        appendTo: "#drag-layer",
        cancel: "button",
        handle: ".palette-handle",
        pause: 80,
        scroll: false,
        start: consumerStart,
      } as never,
    });

    expect(controller).toBeDefined();
    expect(gridstackMocks.setupDragIn).toHaveBeenCalledWith(
      [source],
      expect.any(Object),
      [{ w: 2, h: 2, minW: 1, maxW: 4 }],
      source.ownerDocument,
    );
    const dragOptions = readLatestDragOptions();
    expect(dragOptions).toMatchObject({
      appendTo: "#drag-layer",
      cancel: "button",
      handle: ".palette-handle",
      pause: 80,
      scroll: false,
    });
    expect(dragOptions.start).not.toBe(consumerStart);
    expect(dragOptions.drag).toBeUndefined();
    expect(resolveDashboardPaletteDragCandidate(source)).toBeUndefined();

    const helper = createDragHelper(dragOptions, source);
    expect(helper).toBe(source.clone);
    expect(helper.removedAttributes).toEqual(["id"]);
    dragOptions.start?.(new Event("dragstart"), {});

    expect(factory).toHaveBeenCalledTimes(1);
    expect(resolveDashboardPaletteDragCandidate(source)).toMatchObject({
      sourceId: "metric-source",
      sourceElement: source,
      helperElement: helper,
      widget: createWidget("metric-1"),
    });
    expect(resolveDashboardPaletteDragCandidate(helper)?.widget.data).toEqual({ metric: 42 });
    expect(helper.gridstackNode?.id).toBe("metric-1");

    dragOptions.stop?.(new Event("dragstop"));
    expect(resolveDashboardPaletteDragCandidate(helper)).toBeDefined();
    await Promise.resolve();
    expect(resolveDashboardPaletteDragCandidate(source)).toBeUndefined();
    expect(resolveDashboardPaletteDragCandidate(helper)).toBeUndefined();
  });

  it.each([
    ["factory exception", () => { throw new Error("private factory failure"); }],
    ["empty id", () => createWidget(" ")],
    ["layout id mismatch", () => ({ ...createWidget("metric-2"), layout: { ...createWidget("metric-2").layout, id: "other" } })],
    ["non-finite geometry", () => ({ ...createWidget("metric-3"), layout: { ...createWidget("metric-3").layout, x: Number.NaN } })],
    ["out-of-range geometry", () => ({ ...createWidget("metric-4"), layout: { ...createWidget("metric-4").layout, w: 13 } })],
  ])("fails closed for %s", async (_name, factory) => {
    setupGridStackMock();
    const source = createTestElement();
    const { setupDashboardDragInSource } = await import("../../src/gridstack/drag-in");
    setupDashboardDragInSource(source, {
      sourceId: "metric-source",
      previewLayout: { w: 2, h: 2 },
      createWidget: factory as () => DashboardWidget,
    });
    const dragOptions = readLatestDragOptions();
    const helper = createDragHelper(dragOptions, source);

    expect(() => dragOptions.start?.(new Event("dragstart"), {})).not.toThrow();
    expect(resolveDashboardPaletteDragCandidate(source)).toBeUndefined();
    expect(resolveDashboardPaletteDragCandidate(helper)).toBeUndefined();
  });

  it("rejects invalid source configuration before GridStack setup", async () => {
    setupGridStackMock();
    const source = createTestElement();
    const { setupDashboardDragInSource } = await import("../../src/gridstack/drag-in");

    expect(setupDashboardDragInSource(source, {
      sourceId: " ",
      previewLayout: { w: 2, h: 2 },
      createWidget: () => createWidget("metric-1"),
    })).toBeUndefined();
    expect(setupDashboardDragInSource(source, {
      sourceId: "metric-source",
      previewLayout: { w: 0, h: 2 },
      createWidget: () => createWidget("metric-1"),
    })).toBeUndefined();
    expect(gridstackMocks.setupDragIn).not.toHaveBeenCalled();
  });

  it("destroys previous setup on same element and keeps cleanup idempotent", async () => {
    setupGridStackMock();
    const source = createTestElement();
    const { setupDashboardDragInSource } = await import("../../src/gridstack/drag-in");
    const first = setupDashboardDragInSource(source, {
      sourceId: "first",
      previewLayout: { w: 1, h: 1 },
      createWidget: () => createWidget("first-1"),
    });
    const second = setupDashboardDragInSource(source, {
      sourceId: "second",
      previewLayout: { w: 2, h: 2 },
      createWidget: () => createWidget("second-1"),
    });

    expect(gridstackMocks.setupDragIn).toHaveBeenCalledTimes(2);
    expect(gridstackMocks.draggable).toHaveBeenCalledTimes(2);
    expect(gridstackMocks.draggable).toHaveBeenLastCalledWith(source, "destroy");

    first?.destroy();
    second?.destroy();
    second?.destroy();
    expect(gridstackMocks.draggable).toHaveBeenCalledTimes(3);
    expect(source.gridstackNode).toBeUndefined();
  });

  it("does not let delayed stop cleanup erase a newer drag candidate", async () => {
    setupGridStackMock();
    const source = createTestElement();
    const factory = vi.fn()
      .mockReturnValueOnce(createWidget("metric-1"))
      .mockReturnValueOnce(createWidget("metric-2"));
    const { setupDashboardDragInSource } = await import("../../src/gridstack/drag-in");
    setupDashboardDragInSource(source, {
      sourceId: "metric-source",
      previewLayout: { w: 2, h: 2 },
      createWidget: factory,
    });
    const dragOptions = readLatestDragOptions();
    createDragHelper(dragOptions, source);
    dragOptions.start?.(new Event("dragstart"), {});
    dragOptions.stop?.(new Event("dragstop"));

    const secondHelper = createDragHelper(dragOptions, source);
    dragOptions.start?.(new Event("dragstart"), {});
    await Promise.resolve();

    expect(factory).toHaveBeenCalledTimes(2);
    expect(resolveDashboardPaletteDragCandidate(secondHelper)?.widget.id).toBe("metric-2");
  });
});

describe("drag-in ref lifecycle", () => {
  it("ignores a setup that resolves after unmount", async () => {
    const setup = vi.fn();
    let resolveAdapter: ((module: { setupDashboardDragInSource: typeof setup }) => void) | undefined;
    const connection = createDashboardDragInConnection(() => new Promise((resolve) => {
      resolveAdapter = resolve;
    }));
    const source = createTestElement();

    connection.connect(source, {
      sourceId: "metric-source",
      previewLayout: { w: 2, h: 2 },
      createWidget: () => createWidget("metric-1"),
    });
    connection.disconnect();
    resolveAdapter?.({ setupDashboardDragInSource: setup });
    await Promise.resolve();

    expect(setup).not.toHaveBeenCalled();
  });

  it("keeps only the latest element across ref replacement", async () => {
    const firstDestroy = vi.fn();
    const secondDestroy = vi.fn();
    const setup = vi.fn()
      .mockReturnValueOnce({ destroy: firstDestroy })
      .mockReturnValueOnce({ destroy: secondDestroy });
    const connection = createDashboardDragInConnection(async () => ({
      setupDashboardDragInSource: setup,
    }));
    const first = createTestElement();
    const second = createTestElement();
    const options = {
      sourceId: "metric-source",
      previewLayout: { w: 2, h: 2 } as const,
      createWidget: () => createWidget("metric-1"),
    };

    connection.connect(first, options);
    await Promise.resolve();
    connection.connect(second, options);
    await Promise.resolve();

    expect(setup).toHaveBeenNthCalledWith(1, first, options);
    expect(setup).toHaveBeenNthCalledWith(2, second, options);
    expect(firstDestroy).toHaveBeenCalledTimes(1);
    connection.disconnect();
    connection.disconnect();
    expect(secondDestroy).toHaveBeenCalledTimes(1);
  });
});

describe("grid transfer source registry", () => {
  it("resolves a different-grid source with its controlled mode and restore callback", () => {
    const source = createTestElement();
    const restoreSource = vi.fn();
    const dispose = registerDashboardGridDragSource(source, {
      gridId: "source-grid",
      widget: createWidget("metric-1"),
      mode: "copy",
      restoreSource,
    });

    expect(resolveDashboardDropSource(source, "target-grid")).toMatchObject({
      candidate: {
        source: { kind: "grid", gridId: "source-grid", widgetId: "metric-1" },
        targetGridId: "target-grid",
        mode: "copy",
        widget: createWidget("metric-1"),
      },
      sourceElement: source,
      restoreSource,
    });
    expect(resolveDashboardDropSource(source, "source-grid")).toBeUndefined();

    dispose();
    dispose();
    expect(resolveDashboardDropSource(source, "target-grid")).toBeUndefined();
  });

  it.each([
    ["locked", { locked: true }],
    ["non-movable", { movable: false }],
    ["minimized", { minimized: true }],
    ["maximized", { maximized: true }],
  ])("rejects a %s grid source", (_name, state) => {
    const source = createTestElement();
    registerDashboardGridDragSource(source, {
      gridId: "source-grid",
      widget: { ...createWidget("metric-1"), ...state },
      mode: "move",
      restoreSource: vi.fn(),
    });

    expect(resolveDashboardDropSource(source, "target-grid")).toBeUndefined();
  });
});
