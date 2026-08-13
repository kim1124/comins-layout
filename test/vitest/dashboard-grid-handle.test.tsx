import { createRef } from "react";
import type { GridStack } from "gridstack";
import { describe, expect, expectTypeOf, it } from "vitest";
import {
  DashboardGrid,
  type DashboardGridHandle,
  type DashboardWidget,
  type DashboardWidgetExternalDropEvent,
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
  it("type-checks external drop events without losing widget data inference", () => {
    const element = (
      <DashboardGrid<MetricData>
        widgets={widgets}
        externalDropTargets={[{ id: "trash", selector: "#trash" }]}
        onWidgetExternalDrop={(event) => {
          const typedEvent: DashboardWidgetExternalDropEvent = event;
          void typedEvent;
        }}
        renderWidget={(widget) => <span>{widget.data?.value}</span>}
      />
    );
    expect(element.type).toBe(DashboardGrid);
  });

  it("exposes the current GridStack instance through a readonly property", () => {
    const ref = createRef<DashboardGridHandle>();
    const element = <DashboardGrid ref={ref} widgets={widgets} renderWidget={() => null} />;

    expect(element.type).toBe(DashboardGrid);
    expectTypeOf<DashboardGridHandle["grid"]>().toEqualTypeOf<GridStack | null>();
  });
});
