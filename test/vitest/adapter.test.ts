import { afterEach, describe, expect, it, vi } from "vitest";
import type { GridItemHTMLElement, GridStack, GridStackNode } from "gridstack";
import {
  completeDashboardWidgetDrop,
  createDashboardWidgetDropRequest,
  detachControlledDashboardGridOwner,
  findWidgetElementById,
  isDashboardDropCandidateAccepted,
  rollbackDashboardExternalWidget,
  sameDashboardLayoutSnapshot,
  shouldSuppressDashboardExternalChange,
} from "../../src/gridstack/adapter";
import type { DashboardWidget, DashboardWidgetDropCandidate } from "../../src";
import { registerDashboardGridDragSource } from "../../src/gridstack/transfer-registry";

describe("findWidgetElementById", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("escapes selector-significant widget IDs before querying the grid element", () => {
    const widgetId = 'sales\"] .grid-stack-item';
    const item = {} as HTMLElement;
    const querySelector = vi.fn(() => item);
    const escape = vi.fn(() => "escaped-widget-id");
    const element = { querySelector } as unknown as HTMLElement;

    vi.stubGlobal("CSS", { escape });

    expect(findWidgetElementById(element, widgetId)).toBe(item);
    expect(escape).toHaveBeenCalledWith(widgetId);
    expect(querySelector).toHaveBeenCalledWith(':scope > [data-widget-id="escaped-widget-id"]');
  });
});

describe("detachControlledDashboardGridOwner", () => {
  it("keeps a React-owned nested DashboardGrid independent from GridStack native sub-grid routing", () => {
    const removeParentClass = vi.fn();
    const removeChildClass = vi.fn();
    const parentElement = { classList: { remove: removeParentClass } } as unknown as HTMLElement;
    const childElement = { classList: { remove: removeChildClass } } as unknown as HTMLElement;
    const grid = { el: childElement } as GridStack;
    const parentNode = { el: parentElement, subGrid: grid } as GridStackNode;
    grid.parentGridNode = parentNode;

    detachControlledDashboardGridOwner(grid);

    expect(grid.parentGridNode).toBeUndefined();
    expect(parentNode.subGrid).toBeUndefined();
    expect(removeChildClass).toHaveBeenCalledWith("grid-stack-nested");
    expect(removeParentClass).toHaveBeenCalledWith("grid-stack-sub-grid");
  });
});

describe("sameDashboardLayoutSnapshot", () => {
  const baseline = {
    columns: 6 as const,
    widgets: [
      { id: "sales", x: 0, y: 0, w: 2, h: 2, minW: 1, maxW: 4 },
      { id: "orders", x: 4, y: 0, w: 2, h: 2 },
    ],
  };

  it("accepts independently allocated and reordered snapshots with identical geometry", () => {
    expect(sameDashboardLayoutSnapshot(baseline, structuredClone(baseline))).toBe(true);
    expect(sameDashboardLayoutSnapshot(baseline, { ...baseline, widgets: [...baseline.widgets].reverse() })).toBe(true);
  });

  it("rejects column, geometry, and constraint changes", () => {
    expect(sameDashboardLayoutSnapshot(baseline, { ...baseline, columns: 8 })).toBe(false);
    expect(
      sameDashboardLayoutSnapshot(baseline, {
        ...baseline,
        widgets: [{ ...baseline.widgets[0]!, x: 1 }, baseline.widgets[1]!],
      }),
    ).toBe(false);
    expect(
      sameDashboardLayoutSnapshot(baseline, {
        ...baseline,
        widgets: [{ ...baseline.widgets[0]!, maxW: 5 }, baseline.widgets[1]!],
      }),
    ).toBe(false);
  });
});

describe("controlled external widget drop", () => {
  const targetWidgets: DashboardWidget<{ value: number }>[] = [
    {
      id: "existing",
      layout: { id: "existing", x: 0, y: 0, w: 2, h: 2 },
      data: { value: 1 },
    },
  ];
  const candidate: DashboardWidgetDropCandidate<{ value: number }> = {
    source: { kind: "palette", sourceId: "metric-source" },
    targetGridId: "target-grid",
    widget: {
      id: "metric-2",
      layout: { id: "metric-2", x: 0, y: 0, w: 2, h: 2 },
      data: { value: 2 },
    },
    mode: "copy",
  };
  const targetLayout = { id: "metric-2", x: 2, y: 0, w: 2, h: 2 };
  const targetSnapshot = {
    columns: 6 as const,
    widgets: [targetWidgets[0]!.layout, targetLayout],
  };

  it("creates a serializable typed request only after validating the full target snapshot", () => {
    const request = createDashboardWidgetDropRequest(
      candidate,
      targetWidgets,
      targetLayout,
      targetSnapshot,
      "target-grid-drop-1",
    );

    expect(request).toEqual({
      ...candidate,
      operationId: "target-grid-drop-1",
      targetLayout,
      targetSnapshot,
    });
    expect(JSON.parse(JSON.stringify(request))).toEqual(request);

    expect(createDashboardWidgetDropRequest(
      { ...candidate, widget: { ...candidate.widget, id: "existing", layout: targetWidgets[0]!.layout } },
      targetWidgets,
      targetWidgets[0]!.layout,
      { columns: 6, widgets: [targetWidgets[0]!.layout] },
      "target-grid-drop-2",
    )).toBeUndefined();
    expect(createDashboardWidgetDropRequest(
      candidate,
      targetWidgets,
      targetLayout,
      { ...targetSnapshot, widgets: [targetWidgets[0]!.layout, { ...targetLayout, x: 1 }] },
      "target-grid-drop-3",
    )).toBeUndefined();
  });

  it("rejects duplicate IDs and contains predicate rejection or exceptions", () => {
    expect(isDashboardDropCandidateAccepted(candidate, targetWidgets, true)).toBe(true);
    expect(isDashboardDropCandidateAccepted(candidate, targetWidgets, () => false)).toBe(false);
    expect(isDashboardDropCandidateAccepted(candidate, targetWidgets, () => {
      throw new Error("private predicate failure");
    })).toBe(false);
    expect(isDashboardDropCandidateAccepted(
      { ...candidate, widget: targetWidgets[0]! },
      targetWidgets,
      true,
    )).toBe(false);
  });

  it("rolls back before delivering once and contains consumer exceptions", () => {
    const order: string[] = [];
    const rollback = vi.fn(() => order.push("rollback"));
    const onRequest = vi.fn(() => order.push("request"));
    const request = createDashboardWidgetDropRequest(
      candidate,
      targetWidgets,
      targetLayout,
      targetSnapshot,
      "target-grid-drop-1",
    );

    completeDashboardWidgetDrop(request, rollback, onRequest);
    expect(order).toEqual(["rollback", "request"]);
    expect(onRequest).toHaveBeenCalledTimes(1);

    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    expect(() => completeDashboardWidgetDrop(request, rollback, () => {
      throw new Error("private consumer failure");
    })).not.toThrow();
    expect(consoleError).toHaveBeenCalledWith("Failed to handle comins-grid-layout widget drop request.");
    consoleError.mockRestore();
  });

  it("always rolls back when no valid request or consumer callback exists", () => {
    const rollback = vi.fn();
    completeDashboardWidgetDrop(undefined, rollback, vi.fn());
    completeDashboardWidgetDrop(
      createDashboardWidgetDropRequest(
        candidate,
        targetWidgets,
        targetLayout,
        targetSnapshot,
        "target-grid-drop-1",
      ),
      rollback,
      undefined,
    );
    expect(rollback).toHaveBeenCalledTimes(2);
  });

  it("removes temporary target ownership before source restore or clone removal", () => {
    const order: string[] = [];
    const item = {
      remove: vi.fn(() => order.push("remove-clone")),
    } as unknown as GridItemHTMLElement;

    rollbackDashboardExternalWidget(
      item,
      () => order.push("remove-target"),
      () => order.push("restore-source"),
      () => order.push("sync-target"),
    );
    expect(order).toEqual(["remove-target", "restore-source", "sync-target"]);
    expect(item.remove).not.toHaveBeenCalled();

    order.length = 0;
    rollbackDashboardExternalWidget(
      item,
      () => order.push("remove-target"),
      undefined,
      () => order.push("sync-target"),
    );
    expect(order).toEqual(["remove-target", "remove-clone", "sync-target"]);
  });

  it("suppresses hover and final external changes but releases a cleaned dropout", () => {
    const targetElement = {} as HTMLElement;
    const outsideElement = {} as HTMLElement;
    const sourceElement = { parentElement: targetElement } as unknown as HTMLElement;
    const dispose = registerDashboardGridDragSource(sourceElement, {
      gridId: "source-grid",
      widget: candidate.widget,
      mode: "move",
      restoreSource: vi.fn(),
    });

    expect(shouldSuppressDashboardExternalChange(
      [{ _isExternal: true } as unknown as GridStackNode],
      [],
      targetElement,
      "target-grid",
    )).toBe(true);
    expect(shouldSuppressDashboardExternalChange(
      [{ el: sourceElement } as GridStackNode],
      [],
      targetElement,
      "target-grid",
    )).toBe(true);

    Object.assign(sourceElement, { parentElement: outsideElement });
    expect(shouldSuppressDashboardExternalChange(
      [{ el: sourceElement } as GridStackNode],
      [],
      targetElement,
      "target-grid",
    )).toBe(false);
    dispose();
  });
});
