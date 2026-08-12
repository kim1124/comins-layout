import { useEffect, useRef, useState } from "react";
import { Boxes, Columns3, RotateCcw, Save } from "lucide-react";

import { DASHBOARD_COLUMN_COUNTS, useDashboardGrid } from "../../../src";
import type { DashboardLayoutSnapshot, DashboardWidgetLayout } from "../../../src";
import { Select } from "../components/ui/select";
import type { SelectOption } from "../components/ui/select";
import { usePlaygroundLocale } from "../i18n/playground-locale";
import { DashboardPreview, PlaygroundHeader } from "./components/DashboardPreview";
import { LayoutJson } from "./components/LayoutJson";
import { WidgetCrudControls } from "./components/WidgetCrudControls";
import {
  formatLayoutJsonStatus,
  formatLayoutOperationStatus,
  layoutPlaygroundCopy,
  sharedPlaygroundCopy,
} from "./copy";
import type { LayoutJsonStatus, LayoutOperationStatus } from "./copy";
import { createLayoutPlaygroundFixture } from "./fixtures";
import { sanitizeDashboardStateSnapshot } from "./state-snapshot";
import type { ExampleWidgetData } from "./types";

const columnOptions: SelectOption[] = DASHBOARD_COLUMN_COUNTS.map((column) => ({
  label: String(column),
  value: String(column),
}));

const layoutLimitKeys = ["minW", "minH", "maxW", "maxH"] as const;

type PendingLayoutOperation = {
  before: string;
  type: "arrange" | "fill";
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isLayout(value: unknown): value is DashboardWidgetLayout {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    [value.x, value.y, value.w, value.h].every((coordinate) => typeof coordinate === "number" && Number.isFinite(coordinate)) &&
    layoutLimitKeys.every((key) => value[key] === undefined || (typeof value[key] === "number" && Number.isFinite(value[key]))) &&
    (value.w as number) > 0 &&
    (value.h as number) > 0
  );
}

function isSupportedColumns(value: unknown): value is DashboardLayoutSnapshot["columns"] {
  return typeof value === "number" && DASHBOARD_COLUMN_COUNTS.includes(value as DashboardLayoutSnapshot["columns"]);
}

function isLayoutSnapshot(value: unknown): value is DashboardLayoutSnapshot {
  return isRecord(value) && isSupportedColumns(value.columns) && Array.isArray(value.widgets) && value.widgets.every(isLayout);
}

export function LayoutPlayground() {
  const { locale, text } = usePlaygroundLocale();
  const dashboard = useDashboardGrid<ExampleWidgetData>({
    initialColumns: 12,
    initialWidgets: createLayoutPlaygroundFixture(),
  });
  const [activeLayoutJson, setActiveLayoutJson] = useState("");
  const [activeLayoutStatus, setActiveLayoutStatus] = useState<LayoutJsonStatus>({ type: "activeMissing" });
  const [fullStateJson, setFullStateJson] = useState("");
  const [fullStateStatus, setFullStateStatus] = useState<LayoutJsonStatus>({ type: "fullMissing" });
  const [operationStatus, setOperationStatus] = useState<LayoutOperationStatus>({ type: "initial" });
  const pendingOperation = useRef<PendingLayoutOperation | null>(null);

  useEffect(() => {
    const pending = pendingOperation.current;
    if (!pending) {
      return;
    }

    pendingOperation.current = null;
    const changed = pending.before !== JSON.stringify(dashboard.commands.serializeLayout());
    setOperationStatus({ type: pending.type, changed });
  }, [dashboard.state]);

  const saveActiveLayout = () => {
    setActiveLayoutJson(JSON.stringify(dashboard.commands.serializeLayout(), null, 2));
    setActiveLayoutStatus({ type: "activeSaved" });
  };

  const restoreActiveLayout = () => {
    try {
      const parsed: unknown = JSON.parse(activeLayoutJson);
      if (!isLayoutSnapshot(parsed)) {
        throw new Error("invalid layout snapshot");
      }
      dashboard.commands.applyLayoutSnapshot(parsed);
      setActiveLayoutStatus({ type: "activeRestored" });
    } catch {
      setActiveLayoutStatus({ type: "invalidLayout" });
    }
  };

  const saveFullState = () => {
    setFullStateJson(JSON.stringify(dashboard.commands.serializeState(), null, 2));
    setFullStateStatus({ type: "fullSaved" });
  };

  const restoreFullState = () => {
    try {
      const parsed: unknown = JSON.parse(fullStateJson);
      const snapshot = sanitizeDashboardStateSnapshot<ExampleWidgetData>(parsed);
      if (!snapshot) {
        throw new Error("invalid state snapshot");
      }
      dashboard.commands.restoreLayout(snapshot);
      setFullStateStatus({ type: "fullRestored" });
    } catch {
      setFullStateStatus({ type: "invalidLayout" });
    }
  };

  const runLayoutOperation = (type: PendingLayoutOperation["type"]) => {
    pendingOperation.current = {
      before: JSON.stringify(dashboard.commands.serializeLayout()),
      type,
    };
    if (type === "fill") {
      dashboard.commands.fitWidgetsToColumns();
      return;
    }
    dashboard.commands.autoArrangeWidgets();
  };

  const resetLayout = () => {
    pendingOperation.current = null;
    dashboard.commands.resetLayout();
    setOperationStatus({ type: "reset" });
  };

  return (
    <section className="playground-workspace" data-example-mode="layout">
      <PlaygroundHeader
        description={text(layoutPlaygroundCopy.description)}
        kicker={text(layoutPlaygroundCopy.kicker)}
        title={text(layoutPlaygroundCopy.title)}
      />
      <section aria-label={text(layoutPlaygroundCopy.controls)} className="playground-controls playground-layout-controls">
        <section aria-label={text(layoutPlaygroundCopy.groups.widgetCrud)} className="example-control-group">
          <h2>{text(layoutPlaygroundCopy.headings.widgetCrud)}</h2>
          <WidgetCrudControls canClear canEdit dashboard={dashboard} mode="layout" />
        </section>

        <section aria-label={text(layoutPlaygroundCopy.groups.columns)} className="example-control-group">
          <h2>{text(layoutPlaygroundCopy.headings.columns)}</h2>
          <div className="example-actions">
            <Select
              id="layout-columns"
              label={text(sharedPlaygroundCopy.columns.select)}
              options={columnOptions}
              value={String(dashboard.columns)}
              onChange={(value) => dashboard.commands.setColumns(Number(value))}
            />
          </div>
          <p aria-label={text(sharedPlaygroundCopy.columns.activeStatusLabel)} className="example-status" role="status">
            {sharedPlaygroundCopy.columns.status[locale](dashboard.columns)}
          </p>
        </section>

        <section aria-label={text(layoutPlaygroundCopy.groups.activeLayout)} className="example-control-group">
          <h2>{text(layoutPlaygroundCopy.headings.activeLayout)}</h2>
          <div className="example-actions">
            <button type="button" onClick={saveActiveLayout}>
              <Save aria-hidden="true" size={14} />
              {text(layoutPlaygroundCopy.actions.saveActive)}
            </button>
            <button type="button" onClick={restoreActiveLayout}>{text(layoutPlaygroundCopy.actions.restoreActive)}</button>
          </div>
          <LayoutJson
            id="layout-active-json"
            label={sharedPlaygroundCopy.layoutJson.active.label}
            status={formatLayoutJsonStatus(activeLayoutStatus, locale)}
            statusLabel={sharedPlaygroundCopy.layoutJson.active.statusLabel}
            value={activeLayoutJson}
            onChange={setActiveLayoutJson}
          />
        </section>

        <section aria-label={text(layoutPlaygroundCopy.groups.fullState)} className="example-control-group">
          <h2>{text(layoutPlaygroundCopy.headings.fullState)}</h2>
          <div className="example-actions">
            <button type="button" onClick={saveFullState}>
              <Save aria-hidden="true" size={14} />
              {text(layoutPlaygroundCopy.actions.saveFull)}
            </button>
            <button type="button" onClick={restoreFullState}>{text(layoutPlaygroundCopy.actions.restoreFull)}</button>
          </div>
          <LayoutJson
            id="layout-full-state-json"
            label={sharedPlaygroundCopy.layoutJson.fullState.label}
            status={formatLayoutJsonStatus(fullStateStatus, locale)}
            statusLabel={sharedPlaygroundCopy.layoutJson.fullState.statusLabel}
            value={fullStateJson}
            onChange={setFullStateJson}
          />
        </section>

        <section aria-label={text(layoutPlaygroundCopy.groups.rearrange)} className="example-control-group">
          <h2>{text(layoutPlaygroundCopy.headings.arrangeReset)}</h2>
          <p className="example-control-description">
            {text(layoutPlaygroundCopy.operationDescription)}
          </p>
          <div className="example-actions">
            <button type="button" onClick={() => runLayoutOperation("arrange")}>
              <Boxes aria-hidden="true" size={14} />
              {text(layoutPlaygroundCopy.actions.arrange)}
            </button>
            <button type="button" onClick={() => runLayoutOperation("fill")}>
              <Columns3 aria-hidden="true" size={14} />
              {text(layoutPlaygroundCopy.actions.fill)}
            </button>
            <button type="button" onClick={resetLayout}>
              <RotateCcw aria-hidden="true" size={14} />
              {text(layoutPlaygroundCopy.actions.reset)}
            </button>
          </div>
          <p aria-label={text(layoutPlaygroundCopy.operationStatusLabel)} className="example-status" role="status">
            {formatLayoutOperationStatus(operationStatus, locale)}
          </p>
        </section>
      </section>
      <section aria-label={text(layoutPlaygroundCopy.dashboard)} className="playground-grid-region">
        <DashboardPreview dashboard={dashboard} onLayoutCommit={dashboard.commands.applyLayoutSnapshot} />
      </section>
    </section>
  );
}
