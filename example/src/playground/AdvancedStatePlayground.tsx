import { useMemo, useState } from "react";

import { DASHBOARD_COLUMN_COUNTS, useDashboardGrid } from "../../../src";
import { Select } from "../components/ui/select";
import { usePlaygroundLocale } from "../i18n/playground-locale";
import { DashboardPreview, PlaygroundHeader } from "./components/DashboardPreview";
import { LayoutJson } from "./components/LayoutJson";
import {
  advancedStateCopy,
  formatAdvancedStateStatus,
  sharedPlaygroundCopy,
  type AdvancedStateEditorStatus,
} from "./copy";
import { createLayoutPlaygroundFixture } from "./fixtures";
import { sanitizeDashboardLayoutSnapshot, sanitizeExampleDashboardStateSnapshot } from "./state-snapshot";
import type { ExampleWidgetData } from "./types";

const initialStatus: AdvancedStateEditorStatus = { type: "initial" };

export function AdvancedStatePlayground() {
  const { locale, text } = usePlaygroundLocale();
  const dashboard = useDashboardGrid<ExampleWidgetData>({
    initialColumns: 12,
    initialWidgets: createLayoutPlaygroundFixture(),
  });
  const [layoutJson, setLayoutJson] = useState("");
  const [fullStateJson, setFullStateJson] = useState("");
  const [layoutStatus, setLayoutStatus] = useState<AdvancedStateEditorStatus>(initialStatus);
  const [fullStateStatus, setFullStateStatus] = useState<AdvancedStateEditorStatus>(initialStatus);
  const cacheKeys = useMemo(
    () => Object.keys(dashboard.commands.serializeState().layoutsByColumn ?? {}).sort((left, right) => Number(left) - Number(right)),
    [dashboard.columns, dashboard.widgets],
  );

  const saveLayoutSnapshot = () => {
    setLayoutJson(JSON.stringify(dashboard.commands.serializeLayout(), null, 2));
    setLayoutStatus({ type: "saved" });
  };

  const restoreLayoutSnapshot = () => {
    try {
      const snapshot = sanitizeDashboardLayoutSnapshot(JSON.parse(layoutJson));
      if (!snapshot) {
        setLayoutStatus({ type: "invalid" });
        return;
      }
      dashboard.commands.applyLayoutSnapshot(snapshot);
      setLayoutStatus({ type: "restored" });
    } catch {
      setLayoutStatus({ type: "invalid" });
    }
  };

  const saveFullState = () => {
    setFullStateJson(JSON.stringify(dashboard.commands.serializeState(), null, 2));
    setFullStateStatus({ type: "saved" });
  };

  const restoreFullState = () => {
    try {
      const snapshot = sanitizeExampleDashboardStateSnapshot(JSON.parse(fullStateJson));
      if (!snapshot) {
        setFullStateStatus({ type: "invalid" });
        return;
      }
      dashboard.commands.restoreLayout(snapshot);
      setFullStateStatus({ type: "restored" });
    } catch {
      setFullStateStatus({ type: "invalid" });
    }
  };

  return (
    <section className="playground-workspace" data-example-mode="advanced-state">
      <PlaygroundHeader
        description={text(advancedStateCopy.description)}
        kicker={text(advancedStateCopy.kicker)}
        title={text(advancedStateCopy.title)}
      />

      <section aria-label={text(advancedStateCopy.controls)} className="playground-controls playground-state-controls">
        <div className="playground-state-toolbar">
          <Select
            id="advanced-state-columns"
            label={text(advancedStateCopy.columns)}
            options={DASHBOARD_COLUMN_COUNTS.map((columns) => ({ label: String(columns), value: String(columns) }))}
            value={String(dashboard.columns)}
            onChange={(value) => dashboard.commands.setColumns(Number(value))}
          />
          <p aria-label={text(sharedPlaygroundCopy.columns.activeStatusLabel)} role="status">
            {sharedPlaygroundCopy.columns.status[locale](dashboard.columns)}
          </p>
          <p aria-label={text(sharedPlaygroundCopy.columns.availableCacheLabel)} role="status">
            {sharedPlaygroundCopy.columns.cacheStatus[locale](cacheKeys.join(", "))}
          </p>
          <button disabled={dashboard.widgets.length === 0} type="button" onClick={dashboard.commands.clearWidgets}>
            {text(sharedPlaygroundCopy.clearAll)}
          </button>
        </div>

        <table className="playground-state-comparison">
          <thead>
            <tr>
              <th scope="col">{text(advancedStateCopy.table.subject)}</th>
              <th scope="col">{text(advancedStateCopy.table.value)}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">{text(advancedStateCopy.table.layout)}</th>
              <td>{text(advancedStateCopy.table.layoutDescription)}</td>
            </tr>
            <tr>
              <th scope="row">{text(advancedStateCopy.table.full)}</th>
              <td>{text(advancedStateCopy.table.fullDescription)}</td>
            </tr>
            <tr>
              <th scope="row">{text(advancedStateCopy.table.cache)}</th>
              <td>{text(advancedStateCopy.table.cacheDescription)}</td>
            </tr>
            <tr>
              <th scope="row">{text(advancedStateCopy.table.memory)}</th>
              <td>{text(advancedStateCopy.table.memoryDescription)}</td>
            </tr>
          </tbody>
        </table>

        <div className="playground-state-editors">
          <LayoutJson
            actions={(
              <div className="example-actions">
                <button type="button" onClick={saveLayoutSnapshot}>{text(advancedStateCopy.actions.saveLayout)}</button>
                <button type="button" onClick={restoreLayoutSnapshot}>{text(advancedStateCopy.actions.restoreLayout)}</button>
              </div>
            )}
            id="advanced-layout-json"
            label={{ ko: "레이아웃 JSON", en: "Layout JSON" }}
            status={formatAdvancedStateStatus("layout", layoutStatus, locale)}
            statusLabel={sharedPlaygroundCopy.layoutJson.active.statusLabel}
            summary={advancedStateCopy.editors.layout}
            value={layoutJson}
            onChange={setLayoutJson}
          />
          <LayoutJson
            actions={(
              <div className="example-actions">
                <button type="button" onClick={saveFullState}>{text(advancedStateCopy.actions.saveFull)}</button>
                <button type="button" onClick={restoreFullState}>{text(advancedStateCopy.actions.restoreFull)}</button>
              </div>
            )}
            id="advanced-full-state-json"
            label={sharedPlaygroundCopy.layoutJson.fullState.label}
            status={formatAdvancedStateStatus("full", fullStateStatus, locale)}
            statusLabel={sharedPlaygroundCopy.layoutJson.fullState.statusLabel}
            summary={advancedStateCopy.editors.full}
            value={fullStateJson}
            onChange={setFullStateJson}
          />
        </div>
      </section>

      <section aria-label={text(advancedStateCopy.dashboard)} className="playground-grid-region">
        <DashboardPreview dashboard={dashboard} showControls={false} />
      </section>
    </section>
  );
}
