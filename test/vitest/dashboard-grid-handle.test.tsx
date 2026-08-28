import { createRef } from "react";
import { describe, expect, it } from "vitest";
import {
  DashboardGrid,
  type DashboardGridHandle,
  type DashboardWidget,
  type DashboardWidgetDropCandidate,
  type DashboardWidgetDropRequest,
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

    const handleContract = (handle: DashboardGridHandle) => {
      const columns: number | null = handle.getColumnCount();
      const rows: number | null = handle.getRowCount();
      const float: boolean | null = handle.getFloat();
      const areaEmpty: boolean | null = handle.isAreaEmpty({ x: 0, y: 0, w: 1, h: 1 });
      const fits: boolean | null = handle.willItFit({ x: 0, y: 2, w: 2, h: 2 });
      return { columns, rows, float, areaEmpty, fits };
    };
    expect(handleContract).toEqual(expect.any(Function));
  });

  it("preserves typed interaction lifecycle callback payloads", () => {
    const element = (
      <DashboardGrid<MetricData>
        widgets={widgets}
        onBeforeMove={(event) => void event.layout.x}
        onMove={(event) => void event.id}
        onAfterMove={(event) => void event.layout.y}
        onBeforeResize={(event) => void event.layout.w}
        onResize={(event) => void event.layout.h}
        onAfterResize={(event) => void event.id}
        onBeforeTitleDoubleClick={(event) => void event.id}
        onTitleDoubleClick={(event) => void event.layout.id}
        onAfterTitleDoubleClick={(event) => void event.id}
        renderWidget={(widget) => <span>{widget.data?.value}</span>}
      />
    );
    expect(element.type).toBe(DashboardGrid);
  });

  it("preserves widget data inference for acceptance and controlled drop requests", () => {
    const element = (
      <DashboardGrid<MetricData>
        widgets={widgets}
        gridId="metrics-grid"
        acceptExternalWidgets={(candidate) => {
          const typedCandidate: DashboardWidgetDropCandidate<MetricData> = candidate;
          return typedCandidate.widget.data?.value === 42;
        }}
        gridTransferMode="copy"
        onWidgetDropRequest={(request) => {
          const typedRequest: DashboardWidgetDropRequest<MetricData> = request;
          void typedRequest.widget.data?.value;
        }}
        renderWidget={(widget) => <span>{widget.data?.value}</span>}
      />
    );

    expect(element.type).toBe(DashboardGrid);
  });
});
