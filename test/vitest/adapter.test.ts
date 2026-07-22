import { afterEach, describe, expect, it, vi } from "vitest";
import { findWidgetElementById, sameDashboardLayoutSnapshot } from "../../src/gridstack/adapter";

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
    expect(querySelector).toHaveBeenCalledWith('[data-widget-id="escaped-widget-id"]');
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
