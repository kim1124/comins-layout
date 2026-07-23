import { useEffect, useRef, useState } from "react";
import {
  DashboardGrid,
  useDashboardGrid,
  type DashboardGridHandle,
  type DashboardLayoutSnapshot,
  type DashboardResponsiveOptions,
  type DashboardWidget,
} from "../../src";

type DemoData = { label: string; value: string };

type ReadmeDemoBridge = {
  getColumn: () => number | null;
  getCommitCount: () => number;
  getHandle: () => DashboardGridHandle | null;
  getInteractionEvents: () => string[];
  resetCommitCount: () => void;
  resetInteractionEvents: () => void;
  refresh: () => void;
  compact: (layout?: Parameters<DashboardGridHandle["compact"]>[0]) => DashboardLayoutSnapshot | null;
  setCustomDragHandle: (enabled: boolean) => void;
  setResponsive: (enabled: boolean) => void;
  moveWithGridStack: (id: string, x: number, y: number) => DashboardLayoutSnapshot | null;
};

declare global {
  interface Window {
    __cominsReadmeDemo?: ReadmeDemoBridge;
    __retainedCominsGridHandle?: DashboardGridHandle | null;
  }
}

const initialWidgets: DashboardWidget<DemoData>[] = [
  {
    id: "overview",
    title: "Overview",
    layout: { id: "overview", x: 0, y: 0, w: 2, h: 2 },
    data: { label: "Monthly revenue", value: "$128K" },
  },
  {
    id: "orders",
    title: "Orders",
    layout: { id: "orders", x: 4, y: 0, w: 2, h: 2 },
    data: { label: "Completed orders", value: "1,284" },
  },
];

const responsiveOptions: DashboardResponsiveOptions = {
  columnMax: 6,
  breakpointForWindow: true,
  breakpoints: [
    { maxWidth: 700, columns: 1, layout: "list" },
    { maxWidth: 1200, columns: 4, layout: "moveScale" },
  ],
};

export function ReadmeDemoPage() {
  const dashboard = useDashboardGrid<DemoData>({ initialColumns: 6, initialWidgets });
  const gridRef = useRef<DashboardGridHandle>(null);
  const commitCountRef = useRef(0);
  const interactionEventsRef = useRef<string[]>([]);
  const [customDragHandle, setCustomDragHandle] = useState(true);
  const [responsiveEnabled, setResponsiveEnabled] = useState(false);

  useEffect(() => {
    const bridge: ReadmeDemoBridge = {
      getColumn: () => gridRef.current?.getGridStack()?.getColumn() ?? null,
      getCommitCount: () => commitCountRef.current,
      getHandle: () => gridRef.current,
      getInteractionEvents: () => [...interactionEventsRef.current],
      resetCommitCount: () => {
        commitCountRef.current = 0;
      },
      resetInteractionEvents: () => {
        interactionEventsRef.current = [];
      },
      refresh: () => gridRef.current?.refresh(),
      compact: (layout) => gridRef.current?.compact(layout) ?? null,
      setCustomDragHandle,
      setResponsive: setResponsiveEnabled,
      moveWithGridStack: (id, x, y) => {
        const grid = gridRef.current?.getGridStack();
        const item = grid?.getGridItems().find((candidate) => candidate.getAttribute("gs-id") === id);
        if (!grid || !item) {
          return null;
        }
        grid.update(item, { x, y });
        return gridRef.current?.commitLayout() ?? null;
      },
    };
    window.__cominsReadmeDemo = bridge;
    return () => {
      if (window.__cominsReadmeDemo === bridge) {
        delete window.__cominsReadmeDemo;
      }
    };
  }, []);

  const addWidget = () => {
    if (dashboard.widgets.some((widget) => widget.id === "new-widget")) {
      return;
    }
    dashboard.commands.addWidget({
      id: "new-widget",
      title: "New widget",
      layout: { id: "new-widget", x: 0, y: 2, w: 2, h: 2 },
      data: { label: "Conversion rate", value: "8.4%" },
    });
  };

  return (
    <main className="readme-demo">
      <header className="readme-demo__hero">
        <div>
          <p>comins-grid-layout</p>
          <h1>Interactive dashboards for React</h1>
        </div>
        <div className="readme-demo__toolbar">
          <label>
            Columns
            <select
              aria-label="Columns"
              value={dashboard.columns}
              onChange={(event) => dashboard.commands.setColumns(Number(event.target.value))}
            >
              <option value="4">4</option>
              <option value="6">6</option>
              <option value="8">8</option>
            </select>
          </label>
          <button type="button" onClick={addWidget}>Add widget</button>
        </div>
      </header>

      <p className="readme-demo__count">{dashboard.widgets.length} widgets</p>
      <DashboardGrid
        ref={gridRef}
        columns={dashboard.columns}
        engineOptions={{
          animate: false,
          dragHandle: customDragHandle ? ".comins-grid-layout-widget__title" : undefined,
        }}
        refreshKey={dashboard.refreshVersion}
        responsive={responsiveEnabled ? responsiveOptions : undefined}
        widgets={dashboard.widgets}
        actionLabels={{ maximize: "Maximize", minimize: "Minimize", restore: "Restore", remove: "Remove" }}
        onLayoutCommit={(snapshot) => {
          commitCountRef.current += 1;
          interactionEventsRef.current.push("layout-commit");
          dashboard.commands.applyLayoutSnapshot(snapshot);
        }}
        onMaximizeWidget={dashboard.commands.maximizeWidget}
        onMinimizeWidget={dashboard.commands.minimizeWidget}
        onRemoveWidget={dashboard.commands.removeWidget}
        onRestoreWidget={dashboard.commands.restoreWidget}
        onWidgetDragStart={(event) => interactionEventsRef.current.push(`drag-start:${event.id}`)}
        onWidgetDragStop={(event) => interactionEventsRef.current.push(`drag-stop:${event.id}`)}
        onWidgetLayoutChange={(id) => interactionEventsRef.current.push(`widget-layout:${id}`)}
        onWidgetResizeStart={(event) => interactionEventsRef.current.push(`resize-start:${event.id}`)}
        onWidgetResizeStop={(event) => interactionEventsRef.current.push(`resize-stop:${event.id}`)}
        renderWidget={(widget) => (
          <div className="readme-demo__metric">
            <span>{widget.data?.label}</span>
            <strong>{widget.data?.value}</strong>
          </div>
        )}
      />
    </main>
  );
}
