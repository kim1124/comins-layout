import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { DashboardGrid } from "../../src";
import type { DashboardWidget } from "../../src";

const widgets: DashboardWidget[] = [
  {
    id: "metric",
    layout: { id: "metric", x: 0, y: 0, w: 2, h: 2 },
  },
];

describe("DashboardGrid widget actions", () => {
  it("replaces default controls with consumer actions", () => {
    const markup = renderToStaticMarkup(
      <DashboardGrid
        widgets={widgets}
        renderWidget={() => <span>content</span>}
        renderWidgetActions={(widget) => <button>Refresh {widget.id}</button>}
      />,
    );

    expect(markup).toContain("Refresh metric");
    expect(markup).not.toContain("metric 최대화");
  });

  it("lets showControls=false suppress custom actions", () => {
    const markup = renderToStaticMarkup(
      <DashboardGrid
        showControls={false}
        widgets={widgets}
        renderWidget={() => null}
        renderWidgetActions={() => <button>Custom</button>}
      />,
    );

    expect(markup).not.toContain("Custom");
  });
});
