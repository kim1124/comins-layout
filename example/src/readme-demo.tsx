import { useEffect, useRef, useState } from "react";
import {
  DashboardGrid,
  insertDashboardWidgetAtLayout,
  serializeDashboardState,
  transferDashboardWidget,
  useDashboardDragIn,
  useDashboardGrid,
  type DashboardGridHandle,
  type DashboardLayoutSnapshot,
  type DashboardResponsiveOptions,
  type DashboardWidget,
  type DashboardWidgetDropRequest,
  type DashboardWidgetExternalDropEvent,
} from "../../src";

type DemoData = { label: string; value: string };

type ReadmeDemoBridge = {
  addWidgetWithId: (id: string) => void;
  clearWidgets: () => void;
  getColumn: () => number | null;
  getCommitCount: () => number;
  getEngineWidgetIds: () => string[];
  getHandle: () => DashboardGridHandle | null;
  getInteractionEvents: () => string[];
  getLastCommittedLayout: () => DashboardLayoutSnapshot | null;
  getLastExternalDropEvent: () => DashboardWidgetExternalDropEvent | null;
  removeWidget: (id: string) => void;
  resetCommitCount: () => void;
  resetInteractionEvents: () => void;
  refresh: () => void;
  compact: (layout?: Parameters<DashboardGridHandle["compact"]>[0]) => DashboardLayoutSnapshot | null;
  setCustomDragHandle: (enabled: boolean) => void;
  setDirection: (direction: "ltr" | "rtl") => void;
  setOverviewLocked: (locked: boolean) => void;
  setOverviewPosition: (x: number, y: number) => void;
  setOverviewMovable: (movable: boolean) => void;
  setResponsive: (enabled: boolean) => void;
  setRtl: (rtl: boolean | "auto" | undefined) => void;
  setSizeToContent: (enabled: boolean | undefined) => void;
  setTrashVisible: (visible: boolean) => void;
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

const externalDropTargets = [
  { id: "trash", selector: "#readme-widget-trash" },
] as const;

function cloneLayoutSnapshot(snapshot: DashboardLayoutSnapshot): DashboardLayoutSnapshot {
  return {
    columns: snapshot.columns,
    widgets: snapshot.widgets.map((layout) => ({ ...layout })),
  };
}

function cloneExternalDropEvent(
  event: DashboardWidgetExternalDropEvent,
): DashboardWidgetExternalDropEvent {
  return {
    ...event,
    layout: { ...event.layout },
  };
}

export function ReadmeDemoPage() {
  const feature = new URLSearchParams(window.location.search).get("feature");

  switch (feature) {
    case "transfer":
      return <TransferFeatureDemo />;
    case "external-drop":
      return <ExternalDropFeatureDemo />;
    case "responsive-persistence":
      return <ResponsivePersistenceFeatureDemo />;
    case "lazy-rendering":
      return <LazyRenderingFeatureDemo />;
    default:
      return <LegacyReadmeDemoPage />;
  }
}

function LegacyReadmeDemoPage() {
  const dashboard = useDashboardGrid<DemoData>({ initialColumns: 6, initialWidgets });
  const gridRef = useRef<DashboardGridHandle>(null);
  const commitCountRef = useRef(0);
  const interactionEventsRef = useRef<string[]>([]);
  const lastCommittedLayoutRef = useRef<DashboardLayoutSnapshot | null>(null);
  const lastExternalDropEventRef = useRef<DashboardWidgetExternalDropEvent | null>(null);
  const [customDragHandle, setCustomDragHandle] = useState(true);
  const [direction, setDirection] = useState<"ltr" | "rtl">("ltr");
  const [responsiveEnabled, setResponsiveEnabled] = useState(false);
  const [rtl, setRtl] = useState<boolean | "auto" | undefined>(undefined);
  const [sizeToContent, setSizeToContent] = useState<boolean | undefined>(undefined);
  const [trashVisible, setTrashVisible] = useState(true);

  useEffect(() => {
    const bridge: ReadmeDemoBridge = {
      addWidgetWithId: (id) => {
        dashboard.commands.addWidget({
          id,
          title: id,
          layout: { id, x: 0, y: 0, w: 2, h: 2 },
          data: { label: id, value: id },
        });
      },
      clearWidgets: dashboard.commands.clearWidgets,
      getColumn: () => gridRef.current?.getGridStack()?.getColumn() ?? null,
      getCommitCount: () => commitCountRef.current,
      getEngineWidgetIds: () => {
        const grid = gridRef.current?.getGridStack();
        if (!grid) {
          return [];
        }
        return (grid
          .save(false, false, undefined, grid.getColumn()) as Array<{ id?: string }>)
          .flatMap((widget) => typeof widget.id === "string" ? [widget.id] : []);
      },
      getHandle: () => gridRef.current,
      getInteractionEvents: () => [...interactionEventsRef.current],
      getLastCommittedLayout: () => lastCommittedLayoutRef.current
        ? cloneLayoutSnapshot(lastCommittedLayoutRef.current)
        : null,
      getLastExternalDropEvent: () => lastExternalDropEventRef.current
        ? cloneExternalDropEvent(lastExternalDropEventRef.current)
        : null,
      removeWidget: dashboard.commands.removeWidget,
      resetCommitCount: () => {
        commitCountRef.current = 0;
      },
      resetInteractionEvents: () => {
        interactionEventsRef.current = [];
        lastCommittedLayoutRef.current = null;
        lastExternalDropEventRef.current = null;
      },
      refresh: () => gridRef.current?.refresh(),
      compact: (layout) => gridRef.current?.compact(layout) ?? null,
      setCustomDragHandle,
      setDirection,
      setOverviewLocked: (locked) => dashboard.commands.updateWidget("overview", { locked }),
      setOverviewPosition: (x, y) => dashboard.commands.updateWidgetLayout("overview", {
        x,
        y,
        w: 2,
        h: 2,
      }),
      setOverviewMovable: (movable) => dashboard.commands.updateWidget("overview", { movable }),
      setResponsive: setResponsiveEnabled,
      setRtl,
      setSizeToContent,
      setTrashVisible,
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
    <main className="readme-demo" dir={direction}>
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
          rtl,
          sizeToContent,
        }}
        refreshKey={dashboard.refreshVersion}
        responsive={responsiveEnabled ? responsiveOptions : undefined}
        externalDropTargets={externalDropTargets}
        widgets={dashboard.widgets}
        actionLabels={{ maximize: "Maximize", minimize: "Minimize", restore: "Restore", remove: "Remove" }}
        onLayoutCommit={(snapshot) => {
          lastCommittedLayoutRef.current = cloneLayoutSnapshot(snapshot);
          commitCountRef.current += 1;
          interactionEventsRef.current.push("layout-commit");
          dashboard.commands.applyLayoutSnapshot(snapshot);
        }}
        onWidgetExternalDrop={(event) => {
          lastExternalDropEventRef.current = cloneExternalDropEvent(event);
          interactionEventsRef.current.push(
            `external-drop:${event.targetId}:${event.widgetId}`,
          );
          if (event.targetId === "trash") {
            dashboard.commands.removeWidget(event.widgetId);
          }
        }}
        onMaximizeWidget={dashboard.commands.maximizeWidget}
        onMinimizeWidget={dashboard.commands.minimizeWidget}
        onRemoveWidget={dashboard.commands.removeWidget}
        onRestoreWidget={dashboard.commands.restoreWidget}
        onBeforeMove={(event) => interactionEventsRef.current.push(`drag-start:${event.id}`)}
        onAfterMove={(event) => interactionEventsRef.current.push(`drag-stop:${event.id}`)}
        onWidgetLayoutChange={(id) => interactionEventsRef.current.push(`widget-layout:${id}`)}
        onBeforeResize={(event) => interactionEventsRef.current.push(`resize-start:${event.id}`)}
        onAfterResize={(event) => interactionEventsRef.current.push(`resize-stop:${event.id}`)}
        renderWidget={(widget) => (
          <div className="readme-demo__metric">
            <span>{widget.data?.label}</span>
            <strong>{widget.data?.value}</strong>
          </div>
        )}
      />
      {trashVisible ? (
        <div
          id="readme-widget-trash"
          className="readme-demo__trash"
          data-testid="external-drop-trash"
        >
          <span data-testid="external-drop-trash-child">Drop widget here to delete</span>
        </div>
      ) : null}
    </main>
  );
}

type FeatureDemoShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  status: string;
  statusLabel: string;
  children: React.ReactNode;
};

function FeatureDemoShell({
  eyebrow,
  title,
  description,
  status,
  statusLabel,
  children,
}: FeatureDemoShellProps) {
  return (
    <main className="readme-feature-demo">
      <header className="readme-feature-demo__header">
        <div>
          <p>{eyebrow}</p>
          <h1>{title}</h1>
          <span>{description}</span>
        </div>
        <p className="readme-feature-demo__status" role="status" aria-label={statusLabel}>
          {status}
        </p>
      </header>
      {children}
    </main>
  );
}

const transferSourceWidgets: DashboardWidget<DemoData>[] = [
  {
    id: "source-sales",
    title: "Sales",
    layout: { id: "source-sales", x: 0, y: 0, w: 3, h: 2 },
    data: { label: "Weekly sales", value: "$42.8K" },
  },
];

const transferTargetWidgets: DashboardWidget<DemoData>[] = [
  {
    id: "target-orders",
    title: "Orders",
    layout: { id: "target-orders", x: 0, y: 0, w: 3, h: 2 },
    data: { label: "Completed orders", value: "1,284" },
  },
];

function TransferFeatureDemo() {
  const source = useDashboardGrid<DemoData>({
    initialColumns: 6,
    initialWidgets: transferSourceWidgets,
  });
  const target = useDashboardGrid<DemoData>({
    initialColumns: 6,
    initialWidgets: transferTargetWidgets,
  });
  const paletteSequence = useRef(0);
  const [status, setStatus] = useState("Drag a palette item or move Sales to the target dashboard");
  const paletteRef = useDashboardDragIn<DemoData>({
    sourceId: "readme-metric-palette",
    previewLayout: { w: 3, h: 2 },
    createWidget: () => {
      paletteSequence.current += 1;
      const id = `palette-metric-${paletteSequence.current}`;
      return {
        id,
        title: "New metric",
        layout: { id, x: 0, y: 0, w: 3, h: 2 },
        data: { label: "Conversion", value: "8.4%" },
      };
    },
  });

  const applyDrop = (request: DashboardWidgetDropRequest<DemoData>) => {
    if (request.targetGridId !== "readme-transfer-target-grid") {
      return;
    }

    if (request.source.kind === "palette") {
      const inserted = insertDashboardWidgetAtLayout(
        target.state,
        request.widget,
        request.targetLayout,
        request.targetSnapshot,
      );
      if (inserted.accepted) {
        target.commands.restoreLayout(serializeDashboardState(inserted.state));
        setStatus(`copy accepted: ${request.widget.id}`);
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
      setStatus(`move accepted: ${request.source.widgetId}`);
    }
  };

  return (
    <FeatureDemoShell
      eyebrow="Feature highlight 01"
      title="Palette and Grid Transfer"
      description="Consumer-owned state stays authoritative across palette insertion and grid-to-grid movement."
      status={status}
      statusLabel="Transfer status"
    >
      <section className="readme-feature-demo__palette">
        <span>Widget palette</span>
        <button ref={paletteRef} type="button" data-testid="readme-palette-metric">
          + Conversion metric
        </button>
      </section>
      <div className="readme-feature-demo__grid-pair">
        <section className="readme-feature-demo__panel" data-testid="readme-transfer-source">
          <h2>Source dashboard</h2>
          <DashboardGrid
            gridId="readme-transfer-source-grid"
            gridTransferMode="move"
            columns={source.columns}
            engineOptions={{ animate: false, cellHeight: 72 }}
            widgets={source.widgets}
            showControls={false}
            onLayoutCommit={source.commands.applyLayoutSnapshot}
            renderWidget={(widget) => (
              <div className="readme-demo__metric">
                <span>{widget.data?.label}</span>
                <strong>{widget.data?.value}</strong>
              </div>
            )}
          />
        </section>
        <section className="readme-feature-demo__panel" data-testid="readme-transfer-target">
          <h2>Target dashboard</h2>
          <DashboardGrid
            gridId="readme-transfer-target-grid"
            acceptExternalWidgets
            columns={target.columns}
            engineOptions={{ animate: false, cellHeight: 72 }}
            widgets={target.widgets}
            showControls={false}
            onLayoutCommit={target.commands.applyLayoutSnapshot}
            onWidgetDropRequest={applyDrop}
            renderWidget={(widget) => (
              <div className="readme-demo__metric">
                <span>{widget.data?.label}</span>
                <strong>{widget.data?.value}</strong>
              </div>
            )}
          />
        </section>
      </div>
    </FeatureDemoShell>
  );
}

const externalDropWidgets: DashboardWidget<DemoData>[] = [
  {
    id: "drop-alerts",
    title: "Alerts",
    layout: { id: "drop-alerts", x: 0, y: 0, w: 3, h: 2 },
    data: { label: "Open alerts", value: "12" },
  },
  {
    id: "drop-traffic",
    title: "Traffic",
    layout: { id: "drop-traffic", x: 3, y: 0, w: 3, h: 2 },
    data: { label: "Active users", value: "2,104" },
  },
];

function ExternalDropFeatureDemo() {
  const dashboard = useDashboardGrid<DemoData>({
    initialColumns: 6,
    initialWidgets: externalDropWidgets,
  });
  const [status, setStatus] = useState("Drag Alerts into the archive target");

  return (
    <FeatureDemoShell
      eyebrow="Feature highlight 02"
      title="External HTML Drop Target"
      description="Drop detection reports the target and leaves the resulting state change to the consumer."
      status={status}
      statusLabel="External drop status"
    >
      <div className="readme-feature-demo__external-layout">
        <section className="readme-feature-demo__panel readme-feature-demo__external-grid">
          <h2>Operations dashboard</h2>
          <DashboardGrid
            columns={dashboard.columns}
            engineOptions={{ animate: false, cellHeight: 88 }}
            externalDropTargets={[
              { id: "archive", selector: "#readme-feature-trash" },
            ]}
            widgets={dashboard.widgets}
            showControls={false}
            onLayoutCommit={dashboard.commands.applyLayoutSnapshot}
            onWidgetExternalDrop={(event) => {
              if (event.targetId === "archive") {
                dashboard.commands.removeWidget(event.widgetId);
                setStatus(`Removed ${event.widgetId} from controlled state`);
              }
            }}
            renderWidget={(widget) => (
              <div className="readme-demo__metric">
                <span>{widget.data?.label}</span>
                <strong>{widget.data?.value}</strong>
              </div>
            )}
          />
        </section>
        <div
          id="readme-feature-trash"
          className="readme-feature-demo__drop-target"
          data-testid="readme-drop-trash"
        >
          <strong>Archive widget</strong>
          <span>Drop here</span>
        </div>
      </div>
    </FeatureDemoShell>
  );
}

const persistenceWidgets: DashboardWidget<DemoData>[] = [
  {
    id: "persist-sales",
    title: "Sales",
    layout: { id: "persist-sales", x: 6, y: 0, w: 3, h: 2 },
    data: { label: "Net sales", value: "$98.2K" },
  },
  {
    id: "persist-orders",
    title: "Orders",
    layout: { id: "persist-orders", x: 0, y: 0, w: 3, h: 2 },
    data: { label: "Orders", value: "3,420" },
  },
];

function ResponsivePersistenceFeatureDemo() {
  const dashboard = useDashboardGrid<DemoData>({
    initialColumns: 12,
    initialWidgets: persistenceWidgets,
  });
  const sales = dashboard.widgets.find((widget) => widget.id === "persist-sales");
  const layoutCount = Object.keys(dashboard.state.layoutsByColumn).length;
  const status = `${dashboard.columns} columns · Sales x=${sales?.layout.x ?? "-"} · ${layoutCount} saved layouts`;

  return (
    <FeatureDemoShell
      eyebrow="Feature highlight 03"
      title="Responsive Columns and Persistence"
      description="Each runtime column count keeps an independent layout that returns when the viewport mode changes."
      status={status}
      statusLabel="Persistence status"
    >
      <section className="readme-feature-demo__controls" aria-label="Column controls">
        <button type="button" onClick={() => dashboard.commands.setColumns(6)}>Use 6 columns</button>
        <button
          type="button"
          onClick={() => dashboard.commands.updateWidgetLayout("persist-sales", { x: 2 })}
          disabled={dashboard.columns !== 6}
        >
          Move in 6 columns
        </button>
        <button type="button" onClick={() => dashboard.commands.setColumns(12)}>Use 12 columns</button>
      </section>
      <section className="readme-feature-demo__panel readme-feature-demo__persistence-grid">
        <DashboardGrid
          columns={dashboard.columns}
          engineOptions={{ animate: false, cellHeight: 96 }}
          widgets={dashboard.widgets}
          showControls={false}
          onLayoutCommit={dashboard.commands.applyLayoutSnapshot}
          renderWidget={(widget) => (
            <div className="readme-demo__metric">
              <span>{widget.data?.label}</span>
              <strong>{widget.data?.value}</strong>
            </div>
          )}
        />
      </section>
    </FeatureDemoShell>
  );
}

const lazyWidgets: DashboardWidget<DemoData>[] = [
  {
    id: "lazy-eager",
    title: "Above the fold",
    layout: { id: "lazy-eager", x: 0, y: 0, w: 6, h: 2 },
    data: { label: "Immediate content", value: "Ready" },
    lazyLoad: false,
  },
  {
    id: "lazy-retention",
    title: "Retention",
    layout: { id: "lazy-retention", x: 0, y: 2, w: 6, h: 2 },
    data: { label: "Retention", value: "86%" },
    lazyLoad: false,
  },
  {
    id: "lazy-sessions",
    title: "Sessions",
    layout: { id: "lazy-sessions", x: 0, y: 4, w: 6, h: 2 },
    data: { label: "Sessions", value: "24.1K" },
    lazyLoad: false,
  },
  {
    id: "lazy-depth",
    title: "Scroll depth",
    layout: { id: "lazy-depth", x: 0, y: 6, w: 6, h: 2 },
    data: { label: "Keep scrolling", value: "↓" },
    lazyLoad: false,
  },
  {
    id: "lazy-deferred",
    title: "Below the fold",
    layout: { id: "lazy-deferred", x: 0, y: 8, w: 6, h: 2 },
    data: { label: "Deferred content", value: "Mounted" },
    lazyLoad: true,
  },
];

function LazyFeatureContent({
  widget,
  onDeferredMount,
}: {
  widget: DashboardWidget<DemoData>;
  onDeferredMount: () => void;
}) {
  useEffect(() => {
    if (widget.id === "lazy-deferred") {
      onDeferredMount();
    }
  }, [onDeferredMount, widget.id]);

  const testId = widget.id === "lazy-eager"
    ? "readme-lazy-eager-content"
    : widget.id === "lazy-deferred"
      ? "readme-lazy-deferred-content"
      : undefined;

  return (
    <div
      className="readme-demo__metric"
      data-testid={testId}
    >
      <span>{widget.data?.label}</span>
      <strong>{widget.data?.value}</strong>
    </div>
  );
}

function LazyRenderingFeatureDemo() {
  const [deferredMounted, setDeferredMounted] = useState(false);
  const status = deferredMounted
    ? "Deferred content mounted once"
    : "Scroll to mount deferred React content";

  return (
    <FeatureDemoShell
      eyebrow="Feature highlight 04"
      title="React Content Lazy Rendering"
      description="Widget shells participate in layout immediately while expensive React content waits for intersection."
      status={status}
      statusLabel="Lazy render status"
    >
      <section
        className="readme-feature-demo__lazy-scroll"
        data-dashboard-lazy-scroll
        data-testid="readme-lazy-scroll"
      >
        <DashboardGrid
          columns={6}
          engineOptions={{ animate: false, cellHeight: 72 }}
          lazyRenderWidget
          widgets={lazyWidgets}
          showControls={false}
          renderWidget={(widget) => (
            <LazyFeatureContent
              widget={widget}
              onDeferredMount={() => setDeferredMounted(true)}
            />
          )}
        />
      </section>
    </FeatureDemoShell>
  );
}
