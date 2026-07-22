import { useEffect, useRef } from "react";
import {
  DashboardGrid,
  useDashboardGrid,
  type DashboardGridHandle,
  type DashboardLayoutSnapshot,
  type DashboardWidget,
} from "../../src";

type DemoData = { label: string; value: string };

type ReadmeDemoBridge = {
  getColumn: () => number | null;
  getCommitCount: () => number;
  getHandle: () => DashboardGridHandle | null;
  resetCommitCount: () => void;
  refresh: () => void;
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

export function ReadmeDemoPage() {
  const dashboard = useDashboardGrid<DemoData>({ initialColumns: 6, initialWidgets });
  const gridRef = useRef<DashboardGridHandle>(null);
  const commitCountRef = useRef(0);

  useEffect(() => {
    const bridge: ReadmeDemoBridge = {
      getColumn: () => gridRef.current?.getGridStack()?.getColumn() ?? null,
      getCommitCount: () => commitCountRef.current,
      getHandle: () => gridRef.current,
      resetCommitCount: () => {
        commitCountRef.current = 0;
      },
      refresh: () => gridRef.current?.refresh(),
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
        refreshKey={dashboard.refreshVersion}
        widgets={dashboard.widgets}
        actionLabels={{ maximize: "Maximize", minimize: "Minimize", restore: "Restore", remove: "Remove" }}
        onLayoutCommit={() => {
          commitCountRef.current += 1;
        }}
        onMaximizeWidget={dashboard.commands.maximizeWidget}
        onMinimizeWidget={dashboard.commands.minimizeWidget}
        onRemoveWidget={dashboard.commands.removeWidget}
        onRestoreWidget={dashboard.commands.restoreWidget}
        onWidgetLayoutChange={dashboard.commands.updateWidgetLayout}
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
