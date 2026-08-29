import { useRef } from "react";

import {
  DashboardGrid,
  insertDashboardWidgetAtLayout,
  serializeDashboardState,
  transferDashboardWidget,
  useDashboardDragIn,
  useDashboardGrid,
} from "../../../src";
import type {
  DashboardGridHandle,
  DashboardWidget,
  DashboardWidgetDropRequest,
} from "../../../src";

type Metric = { kind: "metric" | "restricted"; label: string };

const initialSourceWidgets: DashboardWidget<Metric>[] = [
  {
    id: "source-metric",
    title: "Metric",
    layout: { id: "source-metric", x: 0, y: 0, w: 2, h: 2 },
    data: { kind: "metric", label: "Revenue" },
  },
];

export function PublicDocConsumerFixture() {
  const source = useDashboardGrid<Metric>({ initialColumns: 6, initialWidgets: initialSourceWidgets });
  const target = useDashboardGrid<Metric>({ initialColumns: 12 });
  const gridRef = useRef<DashboardGridHandle>(null);
  const paletteSequence = useRef(0);
  const paletteRef = useDashboardDragIn<Metric>({
    sourceId: "metric-palette",
    previewLayout: { w: 2, h: 2 },
    createWidget: () => {
      paletteSequence.current += 1;
      const id = `metric-${paletteSequence.current}`;
      return {
        id,
        title: "New metric",
        layout: { id, x: 0, y: 0, w: 2, h: 2 },
        data: { kind: "metric", label: "New metric" },
      };
    },
  });

  const applyDrop = (request: DashboardWidgetDropRequest<Metric>) => {
    if (request.source.kind === "palette") {
      const inserted = insertDashboardWidgetAtLayout(
        target.state,
        request.widget,
        request.targetLayout,
        request.targetSnapshot,
      );
      if (inserted.accepted) {
        target.commands.restoreLayout(serializeDashboardState(inserted.state));
      }
      return;
    }

    const transferred = transferDashboardWidget({
      source: source.state,
      target: target.state,
      widgetId: request.source.widgetId,
      targetLayout: request.targetLayout,
      targetSnapshot: request.targetSnapshot,
      mode: request.mode,
    });
    if (transferred.accepted) {
      source.commands.restoreLayout(serializeDashboardState(transferred.source));
      target.commands.restoreLayout(serializeDashboardState(transferred.target));
    }
  };

  return (
    <div data-dashboard-lazy-scroll>
      <button ref={paletteRef} type="button">Drag metric</button>
      <button type="button" onClick={() => gridRef.current?.compact("compact", true)}>Compact target</button>
      <DashboardGrid
        gridId="source-grid"
        gridTransferMode="move"
        columns={source.columns}
        widgets={source.widgets}
        onLayoutCommit={source.commands.applyLayoutSnapshot}
        renderWidget={(widget) => widget.data?.label}
      />
      <DashboardGrid
        ref={gridRef}
        gridId="target-grid"
        acceptExternalWidgets={(candidate) => candidate.widget.data?.kind !== "restricted"}
        columns={target.columns}
        lazyRenderWidget
        widgets={target.widgets}
        onLayoutCommit={target.commands.applyLayoutSnapshot}
        onWidgetDropRequest={applyDrop}
        renderWidget={(widget) => widget.data?.label}
      />
    </div>
  );
}
