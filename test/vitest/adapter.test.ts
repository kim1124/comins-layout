import { afterEach, describe, expect, it, vi } from "vitest";
import { findWidgetElementById } from "../../src/gridstack/adapter";

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
