import { createRef } from "react";
import { describe, expect, it } from "vitest";
import {
  DashboardGrid,
  type DashboardGridHandle,
  type DashboardWidget,
} from "../../src";

type MetricData = { value: number };

const widgets: DashboardWidget<MetricData>[] = [
  {
    id: "metric",
    title: "Metric",
    layout: { id: "metric", x: 0, y: 0, w: 2, h: 2 },
    data: { value: 42 },
  },
];

describe("DashboardGridHandle", () => {
  it("accepts typed external drop targets without losing widget data inference", () => {
    const element = (
      <DashboardGrid<MetricData>
        widgets={widgets}
        externalDropTargets={[{ id: "trash", selector: "#trash" }]}
        onWidgetExternalDrop={(event) => {
          const widgetId: string = event.widgetId;
          const columns: number = event.columns;
          expect(widgetId).toBe("metric");
          expect(columns).toBeGreaterThan(0);
        }}
        renderWidget={(widget) => <span>{widget.data?.value}</span>}
      />
    );
    expect(element.type).toBe(DashboardGrid);
  });

  it("preserves generic widget inference while accepting a public ref", () => {
    const ref = createRef<DashboardGridHandle>();
    const element = (
      <DashboardGrid<MetricData>
        ref={ref}
        widgets={widgets}
        renderWidget={(widget) => <span>{widget.data?.value}</span>}
      />
    );

    expect(element.type).toBe(DashboardGrid);
    expect(ref.current).toBeNull();
  });
});
