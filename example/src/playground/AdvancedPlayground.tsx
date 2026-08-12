import { useEffect, useMemo, useRef, useState } from "react";
import { Lock, Move, Save, Settings2, Trash2, Unlock } from "lucide-react";

import { DashboardGrid, useDashboardGrid } from "../../../src";
import type {
  DashboardExternalDropTarget,
  DashboardGridHandle,
  DashboardLayoutSnapshot,
  DashboardResponsiveOptions,
  DashboardWidgetExternalDropEvent,
} from "../../../src";
import { Select } from "../components/ui/select";
import type { SelectOption } from "../components/ui/select";
import { usePlaygroundLocale } from "../i18n/playground-locale";
import { PlaygroundHeader, toggleStateProps } from "./components/DashboardPreview";
import { LayoutJson } from "./components/LayoutJson";
import { WidgetCrudControls } from "./components/WidgetCrudControls";
import {
  advancedPlaygroundCopy,
  createPresentedWidgets,
  formatAdvancedCommitStatus,
  formatAdvancedDiagnosticStatus,
  formatAdvancedHandleStatus,
  formatAdvancedLayoutStatus,
  resolveDashboardActionLabels,
  sharedPlaygroundCopy,
} from "./copy";
import type {
  AdvancedCommitStatus,
  AdvancedDiagnosticStatus,
  AdvancedHandleStatus,
  AdvancedLayoutStatus,
} from "./copy";
import { createAdvancedPlaygroundFixture } from "./fixtures";
import { sanitizeExampleDashboardStateSnapshot } from "./state-snapshot";
import type { ExampleWidgetData } from "./types";

const columnOptions: SelectOption[] = [
  { label: "6", value: "6" },
  { label: "12", value: "12" },
];

const externalDropTargets = [
  { id: "trash", selector: "[data-dashboard-drop-target='trash']" },
] as const satisfies ReadonlyArray<DashboardExternalDropTarget>;

const responsiveOptions: DashboardResponsiveOptions = {
  breakpointForWindow: true,
  columnMax: 12,
  breakpoints: [{ maxWidth: 900, columns: 6, layout: "moveScale" }],
};

export function AdvancedPlayground() {
  const { locale, text } = usePlaygroundLocale();
  const dashboard = useDashboardGrid<ExampleWidgetData>({
    initialColumns: 12,
    initialWidgets: createAdvancedPlaygroundFixture(),
  });
  const gridRef = useRef<DashboardGridHandle>(null);
  const [movable, setMovable] = useState(true);
  const [resizable, setResizable] = useState(true);
  const [locked, setLocked] = useState(false);
  const [responsiveEnabled, setResponsiveEnabled] = useState(false);
  const [floatEnabled, setFloatEnabled] = useState(false);
  const [layoutJson, setLayoutJson] = useState("");
  const [layoutStatus, setLayoutStatus] = useState<AdvancedLayoutStatus>({ type: "missing" });
  const [externalDropStatus, setExternalDropStatus] = useState<AdvancedDiagnosticStatus>({ type: "externalDropInitial" });
  const [handleStatus, setHandleStatus] = useState<AdvancedHandleStatus>({ type: "notReady" });
  const [queryStatus, setQueryStatus] = useState<AdvancedDiagnosticStatus>({ type: "gridNotReady" });
  const [commitStatus, setCommitStatus] = useState<AdvancedCommitStatus>({ type: "missing" });
  const presentedWidgets = useMemo(() => createPresentedWidgets(dashboard.widgets, locale), [dashboard.widgets, locale]);

  const cacheKeys = Object.keys(dashboard.state.layoutsByColumn)
    .map(Number)
    .sort((left, right) => left - right)
    .join(", ");

  const refreshGridQueries = () => {
    const grid = gridRef.current?.getGridStack();
    if (!grid) {
      setQueryStatus({ type: "gridNotReady" });
      return false;
    }

    setQueryStatus({
      type: "diagnostic",
      value: `column=${grid.getColumn()}; row=${grid.getRow()}; float=${String(grid.getFloat())}`,
    });
    return true;
  };

  useEffect(() => {
    let frame: number | undefined;
    let remainingAttempts = 120;

    const readWhenReady = () => {
      if (refreshGridQueries()) {
        setHandleStatus((status) => status.type === "notReady" ? { type: "ready" } : status);
        return;
      }
      if (remainingAttempts <= 0) {
        return;
      }
      remainingAttempts -= 1;
      frame = window.requestAnimationFrame(readWhenReady);
    };

    frame = window.requestAnimationFrame(readWhenReady);
    return () => {
      if (frame !== undefined) {
        window.cancelAnimationFrame(frame);
      }
    };
  }, [dashboard.columns, floatEnabled, responsiveEnabled]);

  const saveLayout = () => {
    setLayoutJson(JSON.stringify(dashboard.commands.serializeState(), null, 2));
    setLayoutStatus({ type: "saved" });
  };

  const restoreLayout = () => {
    try {
      const parsed: unknown = JSON.parse(layoutJson);
      const snapshot = sanitizeExampleDashboardStateSnapshot(parsed);
      if (!snapshot) {
        throw new Error("invalid dashboard state snapshot");
      }
      dashboard.commands.restoreLayout(snapshot);
      setLayoutStatus({ type: "restored" });
    } catch {
      setLayoutStatus({ type: "invalidState" });
    }
  };

  const handleLayoutCommit = (snapshot: DashboardLayoutSnapshot) => {
    dashboard.commands.applyLayoutSnapshot(snapshot);
    setCommitStatus({ type: "committed", columns: snapshot.columns });
  };

  const handleWidgetExternalDrop = (event: DashboardWidgetExternalDropEvent) => {
    if (event.targetId !== "trash") {
      return;
    }

    dashboard.commands.removeWidget(event.widgetId);
    const { h, w, x, y } = event.layout;
    setExternalDropStatus({
      type: "diagnostic",
      value: `target=${event.targetId}; widget=${event.widgetId}; columns=${event.columns}; layout=${x},${y},${w},${h}`,
    });
  };

  const compactAndCommit = (layout: "compact" | "list") => {
    const handle = gridRef.current;
    if (!handle?.getGridStack()) {
      setHandleStatus({ type: "notReady" });
      return;
    }

    handle.compact(layout, true);
    const snapshot = handle.commitLayout();
    if (!snapshot) {
      setHandleStatus({ type: "notReady" });
      return;
    }

    setHandleStatus({ type: "compacted", layout });
    window.requestAnimationFrame(refreshGridQueries);
  };

  const queryGridStatus = () => {
    if (refreshGridQueries()) {
      setHandleStatus({ type: "queried" });
    }
  };

  const refreshLayout = () => {
    dashboard.commands.refreshLayout();
    setHandleStatus({ type: "refreshed" });
    window.requestAnimationFrame(refreshGridQueries);
  };

  return (
    <section className="playground-workspace" data-example-mode="advanced">
      <PlaygroundHeader
        description={text(advancedPlaygroundCopy.description)}
        kicker={text(advancedPlaygroundCopy.kicker)}
        title={text(advancedPlaygroundCopy.title)}
      />
      <section aria-label={text(advancedPlaygroundCopy.controls)} className="playground-controls playground-advanced-controls">
        <section aria-label={text(advancedPlaygroundCopy.groups.widgetCrud)} className="example-control-group">
          <h2>{text(advancedPlaygroundCopy.headings.widgets)}</h2>
          <WidgetCrudControls dashboard={dashboard} mode="advanced" />
        </section>

        <section aria-label={text(advancedPlaygroundCopy.groups.columns)} className="example-control-group">
          <h2>{text(advancedPlaygroundCopy.headings.columns)}</h2>
          <div className="example-actions">
            <Select
              id="advanced-columns"
              label={text(sharedPlaygroundCopy.columns.select)}
              options={columnOptions}
              value={String(dashboard.columns)}
              onChange={(value) => dashboard.commands.setColumns(Number(value))}
            />
            <button
              className="example-toggle-button"
              type="button"
              onClick={() => setResponsiveEnabled((value) => !value)}
              {...toggleStateProps(responsiveEnabled)}
            >
              {text(advancedPlaygroundCopy.toggles.responsive)}
            </button>
            <button
              className="example-toggle-button"
              type="button"
              onClick={() => setFloatEnabled((value) => !value)}
              {...toggleStateProps(floatEnabled)}
            >
              {text(advancedPlaygroundCopy.toggles.float)}
            </button>
            <button className="example-toggle-button" type="button" onClick={() => setMovable((value) => !value)} {...toggleStateProps(movable)}>
              <Move aria-hidden="true" size={14} />
              {text(movable ? advancedPlaygroundCopy.toggles.movable : advancedPlaygroundCopy.toggles.notMovable)}
            </button>
            <button className="example-toggle-button" type="button" onClick={() => setResizable((value) => !value)} {...toggleStateProps(resizable)}>
              <Settings2 aria-hidden="true" size={14} />
              {text(resizable ? advancedPlaygroundCopy.toggles.resizable : advancedPlaygroundCopy.toggles.notResizable)}
            </button>
            <button className="example-toggle-button" type="button" onClick={() => setLocked((value) => !value)} {...toggleStateProps(locked)}>
              {locked ? <Unlock aria-hidden="true" size={14} /> : <Lock aria-hidden="true" size={14} />}
              {text(locked ? advancedPlaygroundCopy.toggles.locked : advancedPlaygroundCopy.toggles.unlocked)}
            </button>
          </div>
          <p aria-label={text(sharedPlaygroundCopy.columns.activeStatusLabel)} className="example-status" role="status">
            {sharedPlaygroundCopy.columns.status[locale](dashboard.columns)}
          </p>
          <p aria-label={text(sharedPlaygroundCopy.columns.availableCacheLabel)} className="example-status" role="status">
            {sharedPlaygroundCopy.columns.cacheStatus[locale](cacheKeys)}
          </p>
        </section>

        <section aria-label={text(advancedPlaygroundCopy.groups.handle)} className="example-control-group">
          <h2>{text(advancedPlaygroundCopy.headings.handle)}</h2>
          <div className="example-actions">
            <button type="button" onClick={() => compactAndCommit("compact")}>{text(advancedPlaygroundCopy.actions.compact)}</button>
            <button type="button" onClick={() => compactAndCommit("list")}>{text(advancedPlaygroundCopy.actions.list)}</button>
            <button type="button" onClick={refreshLayout}>{text(advancedPlaygroundCopy.actions.refresh)}</button>
            <button type="button" onClick={queryGridStatus}>{text(advancedPlaygroundCopy.actions.query)}</button>
          </div>
          <p aria-label={text(advancedPlaygroundCopy.statusLabels.handle)} className="example-status" role="status">
            {formatAdvancedHandleStatus(handleStatus, locale)}
          </p>
          <p aria-label={text(advancedPlaygroundCopy.statusLabels.query)} className="example-status" role="status">
            {formatAdvancedDiagnosticStatus(queryStatus, locale)}
          </p>
          <p aria-label={text(advancedPlaygroundCopy.statusLabels.commit)} className="example-status" role="status">
            {formatAdvancedCommitStatus(commitStatus, locale)}
          </p>
        </section>

        <section aria-label={text(advancedPlaygroundCopy.groups.fullState)} className="example-control-group">
          <h2>{text(advancedPlaygroundCopy.headings.fullState)}</h2>
          <div className="example-actions">
            <button type="button" onClick={saveLayout}>
              <Save aria-hidden="true" size={14} />
              {text(advancedPlaygroundCopy.actions.save)}
            </button>
            <button type="button" onClick={restoreLayout}>{text(advancedPlaygroundCopy.actions.restore)}</button>
            <button className="example-action-button example-action-button--danger" type="button" onClick={() => dashboard.commands.clearWidgets()}>
              {text(advancedPlaygroundCopy.actions.clearAll)}
            </button>
          </div>
          <LayoutJson
            id="advanced-layout-json"
            label={sharedPlaygroundCopy.layoutJson.fullState.label}
            status={formatAdvancedLayoutStatus(layoutStatus, locale)}
            statusLabel={sharedPlaygroundCopy.layoutJson.fullState.statusLabel}
            value={layoutJson}
            onChange={setLayoutJson}
          />
        </section>

        <section aria-label={text(advancedPlaygroundCopy.groups.externalDrop)} className="example-external-drop">
          <div
            aria-describedby="advanced-external-drop-status"
            aria-label={text(advancedPlaygroundCopy.externalDrop.label)}
            className="example-external-drop__target"
            data-dashboard-drop-target="trash"
          >
            <Trash2 aria-hidden="true" size={28} />
            <strong>{text(advancedPlaygroundCopy.externalDrop.title)}</strong>
            <span>{text(advancedPlaygroundCopy.externalDrop.description)}</span>
          </div>
          <p aria-label={text(advancedPlaygroundCopy.externalDrop.statusLabel)} id="advanced-external-drop-status" role="status">
            {formatAdvancedDiagnosticStatus(externalDropStatus, locale)}
          </p>
        </section>
      </section>

      <section aria-label={text(advancedPlaygroundCopy.dashboard)} className="playground-grid-region">
        <p className="example-widget-count">
          {text(sharedPlaygroundCopy.widgetCount).replace("{count}", String(dashboard.widgets.length))}
        </p>
        <DashboardGrid
          ref={gridRef}
          actionLabels={resolveDashboardActionLabels(locale)}
          columns={dashboard.columns}
          engineOptions={{ animate: false, float: floatEnabled }}
          externalDropTargets={externalDropTargets}
          movable={movable && !locked}
          refreshKey={dashboard.refreshVersion}
          resizable={resizable && !locked}
          responsive={responsiveEnabled ? responsiveOptions : undefined}
          widgets={presentedWidgets}
          onColumnsChange={dashboard.commands.setColumns}
          onLayoutCommit={handleLayoutCommit}
          onMaximizeWidget={dashboard.commands.maximizeWidget}
          onMinimizeWidget={dashboard.commands.minimizeWidget}
          onRemoveWidget={dashboard.commands.removeWidget}
          onRestoreWidget={dashboard.commands.restoreWidget}
          onWidgetExternalDrop={handleWidgetExternalDrop}
          onWidgetHeaderDoubleClick={dashboard.commands.fitWidgetToColumns}
          renderWidget={(widget) => (
            <div className="dashboard-widget-body">
              <span>{widget.data?.description}</span>
              <strong>{widget.data?.value}</strong>
            </div>
          )}
        />
      </section>
    </section>
  );
}
