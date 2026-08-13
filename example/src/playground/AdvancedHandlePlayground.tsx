import { useEffect, useMemo, useRef, useState } from "react";

import { DashboardGrid, useDashboardGrid } from "../../../src";
import type { DashboardGridHandle } from "../../../src";
import { usePlaygroundLocale } from "../i18n/playground-locale";
import { PlaygroundHeader } from "./components/DashboardPreview";
import {
  advancedHandleCopy,
  createPresentedWidgets,
  resolveDashboardActionLabels,
  sharedPlaygroundCopy,
} from "./copy";
import { createAdvancedPlaygroundFixture } from "./fixtures";
import { pastelColor } from "./palette";
import type { ExampleWidgetData } from "./types";

type QueryResult = { type: "initial" } | { type: "not-ready" } | { type: "value"; value: string };
type HandleResult = "cell-height-80" | "committed" | "initial" | "not-ready" | "refreshed";

function createHandleFixture() {
  return createAdvancedPlaygroundFixture().map((widget) => widget.id === "alerts"
    ? { ...widget, layout: { ...widget.layout, y: 5 } }
    : widget);
}

export function AdvancedHandlePlayground() {
  const { locale, text } = usePlaygroundLocale();
  const layoutRef = useRef<DashboardGridHandle>(null);
  const dashboard = useDashboardGrid<ExampleWidgetData>({
    initialColumns: 12,
    initialWidgets: createHandleFixture(),
  });
  const [queryResult, setQueryResult] = useState<QueryResult>({ type: "initial" });
  const [handleResult, setHandleResult] = useState<HandleResult>("initial");
  const presentedWidgets = useMemo(
    () => createPresentedWidgets(dashboard.widgets, locale),
    [dashboard.widgets, locale],
  );

  useEffect(() => {
    const bridge = { getHandle: () => layoutRef.current };
    window.__cominsGridLayoutHandleExample = bridge;

    return () => {
      if (window.__cominsGridLayoutHandleExample === bridge) {
        delete window.__cominsGridLayoutHandleExample;
      }
    };
  }, []);

  const queryGrid = () => {
    const grid = layoutRef.current?.grid;
    if (!grid) {
      setQueryResult({ type: "not-ready" });
      return;
    }
    setQueryResult({ type: "value", value: `column=${grid.getColumn()}; row=${grid.getRow()}` });
  };

  const refreshLayout = () => {
    const handle = layoutRef.current;
    if (!handle?.grid) {
      setHandleResult("not-ready");
      return;
    }
    handle.refresh();
    setHandleResult("refreshed");
  };

  const compactAndCommit = () => {
    const handle = layoutRef.current;
    if (!handle?.grid) {
      setHandleResult("not-ready");
      return;
    }
    handle.compact("compact", true);
    const snapshot = handle.commitLayout();
    if (snapshot) {
      dashboard.commands.applyLayoutSnapshot(snapshot);
    }
    setHandleResult(snapshot ? "committed" : "not-ready");
  };

  const applyOfficialCellHeight = () => {
    const grid = layoutRef.current?.grid;
    if (!grid) {
      setHandleResult("not-ready");
      return;
    }
    grid.cellHeight(80);
    setHandleResult("cell-height-80");
  };

  return (
    <section className="playground-workspace" data-example-mode="advanced-handle">
      <PlaygroundHeader
        description={text(advancedHandleCopy.description)}
        kicker={text(advancedHandleCopy.kicker)}
        title={text(advancedHandleCopy.title)}
      />
      <section aria-label={text(advancedHandleCopy.controls)} className="playground-controls">
        <div className="example-actions">
          <button type="button" onClick={refreshLayout}>{text(advancedHandleCopy.actions.refresh)}</button>
          <button type="button" onClick={compactAndCommit}>{text(advancedHandleCopy.actions.compactCommit)}</button>
          <button type="button" onClick={queryGrid}>{text(advancedHandleCopy.actions.query)}</button>
          <button type="button" onClick={applyOfficialCellHeight}>{text(advancedHandleCopy.actions.cellHeight)}</button>
        </div>
        <p aria-label={text(advancedHandleCopy.statusLabels.query)} role="status">
          {queryResult.type === "value"
            ? queryResult.value
            : text(queryResult.type === "not-ready" ? advancedHandleCopy.status.notReady : advancedHandleCopy.status.initialQuery)}
        </p>
        <p aria-label={text(advancedHandleCopy.statusLabels.handle)} role="status">
          {handleResult === "not-ready"
            ? text(advancedHandleCopy.status.notReady)
            : handleResult === "initial"
              ? text(advancedHandleCopy.status.initialHandle)
              : handleResult}
        </p>
      </section>
      <section aria-label={text(advancedHandleCopy.dashboard)} className="playground-grid-region">
        <p className="example-widget-count">
          {text(sharedPlaygroundCopy.widgetCount).replace("{count}", String(dashboard.widgets.length))}
        </p>
        <DashboardGrid
          ref={layoutRef}
          actionLabels={resolveDashboardActionLabels(locale)}
          columns={dashboard.columns}
          engineOptions={{ cellHeight: 60, float: true }}
          showControls={false}
          widgets={presentedWidgets}
          renderWidget={(widget) => {
            const colors = pastelColor(widget.data?.colorKey ?? "mint");
            return (
              <div className="dashboard-widget-body" style={{ background: colors.background, color: colors.foreground }}>
                <span>{widget.data?.description}</span>
                <strong>{widget.data?.value}</strong>
              </div>
            );
          }}
        />
      </section>
    </section>
  );
}
